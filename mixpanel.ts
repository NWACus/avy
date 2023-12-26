import * as Application from 'expo-application';
import * as Network from 'expo-network';
import * as Updates from 'expo-updates';

import ExpoMixpanelAnalytics from '@bothrs/expo-mixpanel-analytics';
import {addEventListener, NetInfoState} from '@react-native-community/netinfo';
import publicIP from 'react-native-public-ip';

import {getUpdateGroupId} from 'hooks/useEASUpdateStatus';
import {logger as globalLogger} from 'logger';

const logger = globalLogger.child({module: 'mixpanel'});

class MixpanelWrapper {
  private _mixpanel: ExpoMixpanelAnalytics | null;
  private _pending: Array<() => void> = [];
  private _online = false;
  // string: we went online and we have an address.
  // null: we went online, tried to get the address, but failed.
  // undefined: we went offline and haven't come back online to get the address yet.
  private _ipAddress: string | null | undefined = undefined;

  constructor() {
    if (process.env.EXPO_PUBLIC_MIXPANEL_TOKEN && (process.env.NODE_ENV !== 'development' || process.env.EXPO_PUBLIC_MIXPANEL_IN_DEVELOPMENT === 'true')) {
      logger.info('Initializing mixpanel');
      this._mixpanel = new ExpoMixpanelAnalytics(process.env.EXPO_PUBLIC_MIXPANEL_TOKEN);
    } else {
      if (!process.env.EXPO_PUBLIC_MIXPANEL_TOKEN) {
        logger.warn('Skipping mixpanel initialization, no token configured');
      }
      if (process.env.NODE_ENV === 'development' && process.env.EXPO_PUBLIC_MIXPANEL_IN_DEVELOPMENT !== 'true') {
        logger.warn('Faking mixpanel in development');
      }
      this._mixpanel = null;
    }
    this._registerCommonProps();

    // Subscribe to network state changes and update the IP address when online.
    // The callback will be invoked immediately with the current state.
    addEventListener(state => {
      void this._updateNetworkStateAsync(state);
    });
  }

  track(name: string, props?: Record<string, unknown>): void {
    // Track offline status at time of recording, but try to attach an IP address to the
    // event at sending time.
    const offline = !this._online;
    this._enqueue(() => {
      const augmentedProps = {
        ...props,
        ip: this._ipAddress,
        offline,
      };
      logger.debug('track', {name, props: augmentedProps});
      this._mixpanel?.track(name, augmentedProps);
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
    if (this._online && this._ipAddress !== undefined && this._pending.length > 0) {
      logger.debug('_flush', {eventCount: this._pending.length});
      this._pending.forEach(fn => fn());
      this._pending = [];
    }
  }

  async _updateNetworkStateAsync(state: NetInfoState): Promise<void> {
    const online = !!state.isConnected && !!state.isInternetReachable;
    logger.trace('network state updated', online, this._online, this._ipAddress);
    if (online && !this._online) {
      logger.debug('Network is back online, getting IP address');
      this._online = true;
      this._ipAddress = undefined;
      let nextIpAddress: string | null = null;
      try {
        // Prefer to fetch the public IP address from ipify.org
        nextIpAddress = await publicIP();
      } catch (error) {
        // fall back to the IP address of the device
        try {
          logger.warn('Unable to fetch public IP address!', {error});
          nextIpAddress = await Network.getIpAddressAsync();
        } catch (error) {
          logger.warn('Unable to fetch private IP address either!', {error});
          nextIpAddress = null;
        }
      }
      // Note that when we get here, time could have elapsed, and we theoretically could
      // even have re-entered this function. We should make sure that we seem to be in the
      // state we expect to be in before setting the IP address.
      // If we get here and we're still online, then we can set the IP address.
      // If we went offline while the async task was executing, then we should ignore the result.
      if (this._online) {
        this._ipAddress = nextIpAddress;
        logger.info('Updated IP address', this._ipAddress);
      }
    } else if (!online && this._online) {
      logger.debug('Network is offline, setting IP address to undefined');
      this._online = false;
      this._ipAddress = undefined;
    }
    this._flush();
  }

  _registerCommonProps(): void {
    this._mixpanel?.register({
      update_group_id: getUpdateGroupId(),
      application_version: Application.nativeApplicationVersion || 'n/a',
      application_build: Application.nativeBuildVersion || 'n/a',
      git_revision: process.env.EXPO_PUBLIC_GIT_REVISION || 'n/a',
      channel: Updates.channel || 'development',
    });
  }
}

const mixpanel = new MixpanelWrapper();

export default mixpanel;
