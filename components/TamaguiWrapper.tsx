// Initializes Tamagui if it's enabled in by env var. Place this high in the render tree.

import React, {ReactNode} from 'react';
import {useColorScheme} from 'react-native';

// eslint-disable-next-line no-restricted-imports
import {TamaguiProvider, Theme} from 'tamagui';
import config from 'tamagui.config';

export const TamaguiWrapper: React.FC<{children?: ReactNode | undefined}> = ({children}) => {
  const colorScheme = useColorScheme();
  if (process.env.EXPO_PUBLIC_TAMAGUI_ENABLED) {
    return (
      <TamaguiProvider config={config}>
        <Theme name={colorScheme === 'dark' ? 'dark' : 'light'}>{children}</Theme>
      </TamaguiProvider>
    );
  }
  return <>{children}</>;
};
