import { produce } from 'immer';
import { Alert } from 'react-native';
import { useChunkStore } from '../db/chunkStore';
import { Buffer } from 'buffer';
import { FrameParser } from '../protocol/FrameParser';
import { MessageType, CURRENT_PROTOCOL_VERSION } from '../protocol/ProtocolMessages';
import { FileTransferManager } from './FileTransferManager';

/**
 * Sends a message over either a FramedSocket or a raw TcpSocket using framed encoding.
 */
export const safeSend = async (socket: any, message: any): Promise<boolean> => {
  if (!socket) {
    console.warn('[TCPUtils] safeSend: Socket not available');
    return false;
  }

  try {
    if (typeof socket.send === 'function') {
      return await socket.send(message);
    } else if (typeof socket.write === 'function') {
      const frame = FrameParser.encode(message);
      return socket.write(frame);
    }
  } catch (error) {
    console.error('[TCPUtils] safeSend error:', error);
    return false;
  }
  return false;
};

/**
 * Receiver handles incoming file transfer proposal.
 * Creates a .part temporary file on disk and acknowledges readiness.
 */
export const receiveFileAck = async (
  data: any,
  socket: any,
  setReceivedFiles: any,
): Promise<void> => {
  const { setChunkStore, chunkStore } = useChunkStore.getState();

  if (chunkStore) {
    Alert.alert('Transfer Busy', 'Please wait for current file transfer to finish.');
    return;
  }

  const fileData = {
    id: data?.id || data?.transferId || data?.fileId,
    name: data?.name || data?.fileName || 'received_file',
    size: Number(data?.size || data?.fileSize || 0),
    mimeType: data?.mimeType || 'file',
    totalChunks: Number(data?.totalChunks || 1),
    chunkSize: Number(data?.chunkSize || FileTransferManager.getChunkSize()),
    checksum: data?.checksum,
    available: false,
  };

  const tempFilePath = FileTransferManager.getTempFilePath(fileData.id, fileData.name);

  setReceivedFiles((prevFiles: any) =>
    produce(prevFiles, (draft: any) => {
      draft.push({
        ...fileData,
        tempFilePath,
      });
    }),
  );

  setChunkStore({
    ...fileData,
    tempFilePath,
    receivedChunksCount: 0,
    receivedChunks: new Set<number>(),
    chunkArray: [], // legacy compatibility
  });

  if (!socket) {
    console.warn('[TCPUtils] receiveFileAck: Socket not available');
    return;
  }

  try {
    console.log(`[TCPUtils] Initialized streaming receiver for "${fileData.name}" (${fileData.totalChunks} chunks)`);
    await safeSend(socket, {
      event: 'send_chunk_ack',
      type: MessageType.CHUNK_ACK,
      version: CURRENT_PROTOCOL_VERSION,
      timestamp: Date.now(),
      transferId: fileData.id,
      fileId: fileData.id,
      chunkNo: 0,
      chunkIndex: 0,
      nextExpectedChunk: 0,
    });
  } catch (error) {
    console.error('[TCPUtils] Error requesting first chunk:', error);
  }
};

/**
 * Sender handles chunk request from receiver.
 * Reads chunk from disk on-the-fly and sends framed packet.
 */
