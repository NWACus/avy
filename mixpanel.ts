import * as Application from 'expo-application';

import ExpoMixpanelAnalytics from '@bothrs/expo-mixpanel-analytics';

import {getUpdateGroupId, getUpdateTimeAsVersionString} from 'hooks/useEASUpdateStatus';
import {logger as globalLogger} from 'logger';

const logger = globalLogger.child({module: 'mixpanel'});

class FakeMixpanel implements ExpoMixpanelAnalytics {
  ready = true;
  token = process.env.EXPO_PUBLIC_MIXPANEL_TOKEN ?? '';
  storageKey = '';
  queue = [];
  constants = {};
  superProps = null;
  register(props: unknown): void {
    logger.debug('mixpanel.register', {props});
  }
  track(name: string, props?: unknown): void {
    logger.debug('mixpanel.track', {name, props});
  }
  identify(userId?: string): void {
    logger.debug('mixpanel.identify', {userId});
  }
  reset(): void {
    logger.debug('mixpanel.reset');
  }
  people_set(props: unknown): void {
    logger.debug('mixpanel.people_set', {props});
  }
  people_set_once(props: unknown): void {
    logger.debug('mixpanel.people_set_once', {props});
  }
  people_unset(props: unknown): void {
    logger.debug('mixpanel.people_unset', {props});
  }
  people_increment(props: unknown): void {
    logger.debug('mixpanel.people_increment', {props});
  }
  people_append(props: unknown): void {
    logger.debug('mixpanel.people_append', {props});
  }
  people_union(props: unknown): void {
    logger.debug('mixpanel.people_union', {props});
  }
  people_delete_user(): void {
    logger.debug('mixpanel.people_delete_user');
  }
  _flush(): void {
    logger.debug('mixpanel._flush');
  }
  _people(operation: unknown, props: unknown): void {
    logger.debug('mixpanel._people', {operation, props});
  }
  _pushEvent(event: unknown): Promise<Response> {
    logger.debug('mixpanel._pushEvent', {event});
    return Promise.resolve(new Response());
  }
  _pushProfile(data: unknown): Promise<Response> {
    logger.debug('mixpanel._pushProfile', {data});
    return Promise.resolve(new Response());
  }
}

const initialize = (): ExpoMixpanelAnalytics => {
  if (process.env.EXPO_PUBLIC_MIXPANEL_TOKEN && (process.env.NODE_ENV !== 'development' || process.env.EXPO_PUBLIC_MIXPANEL_IN_DEVELOPMENT === 'true')) {
    logger.info('initializing mixpanel');
    const mixpanel = new ExpoMixpanelAnalytics(process.env.EXPO_PUBLIC_MIXPANEL_TOKEN);
    return mixpanel;
  } else {
    if (!process.env.EXPO_PUBLIC_MIXPANEL_TOKEN) {
      logger.warn('skipping mixpanel initialization, no token configured');
    }
    if (process.env.NODE_ENV === 'development' && process.env.EXPO_PUBLIC_MIXPANEL_IN_DEVELOPMENT !== 'true') {
      logger.warn('faking mixpanel in development');
    }
    return new FakeMixpanel();
  }
};

const mixpanel = initialize();
mixpanel.register({
  update_group_id: getUpdateGroupId(),
  update_version: getUpdateTimeAsVersionString(),
  application_version: Application.nativeApplicationVersion || 'n/a',
  application_build: Application.nativeBuildVersion || 'n/a',
  git_revision: process.env.EXPO_PUBLIC_GIT_REVISION || 'n/a',
});

export default mixpanel;
