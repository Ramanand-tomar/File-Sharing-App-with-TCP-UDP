import 'react-native-get-random-values';
import React, {
  createContext,
  FC,
  useCallback,
  useContext,
  useRef,
  useState,
} from 'react';
import { useChunkStore } from '../db/chunkStore';
import TcpSocket from 'react-native-tcp-socket';
import DeviceInfo from 'react-native-device-info';
import { Alert, Platform } from 'react-native';
import RNFS from 'react-native-fs';
import { v4 as uuidv4 } from 'uuid';
import { produce } from 'immer';
import { Buffer } from 'buffer';
import { receivedChunkAck, receiveFileAck, safeSend, sendChunkAck } from './TCPUtils';
import { FramedSocket } from '../protocol/FramedSocket';
import {
  MessageType,
  CURRENT_PROTOCOL_VERSION,
  DEFAULT_CHUNK_SIZE,
} from '../protocol/ProtocolMessages';

interface TCPContextType {
  server: any;
  client: any;
  isConnected: boolean;
  connectedDevice: any;
  sentFiles: any;
  receivedFiles: any;
  totalSendBytes: number;
  totalReceivedBytes: number;
  startServer: (port: number) => void;
  connectToServer: (host: string, port: number, deviceName: string) => void;
  sendMessage: (message: string | Buffer | any) => void;
  sendFileAck: (file: any, type: 'file' | 'image') => void;
  disconnect: () => void;
}

const TCPContext = createContext<TCPContextType | undefined>(undefined);

export const useTCP = (): TCPContextType => {
  const context = useContext(TCPContext);
  if (!context) {
    throw new Error('useTCP must be used within a TCPProvider');
  }
  return context;
};

const options = {
  keystore: require('../../tls_certs/server-keystore.p12'),
};