export const sendChunkAck = async (
  chunkIndex: number,
  socket: any,
  setTotalSendBytes: any,
  setSentFiles: any,
): Promise<void> => {
  const { currentChunkSet, resetCurrentChunkSet } = useChunkStore.getState();

  if (!currentChunkSet) {
    Alert.alert('Transfer Error', 'There are no active chunks to be sent.');
    return;
  }

  if (!socket) {
    console.warn('[TCPUtils] sendChunkAck: Socket not available');
    return;
  }

  const totalChunks = currentChunkSet.totalChunks;
  const chunkSize = currentChunkSet.chunkSize || FileTransferManager.getChunkSize();

  try {
    let base64Chunk: string;

    // Use streaming disk read if filePath is available
    if (currentChunkSet.filePath) {
      base64Chunk = await FileTransferManager.readChunk(
        currentChunkSet.filePath,
        chunkIndex,
        chunkSize,
      );
    } else if (
      currentChunkSet.chunkArray &&
      currentChunkSet.chunkArray[chunkIndex]
    ) {
      // Legacy fallback
      base64Chunk = currentChunkSet.chunkArray[chunkIndex].toString('base64');
    } else {
      console.warn(`[TCPUtils] Chunk at index ${chunkIndex} could not be read`);
      return;
    }

    const chunkByteLength = Math.round((base64Chunk.length * 3) / 4);

    // Send framed chunk data
    await safeSend(socket, {
      event: 'received_chunk_ack', // legacy field for backward compatibility
      type: MessageType.CHUNK,
      version: CURRENT_PROTOCOL_VERSION,
      timestamp: Date.now(),
      transferId: currentChunkSet.id,
      fileId: currentChunkSet.id,
      chunkNo: chunkIndex,
      chunkIndex: chunkIndex,
      totalChunks: totalChunks,
      chunkSize: chunkByteLength,
      chunk: base64Chunk, // legacy field
      data: base64Chunk,
    });

    setTotalSendBytes((prevBytes: number) => prevBytes + chunkByteLength);

    if (chunkIndex + 1 >= totalChunks) {
      console.log('[TCPUtils] All chunks sent successfully for file:', currentChunkSet.id);
      setSentFiles((prevFiles: any) =>
        produce(prevFiles, (draft: any) => {
          const fileIndex = draft.findIndex(
            (file: any) => file.id === currentChunkSet.id,
          );
          if (fileIndex !== -1) {
            draft[fileIndex].available = true;
          }
        }),
      );
      resetCurrentChunkSet();
    }
  } catch (error) {
    console.error(`[TCPUtils] Error streaming chunk ${chunkIndex}:`, error);
  }
};

/**
 * Receiver handles incoming chunk data.
 * Writes chunk directly to disk without memory buffering.
 */
export const receivedChunkAck = async (
  chunk: string,
  chunkNo: number,
  socket: any,
  setTotalReceivedBytes: any,
  setReceivedFiles: any,
): Promise<void> => {
  const { chunkStore, resetChunkStore } = useChunkStore.getState();

  if (!chunkStore) {
    console.warn('[TCPUtils] receivedChunkAck: No active chunkStore found');
    return;
  }

  const chunkSize = chunkStore.chunkSize || FileTransferManager.getChunkSize();
  const chunkByteLength = Math.round((chunk.length * 3) / 4);

  try {
    if (chunkStore.tempFilePath) {
      // Stream directly to disk!
      await FileTransferManager.writeChunk(
        chunkStore.tempFilePath,
        chunkNo,
        chunkSize,
        chunk,
      );
    }

    if (chunkStore.receivedChunks) {
      chunkStore.receivedChunks.add(chunkNo);
    }

    setTotalReceivedBytes((prevBytes: number) => prevBytes + chunkByteLength);
  } catch (error) {
    console.error(`[TCPUtils] Error streaming chunk ${chunkNo} to disk:`, error);
  }

  if (!socket) {
    console.warn('[TCPUtils] receivedChunkAck: Socket not available');
    return;
  }

  const receivedCount = chunkStore.receivedChunks
    ? chunkStore.receivedChunks.size
    : chunkNo + 1;

  if (receivedCount >= chunkStore.totalChunks) {
    console.log(`[TCPUtils] All ${chunkStore.totalChunks} chunks received. Finalizing file...`);
    try {
      if (chunkStore.tempFilePath) {
        const { finalPath, verified } = await FileTransferManager.finalizeReceivedFile(
          chunkStore.tempFilePath,
          chunkStore.name,
          chunkStore.checksum,
        );

        setReceivedFiles((prevFiles: any) =>
          produce(prevFiles, (draft: any) => {
            const fileIndex = draft.findIndex(
              (file: any) => file.id === chunkStore.id,
            );
            if (fileIndex !== -1) {
              draft[fileIndex].uri = finalPath;
              draft[fileIndex].available = true;
              draft[fileIndex].verified = verified;
            }
          }),
        );

        console.log(`[TCPUtils] File successfully finalized at: ${finalPath} (Integrity verified: ${verified})`);
      }
    } catch (finalizeErr) {
      console.error('[TCPUtils] Error finalizing received file:', finalizeErr);
    }

    resetChunkStore();
    return;
  }

  try {
    const nextChunk = chunkNo + 1;
    await safeSend(socket, {
      event: 'send_chunk_ack',
      type: MessageType.CHUNK_ACK,
      version: CURRENT_PROTOCOL_VERSION,
      timestamp: Date.now(),
      transferId: chunkStore.id,
      fileId: chunkStore.id,
      chunkNo: nextChunk,
      chunkIndex: nextChunk,
      nextExpectedChunk: nextChunk,
    });
  } catch (error) {
    console.error('[TCPUtils] Error requesting next chunk:', error);
  }
};
