import {ConfigContext, ExpoConfig} from '@expo/config';
import md5 from 'md5';

export default ({config}: ConfigContext): Partial<ExpoConfig> => {
  // `config` is the object loaded from app.json. Here, we fill in secrets that
  // we keep in the environment and out of code. For cloud builds, the secrets
  // are stored in Expo and supplied via process.env. For local builds, the
  // secrets can be stored in a .env file and loaded via direnv.

  // we're overwriting fields that were previously defined in app.json, so we know they're non-null:
  /* eslint-disable @typescript-eslint/no-non-null-assertion */
  config.ios!.config!.googleMapsApiKey = process.env.IOS_GOOGLE_MAPS_API_KEY;
  config.extra!.googleMapsApiKey!.ios = process.env.IOS_GOOGLE_MAPS_API_KEY;
  config.extra!.googleMapsApiKey!.android = process.env.ANDROID_GOOGLE_MAPS_API_KEY;
  config.extra!.googleMapsApiKey!.ios_md5 = md5(process.env.IOS_GOOGLE_MAPS_API_KEY);
  config.extra!.googleMapsApiKey!.android_md5 = md5(process.env.ANDROID_GOOGLE_MAPS_API_KEY);
  config.android!.config!.googleMaps!.apiKey = process.env.ANDROID_GOOGLE_MAPS_API_KEY;
  config.hooks!.postPublish![0]!.config!.authToken = process.env.SENTRY_API_TOKEN;
  config.extra!.sentry_dsn = process.env.SENTRY_DSN;
  if (process.env.LOG_NETWORK != null) {
    config.extra!.log_network = process.env.LOG_NETWORK;
  } else if (process.env.LOG_REQUESTS != null) {
    config.extra!.log_network = 'requests';
  }
  config.extra!.log_network_matching = process.env.LOG_NETWORK_MATCHING != null ? process.env.LOG_NETWORK_MATCHING : 'https';

  return config;
};
