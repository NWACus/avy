import Constants from 'expo-constants';
import {Platform} from 'react-native';

export const useGooglePlacesAPIKey = () => {
  const platform = Platform.OS;
  switch (platform) {
    case 'ios':
      return Constants.expoConfig.ios.config.googleMapsApiKey;
    case 'android':
      return Constants.expoConfig.android.config.googleMaps.apiKey;
    case 'macos':
    case 'windows':
    case 'web':
      throw new Error(`No Google Places API key exists for platform: ${platform}`);
  }
  const invalid: never = platform;
  throw new Error(`Unknown platform: ${invalid}`);
};
