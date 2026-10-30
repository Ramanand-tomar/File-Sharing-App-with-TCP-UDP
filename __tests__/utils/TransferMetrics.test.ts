import { TransferMetrics } from '../../src/utils/TransferMetrics';

describe('TransferMetrics', () => {
  let metrics: TransferMetrics;

  beforeEach(() => {
    metrics = new TransferMetrics();
  });

  test('calculates percentage correctly', () => {
    const progress = metrics.update(500, 1000);
    expect(progress.percentage).toBe(50);
  });

  test('caps percentage at 100%', () => {
    const progress = metrics.update(1200, 1000);
    expect(progress.percentage).toBe(100);
  });

  test('formats speed units properly', () => {
    expect(TransferMetrics.formatSpeed(0)).toBe('0 B/s');
    expect(TransferMetrics.formatSpeed(512)).toBe('512 B/s');
    expect(TransferMetrics.formatSpeed(1024 * 50)).toBe('50.0 KB/s');
    expect(TransferMetrics.formatSpeed(1024 * 1024 * 3.5)).toBe('3.5 MB/s');
  });

  test('formats ETA properly', () => {
    expect(TransferMetrics.formatEta(0)).toBe('--');
    expect(TransferMetrics.formatEta(45)).toBe('45s');
    expect(TransferMetrics.formatEta(95)).toBe('1m 35s');
  });
});

