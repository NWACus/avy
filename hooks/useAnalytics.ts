import {useContext, useMemo} from 'react';

import {Logger} from 'browser-bunyan';
import PostHog, {usePostHog} from 'posthog-react-native';

import {LoggerContext} from 'loggerContext';
import {fireAndForget} from 'utils/fireAndForget';

// A thin wrapper around the PostHog client. Several PostHog v4 methods return a Promise; this wraps the
// fire-and-forget calls (screen, register) so rejections are logged instead of silently swallowed.
// `reloadFeatureFlags` returns its promise so callers that want the resolved flags can await it.
export interface Analytics {
  screen(...args: Parameters<PostHog['screen']>): void;
  capture(...args: Parameters<PostHog['capture']>): void;
  identify(...args: Parameters<PostHog['identify']>): void;
  register(...args: Parameters<PostHog['register']>): void;
  reloadFeatureFlags(...args: Parameters<PostHog['reloadFeatureFlagsAsync']>): ReturnType<PostHog['reloadFeatureFlagsAsync']> | undefined;
}

export const createAnalytics = (postHog: PostHog | undefined, logger: Logger): Analytics => ({
  screen: (...args) => fireAndForget(postHog?.screen(...args), `failed to capture ${args[0]} screen view`, logger),
  register: (...args) => fireAndForget(postHog?.register(...args), 'failed to register analytics super properties', logger),
  capture: (...args) => {
    postHog?.capture(...args);
  },
  identify: (...args) => {
    postHog?.identify(...args);
  },
  reloadFeatureFlags: (...args) => postHog?.reloadFeatureFlagsAsync(...args),
});

export const useAnalytics = (): Analytics => {
  const postHog = usePostHog();
  const {logger} = useContext(LoggerContext);
  return useMemo(() => createAnalytics(postHog, logger), [postHog, logger]);
};
