/* eslint-env jest */
jest.mock('immer', () => ({
  produce: (base, recipe) => {
    if (typeof recipe !== 'function') return base;
    const copy = Array.isArray(base) ? [...base] : { ...base };
    const res = recipe(copy);
    return res !== undefined ? res : copy;
  },
}));
jest.mock('uuid', () => ({
  v4: () => 'mock-uuid-v4',
}));
jest.mock('react-native-get-random-values', () => ({}));
jest.mock('react-native-reanimated', () => {
  const View = require('react-native').View;
  return {
    default: {
      View,
      Text: require('react-native').Text,
      Image: require('react-native').Image,
      ScrollView: require('react-native').ScrollView,
      timing: () => ({ start: (cb) => cb && cb() }),
      Value: jest.fn(() => ({ setValue: jest.fn() })),
    },
    useSharedValue: jest.fn((init) => ({ value: init })),
    useAnimatedStyle: jest.fn(() => ({})),
    withTiming: jest.fn((to) => to),
    withRepeat: jest.fn((to) => to),
    withSpring: jest.fn((to) => to),
    Easing: { linear: jest.fn(), out: jest.fn(), ease: jest.fn() },
  };
});

jest.mock('react-native-responsive-fontsize', () => ({
  RFValue: (val) => val,
  RFPercentage: (val) => val,
}));

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
  getDeviceName: () => Promise.resolve('TestDevice'),
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

jest.mock('react-native-image-picker', () => ({
  launchImageLibrary: jest.fn(),
  launchCamera: jest.fn(),
}));

jest.mock('@react-native-documents/picker', () => ({
  pick: jest.fn(),
}));

jest.mock('react-native-network-info', () => ({
  NetworkInfo: {
    getIPV4Address: jest.fn().mockResolvedValue('192.168.1.50'),
    getBroadcast: jest.fn().mockResolvedValue('192.168.1.255'),
    getSubnet: jest.fn().mockResolvedValue('255.255.255.0'),
  },
}));

jest.mock('react-native-linear-gradient', () => 'LinearGradient');
jest.mock('lottie-react-native', () => 'LottieView');
jest.mock('react-native-qrcode-svg', () => 'QRCode');
jest.mock('react-native-vision-camera', () => ({
  Camera: { requestCameraPermission: jest.fn().mockResolvedValue('granted') },
  useCameraDevice: jest.fn(),
}));
