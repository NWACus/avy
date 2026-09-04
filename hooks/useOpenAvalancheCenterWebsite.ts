import * as WebBrowser from 'expo-web-browser';
import {LoggerContext, LoggerProps} from 'loggerContext';
import React, {useCallback} from 'react';
import {Alert} from 'react-native';
import {AvalancheCenterID, AvalancheCenterWebsites} from 'types/nationalAvalancheCenter';

export const useOpenAvalancheCenterWebsite = (): ((centerId: AvalancheCenterID, onComplete?: () => void) => void) => {
  const {logger} = React.useContext<LoggerProps>(LoggerContext);

  return useCallback(
    (centerId: AvalancheCenterID, onComplete?: () => void) => {
      const url = AvalancheCenterWebsites[centerId];
      if (!url) {
        logger.warn({centerId: centerId}, 'No website is configured for this avalanche center');
        return;
      }
      WebBrowser.openBrowserAsync(url)
        .then(() => onComplete?.())
        .catch((e: unknown) => {
          logger.error({error: e, centerId: centerId}, 'Failed to open avalanche center website');
          Alert.alert('Unable to Open Web Browser', 'An error occured when trying to open the web browser. Please try again.', [{text: 'Okay', style: 'default'}]);
        });
    },
    [logger],
  );
};
