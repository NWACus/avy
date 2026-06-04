// require() is required here: jest.mock factories are hoisted above imports, so imported bindings can't be referenced inside them.
/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-return */
// react-native-reanimated's native runtime (react-native-worklets) isn't available under Jest and throws on
// import. Swap both packages for the mocks they ship so components that import reanimated can be tested.
// reanimated exposes a top-level `mock` entry; worklets ships its mock as published source (`src/mock`), which is
// the same path reanimated's own mock entry references internally.
jest.mock('react-native-worklets', () => require('react-native-worklets/src/mock'));
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));
