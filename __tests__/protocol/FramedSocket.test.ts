import { EventEmitter } from 'events';
import { FramedSocket } from '../../src/protocol/FramedSocket';
import { FrameParser } from '../../src/protocol/FrameParser';
import { MessageType, CURRENT_PROTOCOL_VERSION } from '../../src/protocol/ProtocolMessages';

class MockSocket extends EventEmitter {
  public writes: any[] = [];
  public destroyed = false;
  public writeReturnVal = true;

  write(data: any, cb?: () => void): boolean {
    this.writes.push(data);
    if (cb) cb();
    return this.writeReturnVal;
  }

  destroy(): void {
    this.destroyed = true;
    this.emit('close', false);
  }
}

describe('FramedSocket', () => {
  let mockSocket: MockSocket;
  let framedSocket: FramedSocket;

  beforeEach(() => {
    mockSocket = new MockSocket();
    framedSocket = new FramedSocket(mockSocket);
  });

  afterEach(() => {
    framedSocket.destroy();
  });

  test('should dispatch parsed messages from incoming framed data', done => {
    const message = {
      version: CURRENT_PROTOCOL_VERSION,
      type: MessageType.PING,
      timestamp: 123456,
    };

    framedSocket.onMessage(msg => {
      expect(msg).toEqual(message);
      done();
    });

    const frame = FrameParser.encode(message);
    mockSocket.emit('data', frame);
  });

  test('should encode and write frame to underlying socket on send', async () => {
    const message = {
      version: CURRENT_PROTOCOL_VERSION,
      type: MessageType.HANDSHAKE,
      timestamp: Date.now(),
      deviceId: 'dev-1',
      deviceName: 'Phone',
      platform: 'android' as const,
      supportedVersions: [1],
    };

    const sent = await framedSocket.send(message);
    expect(sent).toBe(true);
    expect(mockSocket.writes).toHaveLength(1);

    // Verify written data matches expected frame
    const parser = new FrameParser();
    const parsed = parser.push(mockSocket.writes[0]);
    expect(parsed[0]).toEqual(message);
  });

  test('should handle backpressure when write returns false until drain', async () => {
    mockSocket.writeReturnVal = false;

    let resolved = false;
    const sendPromise = framedSocket.send({ type: 'TEST' }).then(res => {
      resolved = true;
      return res;
    });

    // Should not have resolved yet because drain has not fired
    expect(resolved).toBe(false);

    // Simulate drain event
    mockSocket.emit('drain');

    const result = await sendPromise;
    expect(result).toBe(true);
    expect(resolved).toBe(true);
  });

  test('should trigger close and error listeners correctly', () => {
    let closed = false;
    let hadError = false;

    framedSocket.onClose(err => {
      closed = true;
      hadError = err;
    });

    mockSocket.emit('close', true);
    expect(closed).toBe(true);
    expect(hadError).toBe(true);
  });
});

