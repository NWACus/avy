/// <reference types="jest" />
// TypeScript 6 no longer auto-includes @types/jest's ambient globals (describe/it/expect),
// so we reference it explicitly here to keep them available in test files.

declare module '*.svg' {
  import React from 'react';
  import {SvgProps} from 'react-native-svg';
  const content: React.FC<SvgProps>;
  export default content;
}
