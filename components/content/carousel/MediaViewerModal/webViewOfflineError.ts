import {Platform} from 'react-native';

const ANDROID_OFFLINE_ERROR_CODE = -2;
const IOS_OFFLINE_ERROR_CODE = -1009;

export const isOfflineErrorCode = (errorCode: number) => {
  return (Platform.OS === 'android' && errorCode == ANDROID_OFFLINE_ERROR_CODE) || (Platform.OS === 'ios' && errorCode == IOS_OFFLINE_ERROR_CODE);
};
