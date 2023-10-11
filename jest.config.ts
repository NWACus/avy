import type {Config} from 'jest';

const config: Config = {
  silent: true, // suppresses all logging. override with --silent=false on the command line
  preset: 'jest-expo',
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|d3(-?[a-z]+)?|internmap)',
  ],
  setupFiles: ['./tests/setupAsyncStorage.ts', './tests/mockNetInfo.ts'],
  setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect'],
  moduleNameMapper: {
    '^.+.(css|styl|less|sass|scss|png|jpg|ttf|woff|woff2)$': 'jest-transform-stub',
  },
};

export default config;
