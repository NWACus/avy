import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import {Logger} from 'browser-bunyan';
import * as FileSystem from 'expo-file-system';
import {manipulateAsync, SaveFormat} from 'expo-image-manipulator';
import {ImagePickerAsset} from 'expo-image-picker';
import md5 from 'md5';

import {ObservationFormData} from 'components/observations/ObservationFormData';
import {AvalancheCenterID, MediaItem, mediaItemSchema, MediaUsage, Observation} from 'types/nationalAvalancheCenter';
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

// TODO: should put an expiration time on these cache entries and clear them less aggressively.
export const clearUploadCache = async () => {
  const keys = await AsyncStorage.getAllKeys();
  keys.filter(k => k.startsWith(imageUploadCachePrefix)).map(async k => await AsyncStorage.removeItem(k));
};

interface UploadImageOptions {
  apiPrefix: string;
  center_id: AvalancheCenterID;
  image: ImagePickerAsset;
  name: string;
  photoUsage: MediaUsage;
}

const getImageData = async (image: ImagePickerAsset): Promise<{imageDataBase64: string; mimeType: string; filename: string}> => {
  const {uri} = image;

  // This weird use of `slice` is because the version of Hermes that Expo is currently pinned to doesn't support `at()`
  const filename = uri.split('/').slice(-1)[0];
  const extension = filename.split('.').slice(-1)[0] || '';

  const orientation = image.exif?.Orientation as string | number;
  if (typeof orientation !== 'number' || orientation <= 1) {
    const imageDataBase64 = await FileSystem.readAsStringAsync(uri, {encoding: 'base64'});
    return {imageDataBase64, filename, mimeType: extensionToMimeType(extension)};
  } else {
    // This is an image with a non-standard orientation, and it's not handled correctly by the NAC image
    // pipeline (you get things like flipped thumbnails). More info on EXIF orientation: https://sirv.com/help/articles/rotate-photos-to-be-upright/
    //
    // The solution is pretty simple: allow the expo image manipulation library to save a copy, which
    // writes the image with a "normal" orientation and applies any necessary transforms to make it look correct.
    const result = await manipulateAsync(uri, [], {format: SaveFormat.JPEG, base64: true});
    return {imageDataBase64: result.base64 ?? '', filename, mimeType: 'image/jpeg'};
  }
};

const uploadImage = async (logger: Logger, {apiPrefix, image, name, center_id, photoUsage}: UploadImageOptions): Promise<MediaItem> => {
  const {imageDataBase64, filename, mimeType} = await getImageData(image);

  const payload = {
    file: `data:${mimeType};base64,${imageDataBase64}`,
    type: 'image',
    file_name: filename,
    center_id,
    forecast_zone_id: [],
    taken_by: name,
    access: photoUsage,
    source: 'public',
    // TODO would be nice to tag images that came from this app, but haven't figured that out yet
  };

  // If we've already uploaded this image once with a particular set of settings, don't do it again.
  const payloadHash = md5(JSON.stringify(payload));
  const imageCacheKey = `${imageUploadCachePrefix}:${payloadHash}`;
  const cached = await AsyncStorage.getItem(imageCacheKey);
  const thisLogger = logger.child({uri: image.uri});
  if (cached) {
    thisLogger.debug({payload: payload}, `image has already been uploaded, using cached media item`);
    try {
      return Promise.resolve(mediaItemSchema.parse(JSON.parse(cached)));
    } catch (error) {
      thisLogger.warn(`unable to load cached image data, uploading it again`);
      await AsyncStorage.removeItem(imageCacheKey);
      // fallthrough
    }
  }

  const response = await axios.post<MediaItem>(`${apiPrefix}/v2/public/media`, payload, {
    headers: {
      // Public API uses the Origin header to determine who's authorized to call it
      Origin: 'https://nwac.us',
    },
  });
  await AsyncStorage.setItem(imageCacheKey, JSON.stringify(response.data));
  return response.data;
};

export const submitObservation = async (
  logger: Logger,
  {
    apiPrefix,
    center_id,
    observationFormData,
  }: {
    apiPrefix: string;
    center_id: AvalancheCenterID;
    observationFormData: Partial<ObservationFormData>;
  },
): Promise<Observation> => {
  const {photoUsage, name} = observationFormData;
  // TODO: probably should upload these sequentially instead of in parallel
  const media = await Promise.all(
    observationFormData.images?.map(image =>
      uploadImage(logger, {
        apiPrefix: apiPrefix,
        image: image,
        name: name ?? '',
        center_id: center_id,
        photoUsage: photoUsage ?? MediaUsage.Credit,
      }),
    ) ?? [],
  );
  logger.info({media: media}, 'submitted media');

  const url = `${apiPrefix}/obs/v1/public/observation/`;
  const payload = {
    ...observationFormData,
    center_id,
    organization: center_id,
    status: 'published',
    media: media,
    observer_type: 'public',
    // Date has to be a plain-old YYYY-MM-DD string
    start_date: apiDateString(observationFormData.start_date ?? new Date()),
  };

  const {data} = await axios.post<Observation>(url, payload);
  // You'd think we could feed data to Zod and get a strongly typed object back, but
  // the object that we get back from the post can't actually be parsed by our schema :(
  // TODO(skuznets): figure out what we get from POST and actually parse it ...
  return data;
};
