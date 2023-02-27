import axios from 'axios';
import * as FileSystem from 'expo-file-system';
import {isUndefined, omit} from 'lodash';

import AsyncStorage from '@react-native-async-storage/async-storage';
import {ObservationFormData} from 'components/observations/ObservationSchema';
import {AvalancheCenterID, MediaItem, mediaItemSchema, Observation} from 'types/nationalAvalancheCenter';
import {apiDateString} from 'utils/date';

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

const imageUploadCachePrefix = 'IMAGE_UPLOAD_CACHE';

export const clearUploadCache = async () => {
  const keys = await AsyncStorage.getAllKeys();
  keys.filter(k => k.startsWith(imageUploadCachePrefix)).map(async k => await AsyncStorage.removeItem(k));
};

const uploadImage = async ({apiPrefix, uri, name, center_id}: {apiPrefix: string; center_id: AvalancheCenterID; uri: string; name: string | undefined}): Promise<MediaItem> => {
  // TODO: apply tags to uploaded images so we can
  // - identify images uploaded by mobile app
  // - identify images uploaded in developer mode

  // If we've already uploaded this image once, don't do it again.
  const imageCacheKey = `${imageUploadCachePrefix}:${uri}`;
  const cached = await AsyncStorage.getItem(imageCacheKey);
  if (cached) {
    console.log(`Image ${uri} has already been uploaded, using cached media item`);
    try {
      return Promise.resolve(mediaItemSchema.parse(JSON.parse(cached)));
    } catch (error) {
      console.warn(`Unable to load cached image data for ${uri}, uploading it again`);
      await AsyncStorage.removeItem(imageCacheKey);
      // fallthrough
    }
  }

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
      access: 'anonymous', // TODO: plumb through use with photo credit / don't use
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
  await AsyncStorage.setItem(imageCacheKey, JSON.stringify(response.data));
  return response.data;
};

export const submitObservation = async ({
  apiPrefix,
  center_id,
  observationFormData,
}: {
  apiPrefix: string;
  center_id: AvalancheCenterID;
  observationFormData: ObservationFormData;
}): Promise<Partial<Observation>> => {
  // TODO: how to avoid double-uploading images?
  const media = await Promise.all(
    observationFormData.uploadPaths.map(uri =>
      uploadImage({
        apiPrefix,
        uri,
        name: observationFormData.name,
        center_id,
      }),
    ),
  );
  console.log('media', media);

  const url = `${apiPrefix}/obs/v1/public/observation/`;
  const payload = {
    ...observationFormData,
    center_id,
    organization: center_id,
    status: 'published',
    media: media,
    observer_type: 'public',
    // Date has to be a plain-old YYYY-MM-DD string
    start_date: apiDateString(observationFormData.start_date),
  };

  const {data} = await axios.post(url, payload);
  // You'd think we could feed data to Zod and get a strongly typed object back, but
  // the object that we get back from the post can't actually be parsed by our schema :(
  return data as Partial<Observation>;
};