export const TCPProvider: FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [server, setServer] = useState<any>(null);
  const [client, setClient] = useState<FramedSocket | null>(null);
  const [serverSocket, setServerSocket] = useState<FramedSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectedDevice, setConnectedDevice] = useState<any>(null);
  const [sentFiles, setSentFiles] = useState<any>([]);
  const [receivedFiles, setReceivedFiles] = useState<any>([]);
  const [totalSendBytes, setTotalSendBytes] = useState<number>(0);
  const [totalReceivedBytes, setTotalReceivedBytes] = useState<number>(0);

  // Store ref to active socket so callbacks always have latest reference
  const activeSocketRef = useRef<FramedSocket | null>(null);

  const { currentChunkSet, setCurrentChunkSet, setChunkStore } =
    useChunkStore();

  const handleCleanup = useCallback(() => {
    setReceivedFiles([]);
    setSentFiles([]);
    setCurrentChunkSet(null);
    setTotalReceivedBytes(0);
    setTotalSendBytes(0);
    setChunkStore(null);
    setIsConnected(false);
    setConnectedDevice(null);
    activeSocketRef.current = null;
  }, [setCurrentChunkSet, setChunkStore]);

  // Disconnect
  const disconnect = useCallback(() => {
    if (client) {
      client.destroy();
      setClient(null);
    }
    if (serverSocket) {
      serverSocket.destroy();
      setServerSocket(null);
    }
    if (server) {
      try {
        server.close();
      } catch (e) {
        console.error('Error closing server:', e);
      }
      setServer(null);
    }
    handleCleanup();
  }, [client, serverSocket, server, handleCleanup]);

  // Reconstruct file from received chunks
  const generateFile = async () => {
    const { chunkStore, resetChunkStore } = useChunkStore.getState();
    if (!chunkStore) {
      console.log('[TCPProvider] No Chunks or Files to Process');
      return;
    }
    if (chunkStore.totalChunks !== chunkStore.chunkArray.length) {
      console.error(
        `[TCPProvider] Incomplete chunks: received ${chunkStore.chunkArray.length} of ${chunkStore.totalChunks}`,
      );
      return;
    }

    try {
      const combinedChunks = Buffer.concat(chunkStore.chunkArray);
      const platformPath =
        Platform.OS === 'android'
          ? `${RNFS.DownloadDirectoryPath}/`
          : `${RNFS.DocumentDirectoryPath}/`;
      const filePath = `${platformPath}${chunkStore.name}`;

      await RNFS.writeFile(
        filePath,
        combinedChunks.toString('base64'),
        'base64',
      );

      setReceivedFiles((prevFiles: any) =>
        produce(prevFiles, (draftFiles: any) => {
          const fileIndex = draftFiles.findIndex(
            (file: any) => file.id === chunkStore.id,
          );
          if (fileIndex !== -1) {
            draftFiles[fileIndex] = {
              ...draftFiles[fileIndex],
              uri: filePath,
              available: true,
            };
          }
        }),
      );
      console.log('[TCPProvider] File saved successfully to:', filePath);

      resetChunkStore();
    } catch (error) {
      console.error('[TCPProvider] Error combining chunks into File:', error);
    }
  };

  // Dispatcher for incoming parsed protocol messages
  const handleIncomingMessage = useCallback(
    async (parsedData: any, socket: FramedSocket) => {
      if (!parsedData) return;

      const msgType = parsedData.type || parsedData.event;
      console.log(`[TCP] Incoming message: ${msgType}`);

      // Handshake / Connect
      if (parsedData.event === 'connect' || parsedData.type === MessageType.HANDSHAKE) {
        setIsConnected(true);
        const deviceName = parsedData.deviceName || parsedData.device || 'Peer Device';
        setConnectedDevice(deviceName);

        // Acknowledge handshake
        await safeSend(socket, {
          event: 'connect_ack',
          type: MessageType.HANDSHAKE_ACK,
          version: CURRENT_PROTOCOL_VERSION,
          timestamp: Date.now(),
          accepted: true,
          deviceId: DeviceInfo.getDeviceNameSync(),
          deviceName: DeviceInfo.getDeviceNameSync(),
          negotiatedVersion: CURRENT_PROTOCOL_VERSION,
        });
      }

      if (parsedData.type === MessageType.HANDSHAKE_ACK) {
        setIsConnected(true);
        if (parsedData.deviceName) {
          setConnectedDevice(parsedData.deviceName);
        }
      }

      // File Transfer Request / Ack
      if (parsedData.event === 'file_ack' || parsedData.type === MessageType.TRANSFER_REQUEST) {
        const fileInfo = parsedData.file || parsedData;
        receiveFileAck(fileInfo, socket, setReceivedFiles);
      }

      // Chunk request / Ack
      if (parsedData.event === 'send_chunk_ack' || parsedData.type === MessageType.CHUNK_ACK) {
        const chunkIndex =
          parsedData.chunkNo !== undefined
            ? parsedData.chunkNo
            : parsedData.chunkIndex !== undefined
            ? parsedData.chunkIndex
            : parsedData.nextExpectedChunk || 0;

        sendChunkAck(
          chunkIndex,
          socket,
          setTotalSendBytes,
          setSentFiles,
        );
      }

      // Chunk data received (handles both 'receive_chunk_ack' and 'received_chunk_ack')
      if (
        parsedData.event === 'receive_chunk_ack' ||
        parsedData.event === 'received_chunk_ack' ||
        parsedData.type === MessageType.CHUNK
      ) {
        const chunkData = parsedData.chunk || parsedData.data;
        const chunkIndex =
          parsedData.chunkNo !== undefined
            ? parsedData.chunkNo
            : parsedData.chunkIndex;

        receivedChunkAck(
          chunkData,
          chunkIndex,
          socket,
          setTotalReceivedBytes,
          generateFile,
        );
      }

      // Ping / Pong
      if (parsedData.type === MessageType.PING) {
        safeSend(socket, {
          type: MessageType.PONG,
          version: CURRENT_PROTOCOL_VERSION,
          timestamp: Date.now(),
        });
      }
    },
    [],
  );

  // Start TLS Server
  const startServer = useCallback(
    (port: number) => {
      if (server) {
        console.log('[TCPProvider] Server already started');
        return;
      }

      const newServer = TcpSocket.createTLSServer(options, (socket: any) => {
        console.log('[TCPProvider] Inbound client connection accepted');
        socket.setNoDelay(true);
        socket.readableHighWaterMark = 1024 * 1024;
        socket.writableHighWaterMark = 1024 * 1024;

        const framed = new FramedSocket(socket);
        setServerSocket(framed);
        activeSocketRef.current = framed;

        framed.onMessage(data => handleIncomingMessage(data, framed));

        framed.onClose(() => {
          console.log('[TCPProvider] Client connection closed');
          setServerSocket(null);
          handleCleanup();
        });

        framed.onError((error: any) => {
          console.error('[TCPProvider] Server socket error:', error);
        });
      });

      newServer.listen({ port, host: '0.0.0.0' }, () => {
        const address = newServer.address();
        console.log(
          `[TCPProvider] Server listening on ${address?.address}:${address?.port}`,
        );
      });

      newServer.on('error', (error: any) => {
        console.error('[TCPProvider] Server Error:', error);
      });

      setServer(newServer);
    },
    [server, handleIncomingMessage, handleCleanup],
  );

  // Connect to TLS Server
  const connectToServer = useCallback(
    (host: string, port: number, deviceName: string) => {
      console.log(`[TCPProvider] Connecting to ${host}:${port} (${deviceName})...`);

      const rawClient = TcpSocket.connectTLS(
        {
          host,
          port,
          cert: true,
          ca: require('../../tls_certs/server-cert.pem'),
        },
        () => {
          console.log('[TCPProvider] Connected to server successfully');
          setConnectedDevice(deviceName);
          setIsConnected(true);

          const framed = new FramedSocket(rawClient);
          setClient(framed);
          activeSocketRef.current = framed;

          const myDeviceName = DeviceInfo.getDeviceNameSync();
          framed.send({
            event: 'connect',
            type: MessageType.HANDSHAKE,
            version: CURRENT_PROTOCOL_VERSION,
            timestamp: Date.now(),
            deviceId: myDeviceName,
            deviceName: myDeviceName,
            device: myDeviceName, // legacy compatibility
            platform: Platform.OS as 'android' | 'ios',
            supportedVersions: [CURRENT_PROTOCOL_VERSION],
          });

          framed.onMessage(data => handleIncomingMessage(data, framed));

          framed.onClose(() => {
            console.log('[TCPProvider] Client connection closed');
            setClient(null);
            handleCleanup();
          });

          framed.onError((error: any) => {
            console.error('[TCPProvider] Client socket error:', error);
          });
        },
      );

      rawClient.setNoDelay(true);
      rawClient.readableHighWaterMark = 1024 * 1024;
      rawClient.writableHighWaterMark = 1024 * 1024;
    },
    [handleIncomingMessage, handleCleanup],
  );

  // Send generic framed message
  const sendMessage = useCallback(
    async (message: string | Buffer | any) => {
      const activeSocket = client || serverSocket || activeSocketRef.current;
      if (activeSocket) {
        await safeSend(activeSocket, message);
      } else {
        console.error('[TCPProvider] sendMessage: No active client or server socket');
      }
    },
    [client, serverSocket],
  );

  // Initiate file send
  const sendFileAck = async (file: any, type: 'file' | 'image') => {
    if (currentChunkSet !== null) {
      Alert.alert('Transfer Busy', 'Please wait for current file transfer to complete.');
      return;
    }

    const activeSocket = client || serverSocket || activeSocketRef.current;
    if (!activeSocket) {
      Alert.alert('Not Connected', 'No active peer connection found.');
      return;
    }

    try {
      const normalizedPath =
        Platform.OS === 'ios' ? file?.uri?.replace('file://', '') : file?.uri;
      const fileData = await RNFS.readFile(normalizedPath, 'base64');
      const buffer = Buffer.from(fileData, 'base64');
      const CHUNK_SIZE = DEFAULT_CHUNK_SIZE; // 64 KB per chunk

      let totalChunks = 0;
      let offset = 0;
      const chunkArray: Buffer[] = [];

      while (offset < buffer.length) {
        const chunk = buffer.slice(offset, offset + CHUNK_SIZE);
        chunkArray.push(chunk);
        offset += CHUNK_SIZE;
        totalChunks++;
      }

      const rawData = {
        id: uuidv4(),
        name: type === 'file' ? file?.name : file?.fileName,
        size: buffer.length,
        mimeType: type === 'file' ? 'file' : '.jpg',
        totalChunks,
      };

      setCurrentChunkSet({
        id: rawData.id,
        chunkArray,
        totalChunks,
      });

      setSentFiles((prevData: any) =>
        produce(prevData, (draft: any) => {
          draft.push({
            ...rawData,
            uri: file?.uri,
            available: false,
          });
        }),
      );

      console.log(`[TCPProvider] Sending file transfer request for "${rawData.name}" (${totalChunks} chunks)`);

      await safeSend(activeSocket, {
        event: 'file_ack',
        type: MessageType.TRANSFER_REQUEST,
        version: CURRENT_PROTOCOL_VERSION,
        timestamp: Date.now(),
        transferId: rawData.id,
        fileId: rawData.id,
        fileName: rawData.name,
        fileSize: rawData.size,
        mimeType: rawData.mimeType,
        totalChunks,
        chunkSize: CHUNK_SIZE,
        file: rawData, // legacy compatibility
      });
    } catch (error) {
      console.error('[TCPProvider] Error in sendFileAck:', error);
      Alert.alert('Error', 'Failed to read file for transfer');
    }
  };

  return (
    <TCPContext.Provider
      value={{
        server,
        client,
        connectedDevice,
        sentFiles,
        receivedFiles,
        totalSendBytes,
        totalReceivedBytes,
        isConnected,
        startServer,
        connectToServer,
        sendMessage,
        sendFileAck,
        disconnect,
      }}
    >
      {children}
    </TCPContext.Provider>
  );
};
