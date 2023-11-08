import * as Application from 'expo-application';
import * as Network from 'expo-network';
import * as Updates from 'expo-updates';

import ExpoMixpanelAnalytics from '@bothrs/expo-mixpanel-analytics';
import {addEventListener} from '@react-native-community/netinfo';
import publicIP from 'react-native-public-ip';

import {getUpdateGroupId, getUpdateTimeAsVersionString} from 'hooks/useEASUpdateStatus';
import {logger as globalLogger} from 'logger';

const logger = globalLogger.child({module: 'mixpanel'});

class MixpanelWrapper {
  private _mixpanel: ExpoMixpanelAnalytics | null;
  private _pending: Array<() => void> = [];
  private _ready = false;
  private _ipAddress: string | null = null;

  constructor() {
    if (process.env.EXPO_PUBLIC_MIXPANEL_TOKEN && (process.env.NODE_ENV !== 'development' || process.env.EXPO_PUBLIC_MIXPANEL_IN_DEVELOPMENT === 'true')) {
      logger.info('initializing mixpanel');
      this._mixpanel = new ExpoMixpanelAnalytics(process.env.EXPO_PUBLIC_MIXPANEL_TOKEN);
    } else {
      if (!process.env.EXPO_PUBLIC_MIXPANEL_TOKEN) {
        logger.warn('skipping mixpanel initialization, no token configured');
      }
      if (process.env.NODE_ENV === 'development' && process.env.EXPO_PUBLIC_MIXPANEL_IN_DEVELOPMENT !== 'true') {
        logger.warn('faking mixpanel in development');
      }
      this._mixpanel = null;
    }
    this._registerCommonProps();

    // Subscribe to network state changes and update the IP address when online.
    // The callback will be invoked immediately with the current state.
    addEventListener(state => {
      if (state.isConnected && state.isInternetReachable) {
        void this._updateIpAddressAsync();
      }
    });
  }

  track(name: string, props?: Record<string, unknown>): void {
    this._enqueue(() => {
      logger.debug('track', {name, props});
      this._mixpanel?.track(name, {
        $ip: this._ipAddress,
        offline: !this._ipAddress,
        ...props,
      });
    });
  }

  identify(userId?: string): void {
    this._enqueue(() => {
      logger.debug('identify', {userId});
      this._mixpanel?.identify(userId);
    });
  }

  _enqueue(fn: () => void) {
    this._pending.push(fn);
    this._flush();
  }

  _flush() {
    if (this._ready && this._pending.length > 0) {
      logger.debug('_flush', {eventCount: this._pending.length});
      this._pending.forEach(fn => fn());
      this._pending = [];
    }
  }

  async _updateIpAddressAsync(): Promise<void> {
    try {
      // Prefer to fetch the public IP address from ipify.org
      this._ipAddress = await publicIP();
    } catch (error) {
      // fall back to the IP address of the device
      try {
        logger.warn('Unable to fetch public IP address!', {error});
        this._ipAddress = await Network.getIpAddressAsync();
      } catch (error) {
        logger.warn('Unable to fetch private IP address either!', {error});
        this._ipAddress = null;
      }
    }
    // We're ready when we've tried at least once to get our IP address
    logger.info('updated IP address', this._ipAddress);
    this._ready = true;
    this._flush();
  }

  _registerCommonProps(): void {
    this._mixpanel?.register({
      update_group_id: getUpdateGroupId(),
      update_version: getUpdateTimeAsVersionString(),
      application_version: Application.nativeApplicationVersion || 'n/a',
      application_build: Application.nativeBuildVersion || 'n/a',
      git_revision: process.env.EXPO_PUBLIC_GIT_REVISION || 'n/a',
      channel: Updates.channel || 'development',
    });
  }
}

const mixpanel = new MixpanelWrapper();

export default mixpanel;
