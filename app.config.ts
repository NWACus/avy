import {ExpoConfig, ConfigContext} from '@expo/config';

export default ({config}: ConfigContext): ExpoConfig => {
  if (!config.ios.config) {
    config.ios.config = {};
  }
  config.ios.config.googleMapsApiKey = process.env.IOS_GOOGLE_MAPS_API_KEY;
  if (!config.android.config) {
    config.android.config = {};
  }
  config.android.config.googleMaps = {apiKey: process.env.ANDROID_GOOGLE_MAPS_API_KEY};
  return {
    ...config,
  };
};
