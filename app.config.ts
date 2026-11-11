import {ConfigContext, ExpoConfig} from '@expo/config';

export default ({config}: ConfigContext): Partial<ExpoConfig> => {
  // `config` is the object loaded from app.json. Here, we fill in secrets that
  // we keep in the environment and out of code. For cloud builds, the secrets
  // are stored in Expo and supplied via process.env. For local builds, the
  // secrets can be stored in a .env file and loaded via direnv.

  // we're overwriting fields that were previously defined in app.json, so we know they're non-null:
  config.extra!.mapboxAPIKey = process.env.MAPBOX_API_KEY as string;
  config.extra!.log_level = process.env.LOG_LEVEL != null ? (process.env.LOG_LEVEL as string) : 'info';

  // Native Google sign-in for the Member auth POC. The plugin refuses to prebuild without the iOS
  // client's reversed id, so it is only added once that OAuth client exists.
  if (process.env.GOOGLE_IOS_URL_SCHEME) {
    config.plugins = [...(config.plugins ?? []), ['@react-native-google-signin/google-signin', {iosUrlScheme: process.env.GOOGLE_IOS_URL_SCHEME as string}]];
  }

  if (process.env.APP_VARIANT === 'preview') {
    // The iOS App Store requires that the version we publish has been pre-created in the developer portal.
    // Before an app is published to the store, it's possible to push an infinite amount of builds for that
    // version; once the version is published, no more builds are allowed. Therefore, our production app must
    // bump the version field before we send new binary builds. However, our preview app will never publish
    // anything, so we will never be able to have more than one version. We can either manually edit it to
    // match the version of the production app before pushing, or we can programmatically override the version
    // here to be monotonic.
    config.version = '1.0.0';
    config.name += ' (Preview)';
    config.ios!.bundleIdentifier = 'preview.' + config.ios!.bundleIdentifier;
    config.android!.package = 'preview.' + config.android!.package;
  }

  return config;
};
