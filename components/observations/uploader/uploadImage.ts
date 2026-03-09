import axios from 'axios';
import {ImagePickerAssetSchema} from 'components/observations/ObservationFormData';
import {format, parse} from 'date-fns';
import {Action, SaveFormat, manipulateAsync} from 'expo-image-manipulator';

import {AvalancheCenterID, MediaItem, MediaUsage} from 'types/nationalAvalancheCenter';

interface PickedImage {
  uri: string;
  width: number;
  height: number;
  exif?: ImagePickerAssetSchema['exif'];
}
interface UploadImageOptions {
  apiPrefix: string;
  center_id: AvalancheCenterID;
  image: PickedImage;
  name: string;
  title: string;
  photoUsage: MediaUsage;
  caption?: string;
}

const loadImageData = async ({uri, width, height}: PickedImage): Promise<{imageDataBase64: string; mimeType: string; filename: string}> => {
  // This weird use of `slice` is because the version of Hermes that Expo is currently pinned to doesn't support `at()`
  const filename = uri.split('/').slice(-1)[0];
  const portrait = height > width;
  const maxDimension = portrait ? height : width;
  const clampedDimension = Math.min(maxDimension, 2048);
  const manipulationActions: Action[] = [];
  if (clampedDimension !== maxDimension) {
    manipulationActions.push({
      resize: {
        width: portrait ? undefined : clampedDimension,
        height: portrait ? clampedDimension : undefined,
      },
    });
  }

  // We are happy to always run the image through the image manipulation pipeline, even if
  // manipulationActions is empty, because it will resave the image as a JPEG and apply
  // any necessary transforms to make it look correct. Images with non-standard orientations
  // are not handled correctly by the NAC image pipeline (you get things like flipped thumbnails).
  // More info on EXIF orientation: https://sirv.com/help/articles/rotate-photos-to-be-upright/
  //
  // The solution is pretty simple: allow the expo image manipulation library to save a copy, which
  // writes the image with a "normal" orientation and applies any necessary transforms to make it look correct.
  const result = await manipulateAsync(uri, manipulationActions, {format: SaveFormat.JPEG, base64: true, compress: 0.9});
  return {imageDataBase64: result.base64 ?? '', filename, mimeType: 'image/jpeg'};
};

// Return a date string in the format that the NAC API expects, or null if the EXIF data is missing or malformed
export const captureDateFromExif = (exif?: PickedImage['exif']): string | null => {
  // DateTimeOriginal format is defined to be "YYYY:MM:DD HH:MM:SS"
  // reference: https://www.awaresystems.be/imaging/tiff/tifftags/privateifd/exif/datetimeoriginal.html
  try {
    if (exif?.DateTimeOriginal) {
      const {DateTimeOriginal} = exif;
      const date = parse(DateTimeOriginal, 'yyyy:MM:dd HH:mm:SS', new Date());
      return format(date, 'yyyy-MM-dd');
    }
  } catch (_e) {
    // fall through
  }
  return null;
};

export const uploadImage = async (taskId: string, {apiPrefix, image, name, center_id, photoUsage, title, caption}: UploadImageOptions): Promise<MediaItem> => {
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
    title,
    date_taken: captureDateFromExif(image.exif),
    caption,
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
