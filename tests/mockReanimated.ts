// require() is required here: jest.mock factories are hoisted above imports, so imported bindings can't be referenced inside them.
/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-return */
// In Reanimated 4 the native runtime lives in react-native-worklets, which throws when imported under Jest. Per the
// official Worklets Jest guide, swap it for the mock it ships as published source (`src/mock` for TypeScript). With
// Worklets mocked, the real Reanimated module runs under Jest without touching native — the legacy
// `jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'))` module swap is no longer needed.
jest.mock('react-native-worklets', () => require('react-native-worklets/src/mock'));

import {setUpTests} from 'react-native-reanimated';

// Registers Reanimated's custom Jest matchers (toHaveAnimatedStyle / toHaveAnimatedProps) and frame timing config.
setUpTests();
