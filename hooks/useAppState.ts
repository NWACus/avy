import {useEffect, useRef, useState} from 'react';
import {AppState} from 'react-native';

import {logger} from 'logger';

export const useAppState = () => {
  // Using a ref allows us to read the current value from the subscription listener
  // *without* triggering an unsubscribe/resubscribe cycle
  const appStateStatusRef = useRef(AppState.currentState);
  // Using and returning a state value allows this hook to be used in a functional component
  const [appStateStatus, setAppStateStatus] = useState(appStateStatusRef.current);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextStatus => {
      const lastStatus = appStateStatusRef.current;
      appStateStatusRef.current = nextStatus;
      setAppStateStatus(nextStatus);
      logger.trace('app status changed', {lastStatus, nextStatus});
    });

    return () => {
      subscription.remove();
    };
  }, []);

  return appStateStatus;
};
