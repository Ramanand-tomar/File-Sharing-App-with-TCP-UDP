import { Buffer } from 'buffer';
import { FrameParser, FrameParseError } from '../../src/protocol/FrameParser';
import {
  MessageType,
  HandshakeMessage,
  CURRENT_PROTOCOL_VERSION,
} from '../../src/protocol/ProtocolMessages';

describe('FrameParser', () => {
  let parser: FrameParser;

  beforeEach(() => {
    parser = new FrameParser();
  });

  test('should encode and decode a single complete frame', () => {
    const msg: HandshakeMessage = {
      version: CURRENT_PROTOCOL_VERSION,
      type: MessageType.HANDSHAKE,
      timestamp: Date.now(),
      deviceId: 'device-123',
      deviceName: 'Pixel 8',
      platform: 'android',
      supportedVersions: [1],
    };

    const encoded = FrameParser.encode(msg);
    expect(encoded.length).toBeGreaterThan(4);

    const decoded = parser.push(encoded);
    expect(decoded).toHaveLength(1);
    expect(decoded[0]).toEqual(msg);
    expect(parser.bufferedLength).toBe(0);
  });

  test('should parse multiple frames concatenated in a single TCP read', () => {
    const msg1 = { version: 1, type: MessageType.PING, timestamp: 1000 };
    const msg2 = { version: 1, type: MessageType.PONG, timestamp: 1001 };
    const msg3 = { version: 1, type: MessageType.PING, timestamp: 1002 };

    const frame1 = FrameParser.encode(msg1);
    const frame2 = FrameParser.encode(msg2);
    const frame3 = FrameParser.encode(msg3);

    const combinedBuffer = Buffer.concat([frame1, frame2, frame3]);

    const decoded = parser.push(combinedBuffer);
    expect(decoded).toHaveLength(3);
    expect(decoded[0]).toEqual(msg1);
    expect(decoded[1]).toEqual(msg2);
    expect(decoded[2]).toEqual(msg3);
    expect(parser.bufferedLength).toBe(0);
  });

  test('should handle fragmented frames arriving across multiple TCP packets', () => {
    const msg = {
      version: 1,
      type: MessageType.TRANSFER_REQUEST,
      timestamp: Date.now(),
      transferId: 'tx-1',
      fileId: 'file-1',
      fileName: 'large_video.mp4',
      fileSize: 104857600,
      mimeType: 'video/mp4',
      totalChunks: 1600,
      chunkSize: 65536,
    };

    const encoded = FrameParser.encode(msg);

    // Split encoded frame into 3 slices:
    // Slice 1: First 2 bytes of the 4-byte length prefix
    // Slice 2: Remaining 2 bytes of prefix + first 10 bytes of payload
    // Slice 3: Remaining payload
    const part1 = encoded.slice(0, 2);
    const part2 = encoded.slice(2, 14);
    const part3 = encoded.slice(14);

    // First part: not enough even for header
    const r1 = parser.push(part1);
    expect(r1).toHaveLength(0);
    expect(parser.bufferedLength).toBe(2);

    // Second part: header complete, partial payload
    const r2 = parser.push(part2);
    expect(r2).toHaveLength(0);
    expect(parser.bufferedLength).toBe(14);

    // Third part: completes the frame
    const r3 = parser.push(part3);
    expect(r3).toHaveLength(1);
    expect(r3[0]).toEqual(msg);
    expect(parser.bufferedLength).toBe(0);
  });

  test('should throw FrameParseError on oversized payload', () => {
    const smallLimitParser = new FrameParser(100); // 100 bytes max payload

    // Create a 4-byte header specifying 200 bytes
    const oversizedHeader = Buffer.alloc(4);
    oversizedHeader.writeUInt32BE(200, 0);

    expect(() => {
      smallLimitParser.push(oversizedHeader);
    }).toThrow(FrameParseError);

    expect(smallLimitParser.bufferedLength).toBe(0);
  });

  test('should throw FrameParseError on invalid JSON payload', () => {
    const invalidJsonPayload = Buffer.from('this is not json!', 'utf8');
    const header = Buffer.alloc(4);
    header.writeUInt32BE(invalidJsonPayload.length, 0);

    const corruptFrame = Buffer.concat([header, invalidJsonPayload]);

    expect(() => {
      parser.push(corruptFrame);
    }).toThrow(FrameParseError);
  });

  test('should parse legacy un-framed JSON packet gracefully', () => {
    const legacyMsg = { event: 'connect', device: 'Galaxy S21' };
    const rawJsonStr = JSON.stringify(legacyMsg);

    const decoded = parser.push(rawJsonStr);
    expect(decoded).toHaveLength(1);
    expect(decoded[0]).toEqual(legacyMsg);
    expect(parser.bufferedLength).toBe(0);
  });

  test('reset should clear internal buffer', () => {
    parser.push(Buffer.from([0x00, 0x00]));
    expect(parser.bufferedLength).toBe(2);

    parser.reset();
    expect(parser.bufferedLength).toBe(0);
  });
});
