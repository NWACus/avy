import {useContext, useMemo} from 'react';

import {NavigationState} from '@react-navigation/native';
import {Logger} from 'browser-bunyan';
import PostHog, {usePostHog} from 'posthog-react-native';

import {LoggerContext} from 'loggerContext';
import {AvalancheCenterID} from 'types/nationalAvalancheCenter';
import {fireAndForget} from 'utils/fireAndForget';

// Where a center switch was initiated from. Constrains the `eventOrigin` of the `centerSwitch` event
// to a known set of values so the data stays clean across call sites.
export enum CenterSwitchOrigin {
  Map = 'Map',
  CenterSelectorView = 'CenterSelectorView',
}

// Any navigation object (from screen props or from useNavigation) exposes getState().
interface NavigationWithState {
  getState: () => NavigationState;
}

/**
 * Returns the name of the route directly beneath the current one in the navigator — i.e. the screen
 * the current screen was presented from. Intended for use as an analytics property to distinguish
 * where a screen/action was reached from. Returns null (a valid analytics value, unlike undefined)
 * when the current screen is the first in its navigator (no presenter).
 */
export const getPresentedFromForAnalytics = (navigation: NavigationWithState): string | null => {
  const state = navigation.getState();
  return state.routes[state.index - 1]?.name ?? null;
};

type EventProperties = NonNullable<Parameters<PostHog['capture']>[1]>;
type EventOptions = Parameters<PostHog['capture']>[2];

export type CenteredEventProperties = EventProperties & {center: AvalancheCenterID};
export type CenterlessEventProperties = EventProperties & {center?: never};

// A thin wrapper around the PostHog client. Several PostHog v4 methods return a Promise; this wraps the
// fire-and-forget calls (screen, register) so rejections are logged instead of silently swallowed.
// `reloadFeatureFlags` returns its promise so callers that want the resolved flags can await it.
export interface Analytics {
  screen(name: string, properties: CenteredEventProperties, options?: EventOptions): void;
  capture(event: string, properties: CenteredEventProperties, options?: EventOptions): void;
  captureCenterSwitch(switchedFrom: AvalancheCenterID, switchedTo: AvalancheCenterID, origin: CenterSwitchOrigin): void;
  identify(distinctId: string, properties?: CenterlessEventProperties, options?: EventOptions): void;
  register(properties: CenterlessEventProperties): void;
  reloadFeatureFlags(...args: Parameters<PostHog['reloadFeatureFlagsAsync']>): ReturnType<PostHog['reloadFeatureFlagsAsync']> | undefined;
}

export const createAnalytics = (postHog: PostHog | undefined, logger: Logger): Analytics => ({
  screen: (name, properties, options) => fireAndForget(postHog?.screen(name, properties, options), `failed to capture ${name} screen view`, logger),
  register: properties => fireAndForget(postHog?.register(properties), 'failed to register analytics super properties', logger),
  capture: (event, properties, options) => {
    postHog?.capture(event, properties, options);
  },
  captureCenterSwitch: (switchedFrom, switchedTo, origin) => {
    // To be consistent with other events, center_switched captures a center property that is the 'switchedTo' center
    postHog?.capture('center_switched', {center: switchedTo, switched_from: switchedFrom, switched_to: switchedTo, event_origin: origin});
  },
  identify: (distinctId, properties, options) => {
    postHog?.identify(distinctId, properties, options);
  },
  reloadFeatureFlags: (...args) => postHog?.reloadFeatureFlagsAsync(...args),
});

export const useAnalytics = (): Analytics => {
  const postHog = usePostHog();
  const {logger} = useContext(LoggerContext);
  return useMemo(() => createAnalytics(postHog, logger), [postHog, logger]);
};
