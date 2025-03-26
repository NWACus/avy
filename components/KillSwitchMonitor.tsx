import Constants from 'expo-constants';
import * as Linking from 'expo-linking';
import React, {useCallback} from 'react';
import {Modal, Platform} from 'react-native';

import {usePostHog} from 'posthog-react-native';

import {useOneFeatureFlag} from 'FeatureFlags';
import NoConnection from 'assets/illustrations/NoConnection.svg';
import {Button} from 'components/content/Button';
import {Outcome} from 'components/content/Outcome';
import {VStack} from 'components/core';
import {BodyBlack} from 'components/text';

type KillSwitchMonitorProps = {
  children: React.ReactNode;
};

export const KillSwitchMonitor: React.FC<KillSwitchMonitorProps> = ({children}) => {
  const posthog = usePostHog();

  const downForMaintenance = !!useOneFeatureFlag('down-for-maintenance');
  const updateRequired = !!useOneFeatureFlag(`update-required`);

  const reloadFeatureFlags = useCallback(() => void posthog?.reloadFeatureFlagsAsync(), [posthog]);

  let storeUrl: string | undefined = undefined;
  if (Platform.OS === 'android' && Constants.expoConfig?.android?.playStoreUrl) {
    storeUrl = Constants.expoConfig?.android?.playStoreUrl;
  } else if (Platform.OS === 'ios' && Constants.expoConfig?.ios?.appStoreUrl) {
    storeUrl = Constants.expoConfig?.ios?.appStoreUrl;
  }

  const openStore = useCallback(() => {
    void (async () => {
      if (storeUrl) {
        await Linking.openURL(storeUrl);
      }
    })();
  }, [storeUrl]);

  return (
    <>
      <Modal visible={downForMaintenance}>
        <VStack style={{position: 'absolute', top: 0, bottom: 0, left: 0, right: 0}} justifyContent="center" alignItems="center" space={16} px={32} py={32}>
          <Outcome
            inline
            headline={'Oops!'}
            body={'We forgot our tire chains, we‘ll be right back.'}
            illustration={<NoConnection />}
            illustrationBottomMargin={-32}
            illustrationLeftMargin={-16}
          />
          <Button width={'100%'} buttonStyle="primary" onPress={reloadFeatureFlags}>
            <BodyBlack>Check again!</BodyBlack>
          </Button>
        </VStack>
      </Modal>
      <Modal visible={updateRequired && !downForMaintenance}>
        <VStack style={{position: 'absolute', top: 0, bottom: 0, left: 0, right: 0}} justifyContent="center" alignItems="center" space={16} px={32} py={32}>
          <Outcome
            inline
            headline={'Hold up!'}
            body={'Looks like you‘re missing a few essentials!\n\nHead to the App Store to get the latest version of Avy.'}
            illustration={<NoConnection />}
            illustrationBottomMargin={-32}
            illustrationLeftMargin={-16}
          />
          {storeUrl && (
            <Button width={'100%'} buttonStyle="primary" onPress={openStore}>
              <BodyBlack>Take me there!</BodyBlack>
            </Button>
          )}
        </VStack>
      </Modal>
      {children}
    </>
  );
};
