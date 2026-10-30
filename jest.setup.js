/* eslint-env jest */
jest.mock('react-native-permissions', () => ({
  request: jest.fn().mockResolvedValue('granted'),
  check: jest.fn().mockResolvedValue('granted'),
  PERMISSIONS: {
    IOS: { PHOTO_LIBRARY: 'ios.permission.PHOTO_LIBRARY' },
    ANDROID: { READ_EXTERNAL_STORAGE: 'android.permission.READ_EXTERNAL_STORAGE' },
  },
  RESULTS: {
    GRANTED: 'granted',
    DENIED: 'denied',
    BLOCKED: 'blocked',
    UNAVAILABLE: 'unavailable',
  },
}));

jest.mock('react-native-device-info', () => ({
  getDeviceNameSync: () => 'TestDevice',
  getVersion: () => '1.0.0',
}));

jest.mock('react-native-fs', () => ({
  DocumentDirectoryPath: '/mock/docs',
  DownloadDirectoryPath: '/mock/downloads',
  readFile: jest.fn(),
  writeFile: jest.fn(),
  appendFile: jest.fn(),
  read: jest.fn(),
  write: jest.fn(),
  moveFile: jest.fn(),
  hash: jest.fn(),
  unlink: jest.fn(),
  exists: jest.fn().mockResolvedValue(false),
  stat: jest.fn(),
}));

jest.mock('react-native-blob-util', () => ({
  android: { actionViewIntent: jest.fn() },
  ios: { openDocument: jest.fn() },
}));

jest.mock('react-native-tcp-socket', () => ({
  createTLSServer: jest.fn(),
  connectTLS: jest.fn(),
  createServer: jest.fn(),
  connect: jest.fn(),
}));

jest.mock('react-native-udp', () => ({
  createSocket: jest.fn(),
}));
