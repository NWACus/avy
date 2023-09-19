import {ConfigContext, ExpoConfig} from '@expo/config';

export default ({config}: ConfigContext): Partial<ExpoConfig> => {
  // `config` is the object loaded from app.json. Here, we fill in secrets that
  // we keep in the environment and out of code. For cloud builds, the secrets
  // are stored in Expo and supplied via process.env. For local builds, the
  // secrets can be stored in a .env file and loaded via direnv.

  // we're overwriting fields that were previously defined in app.json, so we know they're non-null:
  /* eslint-disable @typescript-eslint/no-non-null-assertion */
  config.ios!.config!.googleMapsApiKey = process.env.IOS_GOOGLE_MAPS_API_KEY;
  config.android!.config!.googleMaps!.apiKey = process.env.ANDROID_GOOGLE_MAPS_API_KEY;
  config.extra!.sentry_dsn = process.env.SENTRY_DSN;
  config.extra!.log_level = process.env.LOG_LEVEL != null ? process.env.LOG_LEVEL : 'info';

  return config;
};
