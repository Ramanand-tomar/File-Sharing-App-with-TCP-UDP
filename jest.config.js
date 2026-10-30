module.exports = {
  preset: 'react-native',
  setupFiles: ['./jest.setup.js'],
  moduleNameMapper: {
    '\\.(p12|pem|png|jpg|jpeg|gif|svg|ttf)$': '<rootDir>/__mocks__/fileMock.js',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(@react-native|react-native|@react-navigation|react-native-reanimated|react-native-worklets|react-native-safe-area-context|react-native-vector-icons)/)',
  ],
};
