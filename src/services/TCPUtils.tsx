import { produce } from 'immer';
import { Alert } from 'react-native';
import { useChunkStore } from '../db/chunkStore';
import { Buffer } from 'buffer';
import { FrameParser } from '../protocol/FrameParser';
import { MessageType, CURRENT_PROTOCOL_VERSION } from '../protocol/ProtocolMessages';

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

export const receiveFileAck = async (
  data: any,
  socket: any,
  setReceivedFiles: any,
): Promise<void> => {
  const { setChunkStore, chunkStore } = useChunkStore.getState();

  if (chunkStore) {
    Alert.alert('File Transfer In Progress', 'Please wait for the current file transfer to finish.');
    return;
  }

  const fileData = {
    id: data?.id || data?.transferId,
    name: data?.name || data?.fileName,
    size: data?.size || data?.fileSize || 0,
    mimeType: data?.mimeType || 'file',
    totalChunks: data?.totalChunks || 0,
    available: false,
  };

  setReceivedFiles((prevFiles: any) =>
    produce(prevFiles, (draft: any) => {
      draft.push(fileData);
    }),
  );

  setChunkStore({
    id: fileData.id,
    totalChunks: fileData.totalChunks,
    name: fileData.name,
    size: fileData.size,
    mimeType: fileData.mimeType,
    chunkArray: [],
  });

  if (!socket) {
    console.warn('[TCPUtils] receiveFileAck: Socket not available');
    return;
  }

  try {
    console.log('[TCPUtils] File acknowledged, requesting first chunk (0)');
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

  try {
    const chunkBuffer = currentChunkSet?.chunkArray?.[chunkIndex];
    if (!chunkBuffer) {
      console.warn(`[TCPUtils] Chunk at index ${chunkIndex} does not exist in chunkArray`);
      return;
    }

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
      chunkSize: chunkBuffer.length,
      chunk: chunkBuffer.toString('base64'), // legacy field
      data: chunkBuffer.toString('base64'),
    });

    setTotalSendBytes((prevBytes: number) => prevBytes + chunkBuffer.length);

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
    console.error('[TCPUtils] Error sending chunk:', error);
  }
};

export const receivedChunkAck = async (
  chunk: string,
  chunkNo: number,
  socket: any,
  setTotalReceivedBytes: any,
  generateFile: () => Promise<void>,
): Promise<void> => {
  const { chunkStore, resetChunkStore, setChunkStore } = useChunkStore.getState();

  if (!chunkStore) {
    Alert.alert('Transfer Error', 'There is no active file being received.');
    return;
  }

  try {
    const bufferChunk = Buffer.from(chunk, 'base64');
    const updateChunkArray = [...(chunkStore.chunkArray || [])];
    updateChunkArray[chunkNo] = bufferChunk;
    setChunkStore({ ...chunkStore, chunkArray: updateChunkArray });
    setTotalReceivedBytes((prevBytes: number) => prevBytes + bufferChunk.length);
  } catch (error) {
    console.error('[TCPUtils] Error processing chunk:', error);
  }

  if (!socket) {
    console.warn('[TCPUtils] receivedChunkAck: Socket not available');
    return;
  }

  if (chunkNo + 1 >= chunkStore.totalChunks) {
    console.log('[TCPUtils] All chunks received! Reconstructing file...');
    await generateFile();
    resetChunkStore();
    return;
  }

  try {
    console.log(`[TCPUtils] Requesting next chunk: ${chunkNo + 1}/${chunkStore.totalChunks}`);
    await safeSend(socket, {
      event: 'send_chunk_ack',
      type: MessageType.CHUNK_ACK,
      version: CURRENT_PROTOCOL_VERSION,
      timestamp: Date.now(),
      transferId: chunkStore.id,
      fileId: chunkStore.id,
      chunkNo: chunkNo + 1,
      chunkIndex: chunkNo + 1,
      nextExpectedChunk: chunkNo + 1,
    });
  } catch (error) {
    console.error('[TCPUtils] Error requesting next chunk:', error);
  }
};
