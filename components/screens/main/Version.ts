import * as Application from 'expo-application';
import * as Updates from 'expo-updates';
import {Platform} from 'react-native';

export const getVersionInfoFull = (mixpanelUserId: string | undefined, updateGroupId: string | undefined): string => {
  const versionTestFull = `Avy version ${Application.nativeApplicationVersion || 'n/a'} (${Application.nativeBuildVersion || 'n/a'})
Git revision ${process.env.EXPO_PUBLIC_GIT_REVISION || 'n/a'}
Update group ID ${updateGroupId || 'n/a'} (channel: ${Updates.channel || 'development'})
Update ID ${Updates.updateId || 'n/a'} (platform: ${Platform.OS})
User ID ${mixpanelUserId || 'n/a'}`;

  return versionTestFull;
};
