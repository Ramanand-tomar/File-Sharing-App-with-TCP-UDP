/**
 * Protocol Message Definitions for Peer-to-Peer File Transfer
 *
 * Implements a strongly-typed, framed communication protocol
 * designed for robust TCP transmission without stream fragmentation issues.
 */

export const CURRENT_PROTOCOL_VERSION = 1;
export const MAX_FRAME_PAYLOAD_SIZE = 16 * 1024 * 1024; // 16 MB max frame payload
export const DEFAULT_CHUNK_SIZE = 64 * 1024; // 64 KB per chunk for optimal throughput

export enum MessageType {
  // Connection Handshake
  HANDSHAKE = 'HANDSHAKE',
  HANDSHAKE_ACK = 'HANDSHAKE_ACK',

  // Transfer Negotiation
  TRANSFER_REQUEST = 'TRANSFER_REQUEST',
  TRANSFER_ACCEPT = 'TRANSFER_ACCEPT',
  TRANSFER_REJECT = 'TRANSFER_REJECT',

  // Data Transmission
  CHUNK = 'CHUNK',
  CHUNK_ACK = 'CHUNK_ACK',
  CHUNK_NACK = 'CHUNK_NACK',

  // Lifecycle & Control
  TRANSFER_PAUSE = 'TRANSFER_PAUSE',
  TRANSFER_RESUME = 'TRANSFER_RESUME',
  TRANSFER_CANCEL = 'TRANSFER_CANCEL',
  TRANSFER_COMPLETE = 'TRANSFER_COMPLETE',
  TRANSFER_VERIFY = 'TRANSFER_VERIFY',

  // Heartbeat & Errors
  PING = 'PING',
  PONG = 'PONG',
  ERROR = 'ERROR',
}

export interface BaseMessage {
  version: number;
  type: MessageType;
  timestamp: number;
}

// 1. Handshake
export interface HandshakeMessage extends BaseMessage {
  type: MessageType.HANDSHAKE;
  deviceId: string;
  deviceName: string;
  platform: 'android' | 'ios' | 'other';
  supportedVersions: number[];
}

export interface HandshakeAckMessage extends BaseMessage {
  type: MessageType.HANDSHAKE_ACK;
  accepted: boolean;
  deviceId: string;
  deviceName: string;
  negotiatedVersion: number;
  reason?: string;
}

// 2. Transfer Negotiation
export interface TransferRequestMessage extends BaseMessage {
  type: MessageType.TRANSFER_REQUEST;
  transferId: string;
  fileId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  totalChunks: number;
  chunkSize: number;
  checksum?: string; // Optional full-file SHA-256 for integrity verification
}

export interface TransferAcceptMessage extends BaseMessage {
  type: MessageType.TRANSFER_ACCEPT;
  transferId: string;
  fileId: string;
  startChunkIndex: number; // 0 for new transfer, >0 for resume
}

export interface TransferRejectMessage extends BaseMessage {
  type: MessageType.TRANSFER_REJECT;
  transferId: string;
  fileId: string;
  reason: string;
}

// 3. Chunk Data
export interface ChunkMessage extends BaseMessage {
  type: MessageType.CHUNK;
  transferId: string;
  fileId: string;
  chunkIndex: number;
  totalChunks: number;
  chunkSize: number;
  data: string; // Base64 encoded payload
  chunkChecksum?: string; // Optional CRC32/SHA-256 of this individual chunk
}

export interface ChunkAckMessage extends BaseMessage {
  type: MessageType.CHUNK_ACK;
  transferId: string;
  fileId: string;
  chunkIndex: number;
  nextExpectedChunk: number;
}

export interface ChunkNackMessage extends BaseMessage {
  type: MessageType.CHUNK_NACK;
  transferId: string;
  fileId: string;
  chunkIndex: number;
  reason: string;
}

// 4. Control
export interface TransferPauseMessage extends BaseMessage {
  type: MessageType.TRANSFER_PAUSE;
  transferId: string;
  fileId: string;
}

export interface TransferResumeMessage extends BaseMessage {
  type: MessageType.TRANSFER_RESUME;
  transferId: string;
  fileId: string;
  fromChunkIndex: number;
}

export interface TransferCancelMessage extends BaseMessage {
  type: MessageType.TRANSFER_CANCEL;
  transferId: string;
  fileId: string;
  reason?: string;
}

export interface TransferCompleteMessage extends BaseMessage {
  type: MessageType.TRANSFER_COMPLETE;
  transferId: string;
  fileId: string;
  totalChunks: number;
  totalBytes: number;
  checksum: string;
}

export interface TransferVerifyMessage extends BaseMessage {
  type: MessageType.TRANSFER_VERIFY;
  transferId: string;
  fileId: string;
  verified: boolean;
  error?: string;
}

export interface PingMessage extends BaseMessage {
  type: MessageType.PING;
}

export interface PongMessage extends BaseMessage {
  type: MessageType.PONG;
}

export interface ErrorMessage extends BaseMessage {
  type: MessageType.ERROR;
  code: string;
  message: string;
  transferId?: string;
}

export type ProtocolMessage =
  | HandshakeMessage
  | HandshakeAckMessage
  | TransferRequestMessage
  | TransferAcceptMessage
  | TransferRejectMessage
  | ChunkMessage
  | ChunkAckMessage
  | ChunkNackMessage
  | TransferPauseMessage
  | TransferResumeMessage
  | TransferCancelMessage
  | TransferCompleteMessage
  | TransferVerifyMessage
  | PingMessage
  | PongMessage
  | ErrorMessage;

/**
 * Type guard to validate whether an object matches the basic ProtocolMessage structure
 */
export function isProtocolMessage(msg: any): msg is ProtocolMessage {
  return (
    typeof msg === 'object' &&
    msg !== null &&
    typeof msg.version === 'number' &&
    typeof msg.type === 'string' &&
    Object.values(MessageType).includes(msg.type as MessageType)
  );
}
