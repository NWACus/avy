import {ExpoConfig, ConfigContext} from '@expo/config';

export default ({config}: ConfigContext): Partial<ExpoConfig> => {
    return {
        ...config,
        ios: {
            ...config.ios,
            config: {
                ...config.ios?.config,
                googleMapsApiKey: process.env.IOS_GOOGLE_MAPS_API_KEY,
            },
        },
        android: {
            ...config.android,
            config: {
                ...config.android?.config,
                googleMaps: {apiKey: process.env.ANDROID_GOOGLE_MAPS_API_KEY},
            },
        },
    }
};
