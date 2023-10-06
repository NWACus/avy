import axios from 'axios';
import * as FileSystem from 'expo-file-system';
import {manipulateAsync, SaveFormat} from 'expo-image-manipulator';

import {AvalancheCenterID, MediaItem, MediaUsage} from 'types/nationalAvalancheCenter';

interface PickedImage {
  uri: string;
  exif?: {
    // this is how it's defined in expo-image-picker
    Orientation?: string | number;
  };
}
interface UploadImageOptions {
  apiPrefix: string;
  center_id: AvalancheCenterID;
  image: PickedImage;
  name: string;
  photoUsage: MediaUsage;
}

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

const loadImageData = async ({uri, exif}: PickedImage): Promise<{imageDataBase64: string; mimeType: string; filename: string}> => {
  // This weird use of `slice` is because the version of Hermes that Expo is currently pinned to doesn't support `at()`
  const filename = uri.split('/').slice(-1)[0];
  const extension = filename.split('.').slice(-1)[0] || '';

  const orientation = exif?.Orientation as string | number;
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

export const uploadImage = async (taskId: string, {apiPrefix, image, name, center_id, photoUsage}: UploadImageOptions): Promise<MediaItem> => {
  const {imageDataBase64, filename, mimeType} = await loadImageData(image);

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

  const response = await axios.post<MediaItem>(`${apiPrefix}/v2/public/media`, payload, {
    headers: {
      // Public API uses the Origin header to determine who's authorized to call it
      Origin: 'https://nwac.us',
    },
  });
  return response.data;
};
