import {useContext, useEffect} from 'react';
import {Platform} from 'react-native';

import * as Application from 'expo-application';

import {useAnalytics} from 'hooks/useAnalytics';
import {LoggerContext} from 'loggerContext';
import {usePreferences} from 'Preferences';

const UTM_PARAMETERS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'] as const;

export const useReportInstallReferrer = (): void => {
  const analytics = useAnalytics();
  const {logger} = useContext(LoggerContext);
  const {preferences, setPreferences} = usePreferences();
  const {installReferrerReported} = preferences;

  useEffect(() => {
    if (Platform.OS !== 'android' || installReferrerReported) {
      return;
    }
    void (async () => {
      try {
        const [installReferrer, installationTime] = await Promise.all([Application.getInstallReferrerAsync(), Application.getInstallationTimeAsync()]);
        const referrerParameters = new URLSearchParams(installReferrer);
        const utmProperties = Object.fromEntries(UTM_PARAMETERS.map(parameter => [parameter, referrerParameters.get(parameter)]));
        const initialUtmProperties = Object.fromEntries(UTM_PARAMETERS.map(parameter => [`initial_${parameter}`, referrerParameters.get(parameter)]));
        analytics.captureEventNoCenter('android_install_referrer_received', {
          installed_at: installationTime.toISOString(),
          ...utmProperties,
          $set_once: initialUtmProperties,
        });
        setPreferences({installReferrerReported: true});
        logger.debug({installReferrer}, 'reported install referrer');
      } catch (error) {
        logger.warn({error}, 'failed to report install referrer');
      }
    })();
  }, [analytics, installReferrerReported, logger, setPreferences]);
};
