import * as React from 'react';
import {useFocusEffect} from '@react-navigation/native';

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
}
