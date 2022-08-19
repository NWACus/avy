import {ExpoConfig, ConfigContext} from '@expo/config';

export default ({config}: ConfigContext): ExpoConfig => {
  if (!config.ios.config) {
    config.ios.config = {};
  }
  config.ios.config.googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!config.android.config) {
    config.android.config = {};
  }
  config.android.config.googleMaps = {apiKey: process.env.GOOGLE_MAPS_API_KEY};
  return {
    ...config,
  };
};
