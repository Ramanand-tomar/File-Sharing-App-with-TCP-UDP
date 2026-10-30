/**
 * Binary Frame Parser & Encoder for TCP Stream Communications
 *
 * Implements a 4-byte Big-Endian length-prefixed framing protocol:
 * [4-byte uint32 payload length][payload bytes (JSON / Binary)]
 *
 * Handles fragmentation, concatenation, back-to-back frames, and oversized payload detection.
 */

import { Buffer } from 'buffer';
import {
  ProtocolMessage,
  MAX_FRAME_PAYLOAD_SIZE,
  isProtocolMessage,
} from './ProtocolMessages';

export class FrameParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FrameParseError';
  }
}

export class FrameParser {
  private buffer: Buffer;
  private readonly maxPayloadSize: number;

  constructor(maxPayloadSize: number = MAX_FRAME_PAYLOAD_SIZE) {
    this.buffer = Buffer.alloc(0);
    this.maxPayloadSize = maxPayloadSize;
  }

  /**
   * Pushes incoming raw TCP data into the parser buffer and extracts any complete frames.
   *
   * @param chunk Raw data received from socket 'data' event
   * @returns Array of parsed ProtocolMessage objects (or raw parsed JSON objects)
   */
  public push(chunk: Buffer | Uint8Array | string): any[] {
    const dataBuffer =
      typeof chunk === 'string'
        ? Buffer.from(chunk, 'utf8')
        : Buffer.isBuffer(chunk)
        ? chunk
        : Buffer.from(chunk);

    if (dataBuffer.length === 0) {
      return [];
    }

    // Append new data to internal persistent buffer
    this.buffer = Buffer.concat([this.buffer, dataBuffer]);

    const messages: any[] = [];

    while (this.buffer.length >= 4) {
      // Check for legacy un-framed JSON packet (starts with '{' ASCII 0x7B)
      if (this.buffer[0] === 0x7b) {
        const legacyMessage = this.tryParseLegacyJson();
        if (legacyMessage) {
          messages.push(legacyMessage);
          continue;
        }
      }

      // Read 4-byte big-endian frame payload length
      const payloadLength = this.buffer.readUInt32BE(0);

      // Validate length limits
      if (payloadLength > this.maxPayloadSize) {
        this.reset();
        throw new FrameParseError(
          `Payload length ${payloadLength} exceeds maximum allowed size of ${this.maxPayloadSize} bytes`,
        );
      }

      // Check if the complete frame (4-byte header + payload) is available
      const totalFrameLength = 4 + payloadLength;
      if (this.buffer.length < totalFrameLength) {
        // Frame is incomplete; wait for more TCP packets
        break;
      }

      // Extract payload
      const payloadBuffer = this.buffer.slice(4, totalFrameLength);

      // Advance buffer
      this.buffer = this.buffer.slice(totalFrameLength);

      try {
        const payloadString = payloadBuffer.toString('utf8');
        const parsed = JSON.parse(payloadString);
        messages.push(parsed);
      } catch (err: any) {
        throw new FrameParseError(
          `Failed to parse frame JSON payload: ${err?.message || err}`,
        );
      }
    }

    return messages;
  }

  /**
   * Fallback parser for legacy un-framed JSON messages (e.g. {"event":"connect",...})
   */
  private tryParseLegacyJson(): any | null {
    const rawStr = this.buffer.toString('utf8');
    let depth = 0;
    let inString = false;
    let escape = false;
    let endIndex = -1;

    for (let i = 0; i < rawStr.length; i++) {
      const char = rawStr[i];
      if (escape) {
        escape = false;
        continue;
      }
      if (char === '\\') {
        escape = true;
        continue;
      }
      if (char === '"') {
        inString = !inString;
        continue;
      }
      if (!inString) {
        if (char === '{') {
          depth++;
        } else if (char === '}') {
          depth--;
          if (depth === 0) {
            endIndex = i;
            break;
          }
        }
      }
    }

    if (endIndex !== -1) {
      const jsonStr = rawStr.substring(0, endIndex + 1);
      try {
        const parsed = JSON.parse(jsonStr);
        // Consume bytes from buffer
        const consumedBytes = Buffer.byteLength(jsonStr, 'utf8');
        this.buffer = this.buffer.slice(consumedBytes);
        return parsed;
      } catch {
        return null;
      }
    }

    return null;
  }

  /**
   * Encodes a protocol message into a 4-byte length-prefixed binary frame.
   *
   * @param message Message object to serialize and frame
   * @returns Binary Buffer formatted as [4-byte uint32 length][JSON payload]
   */
  public static encode(message: any): Buffer {
    const jsonString = JSON.stringify(message);
    const payloadBuffer = Buffer.from(jsonString, 'utf8');
    const frame = Buffer.allocUnsafe(4 + payloadBuffer.length);
    frame.writeUInt32BE(payloadBuffer.length, 0);
    payloadBuffer.copy(frame, 4);
    return frame;
  }

  /**
   * Encodes raw binary or string payload into a 4-byte length-prefixed frame.
   */
  public static encodeRaw(payload: Buffer | string): Buffer {
    const payloadBuffer =
      typeof payload === 'string'
        ? Buffer.from(payload, 'utf8')
        : payload;
    const frame = Buffer.allocUnsafe(4 + payloadBuffer.length);
    frame.writeUInt32BE(payloadBuffer.length, 0);
    payloadBuffer.copy(frame, 4);
    return frame;
  }

  /**
   * Resets internal buffer state.
   */
  public reset(): void {
    this.buffer = Buffer.alloc(0);
  }

  /**
   * Current unparsed bytes remaining in the buffer.
   */
  public get bufferedLength(): number {
    return this.buffer.length;
  }
}

