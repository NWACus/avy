import {useFocusEffect} from '@react-navigation/native';
import * as React from 'react';

export const useRefreshOnFocus = (...refetch: (() => void)[]) => {
  const enabledRef = React.useRef(false);

  useFocusEffect(
    React.useCallback(() => {
      if (enabledRef.current) {
        for (const item of refetch) {
          item();
        }
      } else {
        enabledRef.current = true;
      }
    }, [refetch]),
  );
};
