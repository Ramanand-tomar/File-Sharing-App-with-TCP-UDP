/**
 * TransferMetrics: Real-time speed, progress, and ETA calculation
 */

export interface TransferProgress {
  bytesTransferred: number;
  totalBytes: number;
  percentage: number;
  speedBytesPerSec: number;
  formattedSpeed: string;
  etaSeconds: number;
  formattedEta: string;
}

export class TransferMetrics {
  private lastBytes = 0;
  private lastTimestamp = Date.now();
  private speedSamples: number[] = [];
  private static readonly SAMPLE_SIZE = 5;

  /**
   * Updates progress and computes current transfer speed and estimated time remaining.
   */
  public update(bytesTransferred: number, totalBytes: number): TransferProgress {
    const now = Date.now();
    const timeDelta = (now - this.lastTimestamp) / 1000; // in seconds

    let currentSpeed = 0;
    if (timeDelta > 0.2) {
      const bytesDelta = bytesTransferred - this.lastBytes;
      const instantaneousSpeed = Math.max(0, bytesDelta / timeDelta);

      this.speedSamples.push(instantaneousSpeed);
      if (this.speedSamples.length > TransferMetrics.SAMPLE_SIZE) {
        this.speedSamples.shift();
      }

      this.lastBytes = bytesTransferred;
      this.lastTimestamp = now;
    }

    if (this.speedSamples.length > 0) {
      const sum = this.speedSamples.reduce((acc, val) => acc + val, 0);
      currentSpeed = sum / this.speedSamples.length;
    }

    const percentage = totalBytes > 0 ? Math.min(100, Math.round((bytesTransferred / totalBytes) * 100)) : 0;
    const remainingBytes = Math.max(0, totalBytes - bytesTransferred);
    const etaSeconds = currentSpeed > 0 ? Math.round(remainingBytes / currentSpeed) : 0;

    return {
      bytesTransferred,
      totalBytes,
      percentage,
      speedBytesPerSec: currentSpeed,
      formattedSpeed: TransferMetrics.formatSpeed(currentSpeed),
      etaSeconds,
      formattedEta: TransferMetrics.formatEta(etaSeconds),
    };
  }

  /**
   * Resets metrics for a new transfer.
   */
  public reset(): void {
    this.lastBytes = 0;
    this.lastTimestamp = Date.now();
    this.speedSamples = [];
  }

  public static formatSpeed(bytesPerSec: number): string {
    if (bytesPerSec <= 0 || !isFinite(bytesPerSec)) return '0 B/s';
    if (bytesPerSec < 1024) return `${Math.round(bytesPerSec)} B/s`;
    if (bytesPerSec < 1024 * 1024) return `${(bytesPerSec / 1024).toFixed(1)} KB/s`;
    return `${(bytesPerSec / (1024 * 1024)).toFixed(1)} MB/s`;
  }

  public static formatEta(seconds: number): string {
    if (seconds <= 0 || !isFinite(seconds)) return '--';
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  }
}
