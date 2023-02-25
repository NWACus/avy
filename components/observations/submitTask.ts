import axios from 'axios';
import * as FileSystem from 'expo-file-system';
import {isUndefined, omit} from 'lodash';
import {AvalancheCenterID, MediaItem} from 'types/nationalAvalancheCenter';

const extensionToMimeType = (extension: string) => {
  switch (extension.toLowerCase()) {
    case 'jpeg':
    case 'jpg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    default:
      throw new Error(`Unknown mime type for extension: ${extension}`);
  }
};

export const uploadImage = async ({
  apiPrefix,
  uri,
  name,
  center_id,
}: {
  apiPrefix: string;
  uri: string;
  name: string | undefined;
  center_id: AvalancheCenterID;
}): Promise<MediaItem> => {
  // This weird use of `slice` is because the version of Hermes that Expo is currently pinned to doesn't support `at()`
  const filename = uri.split('/').slice(-1)[0];
  const extension = filename.split('.').slice(-1)[0] || '';

  const base64Data = await FileSystem.readAsStringAsync(uri, {encoding: 'base64'});
  const payload = omit(
    {
      file: `data:${extensionToMimeType(extension)};base64,${base64Data}`,
      type: 'image',
      file_name: filename,
      center_id,
      forecast_zone_id: [],
      taken_by: name,
      access: 'anonymous', // TODO: use with photo credit / don't use
      source: 'public',
    },
    isUndefined,
  );
  const response = await axios.post<MediaItem>(`${apiPrefix}/v2/public/media`, payload, {
    headers: {
      // Public API uses the Origin header to determine who's authorized to call it
      Origin: 'https://nwac.us',
    },
  });
  return response.data;
};

// export const submitObservation = (observation: Obser): Promise<boolean> => {};
