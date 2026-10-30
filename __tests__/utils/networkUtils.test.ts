import {
  calculateBroadcastAddress,
  parseConnectionPayload,
  createDiscoveryBeacon,
} from '../../src/utils/networkUtils';

describe('networkUtils', () => {
  describe('calculateBroadcastAddress', () => {
    test('calculates correct broadcast for standard /24 subnet', () => {
      const broadcast = calculateBroadcastAddress('192.168.1.45', '255.255.255.0');
      expect(broadcast).toBe('192.168.1.255');
    });

    test('calculates correct broadcast for /16 subnet', () => {
      const broadcast = calculateBroadcastAddress('172.16.10.5', '255.255.0.0');
      expect(broadcast).toBe('172.16.255.255');
    });

    test('calculates correct broadcast for /20 subnet (mobile hotspot)', () => {
      const broadcast = calculateBroadcastAddress('10.220.181.160', '255.255.240.0');
      expect(broadcast).toBe('10.220.191.255');
    });

    test('falls back gracefully to 255.255.255.255 on invalid IP', () => {
      const broadcast = calculateBroadcastAddress('invalid', '255.255.255.0');
      expect(broadcast).toBe('255.255.255.255');
    });
  });

  describe('parseConnectionPayload', () => {
    test('parses legacy pipe-delimited string format', () => {
      const legacy = 'tcp://192.168.1.72:4000|Galaxy Phone';
      const parsed = parseConnectionPayload(legacy);
      expect(parsed).toEqual({
        host: '192.168.1.72',
        port: 4000,
        deviceName: 'Galaxy Phone',
      });
    });

    test('parses new structured JSON format', () => {
      const jsonStr = JSON.stringify({
        version: 1,
        type: 'DISCOVERY_BEACON',
        addresses: ['10.220.181.160', '192.168.1.50'],
        port: 4000,
        deviceName: 'Vivo V2152',
        platform: 'android',
      });

      const parsed = parseConnectionPayload(jsonStr);
      expect(parsed).toEqual({
        host: '10.220.181.160',
        port: 4000,
        deviceName: 'Vivo V2152',
      });
    });

    test('returns null on invalid payload', () => {
      expect(parseConnectionPayload('')).toBeNull();
      expect(parseConnectionPayload('random text')).toBeNull();
    });
  });

  describe('createDiscoveryBeacon', () => {
    test('creates valid beacon JSON with fallback address', () => {
      const beacon = createDiscoveryBeacon('192.168.1.50', 4000, 'TestDevice');
      const parsed = JSON.parse(beacon);
      expect(parsed.version).toBe(1);
      expect(parsed.port).toBe(4000);
      expect(parsed.deviceName).toBe('TestDevice');
      expect(parsed.addresses).toContain('192.168.1.50');
    });
  });
});
