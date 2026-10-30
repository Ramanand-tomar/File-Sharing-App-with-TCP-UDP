/**
 * FramedSocket: Encapsulates TCP Socket with Framed Message Protocol & Backpressure Flow Control
 */

import { FrameParser } from './FrameParser';
import { ProtocolMessage } from './ProtocolMessages';

export type MessageHandler = (message: any) => void;
export type CloseHandler = (hadError: boolean) => void;
export type ErrorHandler = (error: Error) => void;

export class FramedSocket {
  private socket: any;
  private parser: FrameParser;
  private messageListeners: MessageHandler[] = [];
  private closeListeners: CloseHandler[] = [];
  private errorListeners: ErrorHandler[] = [];
  private isDestroyed = false;

  constructor(socket: any) {
    this.socket = socket;
    this.parser = new FrameParser();
    this.setupListeners();
  }

  private setupListeners(): void {
    this.socket.on('data', (data: any) => {
      try {
        const messages = this.parser.push(data);
        for (const msg of messages) {
          for (const listener of this.messageListeners) {
            try {
              listener(msg);
            } catch (err) {
              console.error('[FramedSocket] Error in message listener:', err);
            }
          }
        }
      } catch (err: any) {
        console.error('[FramedSocket] Framing parse error:', err);
        for (const listener of this.errorListeners) {
          listener(err);
        }
      }
    });

    this.socket.on('close', (hadError: boolean) => {
      this.isDestroyed = true;
      this.parser.reset();
      for (const listener of this.closeListeners) {
        try {
          listener(hadError);
        } catch (err) {
          console.error('[FramedSocket] Error in close listener:', err);
        }
      }
    });

    this.socket.on('error', (err: any) => {
      console.error('[FramedSocket] Socket error:', err);
      for (const listener of this.errorListeners) {
        try {
          listener(err);
        } catch (e) {
          console.error('[FramedSocket] Error in error listener:', e);
        }
      }
    });
  }

  /**
   * Sends a typed message using framed length-prefix binary encoding.
   * Implements TCP backpressure by waiting for the 'drain' event if the write buffer is saturated.
   */
  public async send(message: ProtocolMessage | any): Promise<boolean> {
    if (this.isDestroyed || !this.socket) {
      console.warn('[FramedSocket] Cannot send message: socket is closed/destroyed');
      return false;
    }

    const frame = FrameParser.encode(message);

    return new Promise<boolean>((resolve, reject) => {
      try {
        const canWriteMore = this.socket.write(frame, () => {
          // Write finished
        });

        if (canWriteMore === false) {
          // Socket buffer is saturated; wait for drain
          this.socket.once('drain', () => {
            resolve(true);
          });
        } else {
          resolve(true);
        }
      } catch (err: any) {
        console.error('[FramedSocket] Write failed:', err);
        reject(err);
      }
    });
  }

  /**
   * Registers a callback for incoming parsed messages.
   * Returns an unregister function.
   */
  public onMessage(handler: MessageHandler): () => void {
    this.messageListeners.push(handler);
    return () => {
      this.messageListeners = this.messageListeners.filter(h => h !== handler);
    };
  }

  /**
   * Registers a callback for socket close.
   */
  public onClose(handler: CloseHandler): () => void {
    this.closeListeners.push(handler);
    return () => {
      this.closeListeners = this.closeListeners.filter(h => h !== handler);
    };
  }

  /**
   * Registers a callback for socket error.
   */
  public onError(handler: ErrorHandler): () => void {
    this.errorListeners.push(handler);
    return () => {
      this.errorListeners = this.errorListeners.filter(h => h !== handler);
    };
  }

  /**
   * Closes and cleans up the socket.
   */
  public destroy(): void {
    if (this.isDestroyed) {
      return;
    }
    this.isDestroyed = true;
    this.parser.reset();
    try {
      if (this.socket && typeof this.socket.destroy === 'function') {
        this.socket.destroy();
      }
    } catch (e) {
      console.error('[FramedSocket] Error destroying socket:', e);
    }
    this.messageListeners = [];
    this.closeListeners = [];
    this.errorListeners = [];
  }

  public get rawSocket(): any {
    return this.socket;
  }
}

