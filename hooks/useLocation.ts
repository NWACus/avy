import {useEffect} from 'react';

import * as Location from 'expo-location';

export type LocationResponse = {
  status: Location.LocationPermissionResponse;
  location: Location.LocationObject | null;
};

export const useLocation = (callback: (location: Location.LocationObject) => void): Location.LocationPermissionResponse | null => {
  const [status, requestPermission] = Location.useForegroundPermissions();

  useEffect(() => {
    const granted = status?.granted;
    const canAskAgain = status?.canAskAgain;

    if (!granted && canAskAgain) {
      (async () => {
        await requestPermission();
      })();
    }

    let unmounted = false;
    let subscriptionCancel = null;

    if (granted) {
      (async () => {
        const subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
          },
          (location: Location.LocationObject) => {
            callback(location);
          },
        );
        if (unmounted) {
          subscription.remove();
        } else {
          subscriptionCancel = subscription.remove;
        }
      })();
    }

    return () => {
      unmounted = true;
      subscriptionCancel?.();
    };
  }, [status, requestPermission, callback]);

  return status;
};
