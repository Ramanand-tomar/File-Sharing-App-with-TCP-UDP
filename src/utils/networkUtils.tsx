import { Platform } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import { NetworkInfo } from 'react-native-network-info';

export interface ConnectionTarget {
  host: string;
  port: number;
  deviceName: string;
}

export interface DiscoveryBeacon {
  version: number;
  type: 'DISCOVERY_BEACON';
  addresses: string[];
  port: number;
  deviceName: string;
  platform: 'android' | 'ios' | 'other';
  timestamp: number;
}

/**
 * Retrieves the local device IPv4 address.
 */
export const getLocalIPAddress = async (): Promise<string> => {
  try {
    const ip = await NetworkInfo.getIPV4Address();
    if (ip && ip !== '0.0.0.0' && ip !== '127.0.0.1') {
      return ip;
    }
    const devIp = await DeviceInfo.getIpAddress();
    return devIp || '0.0.0.0';
  } catch (error) {
    console.warn('[networkUtils] Error getting local IP:', error);
    return '0.0.0.0';
  }
};

/**
 * Calculates broadcast address dynamically using bitwise operations:
 * broadcastOctet = ipOctet | (~netmaskOctet & 0xFF)
 */
export function calculateBroadcastAddress(
  ip: string,
  subnetMask: string = '255.255.255.0',
): string {
  try {
    const ipParts = ip.split('.').map(Number);
    const maskParts = subnetMask.split('.').map(Number);

    if (ipParts.length !== 4 || maskParts.length !== 4) {
      return '255.255.255.255';
    }

    const broadcastParts = ipParts.map((ipOctet, idx) => {
      const maskOctet = maskParts[idx];
      return (ipOctet | (~maskOctet & 0xff)) >>> 0;
    });

    return broadcastParts.join('.');
  } catch (e) {
    return '255.255.255.255';
  }
}

/**
 * Obtains broadcast targets dynamically for UDP discovery.
 * Returns both calculated subnet broadcast and global broadcast (255.255.255.255).
 */
export const getBroadcastIPAddress = async (): Promise<string> => {
  try {
    // Check if system provides direct broadcast address
    const directBroadcast = await NetworkInfo.getBroadcast();
    if (directBroadcast && directBroadcast !== '0.0.0.0') {
      return directBroadcast;
    }

    const localIp = await getLocalIPAddress();
    const subnetMask = (await NetworkInfo.getSubnet()) || '255.255.255.0';

    return calculateBroadcastAddress(localIp, subnetMask);
  } catch (error) {
    console.warn('[networkUtils] Error getting broadcast IP:', error);
    return '255.255.255.255';
  }
};

/**
 * Creates structured discovery beacon JSON.
 */
export const createDiscoveryBeacon = (
  ip: string,
  port: number,
  deviceName: string,
): string => {
  const beacon: DiscoveryBeacon = {
    version: 1,
    type: 'DISCOVERY_BEACON',
    addresses: [ip],
    port,
    deviceName,
    platform: Platform.OS === 'ios' ? 'ios' : 'android',
    timestamp: Date.now(),
  };
  return JSON.stringify(beacon);
};

/**
 * Parses connection data from QR code or UDP discovery beacon.
 * Seamlessly handles BOTH structured JSON and legacy "tcp://ip:port|name" formats.
 */
export const parseConnectionPayload = (payload: string): ConnectionTarget | null => {
  if (!payload || typeof payload !== 'string') {
    return null;
  }

  const trimmed = payload.trim();

  // 1. Try parsing as JSON beacon
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed);
      const host =
        (Array.isArray(parsed.addresses) && parsed.addresses[0]) ||
        parsed.host ||
        parsed.address;
      const port = Number(parsed.port);
      const deviceName = parsed.deviceName || parsed.name || 'Peer';

      if (host && port) {
        return { host, port, deviceName };
      }
    } catch {
      // Fall through to legacy parsing
    }
  }

  // 2. Try parsing as legacy "tcp://ip:port|deviceName"
  if (trimmed.includes('tcp://') || trimmed.includes('|')) {
    try {
      const [connectionData, deviceName] = trimmed
        .replace('tcp://', '')
        .split('|');
      const [host, portStr] = connectionData.split(':');
      const port = parseInt(portStr, 10);

      if (host && !isNaN(port)) {
        return {
          host: host.trim(),
          port,
          deviceName: deviceName ? deviceName.trim() : 'Unknown Device',
        };
      }
    } catch {
      return null;
    }
  }

  return null;
};
