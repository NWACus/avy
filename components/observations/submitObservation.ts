import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import * as FileSystem from 'expo-file-system';
import {manipulateAsync, SaveFormat} from 'expo-image-manipulator';
import uuid from 'react-native-uuid';
import {z} from 'zod';

import {ObservationFormData, simpleObservationFormSchema} from 'components/observations/ObservationFormData';
import {logger} from 'logger';
import {AvalancheCenterID, avalancheCenterIDSchema, MediaItem, mediaItemSchema, MediaUsage, Observation} from 'types/nationalAvalancheCenter';
import {apiDateString} from 'utils/date';

const taskQueueEntryTypeSchema = z.enum(['image', 'observation']);
type TaskQueueEntryType = z.infer<typeof taskQueueEntryTypeSchema>;

const taskQueueEntrySchema = z.discriminatedUnion('type', [
  z.object({
    id: z.string().uuid(),
    type: z.literal('image'),
    data: z.object({
      apiPrefix: z.string(),
      image: z.object({
        uri: z.string(),
        exif: z
          .object({
            Orientation: z.number().or(z.string()).optional(),
          })
          .optional(),
      }),
      name: z.string(),
      center_id: avalancheCenterIDSchema,
      photoUsage: z.nativeEnum(MediaUsage),
    }),
  }),
  z.object({
    id: z.string().uuid(),
    type: z.literal('observation'),
    data: simpleObservationFormSchema.partial().extend({
      url: z.string().url(),
      imageTaskIds: z.array(z.string().uuid()),
      center_id: avalancheCenterIDSchema,
      organization: avalancheCenterIDSchema,
      status: z.literal('published'),
      observer_type: z.literal('public'),
      // Date has to be a plain-old YYYY-MM-DD string
      start_date: z.string(),
    }),
  }),
]);
type TaskQueueEntry = z.infer<typeof taskQueueEntrySchema>;
type ImageTaskData = Extract<TaskQueueEntry, {type: 'image'}>['data'];
type ObservationTaskData = Extract<TaskQueueEntry, {type: 'observation'}>['data'];

const taskQueueSchema = z.array(taskQueueEntrySchema);

const TASK_QUEUE_KEY = 'TASK_QUEUE';
let pendingTaskQueueUpdate: null | NodeJS.Timeout = null;

const processTaskQueue = async () => {
  pendingTaskQueueUpdate = null;
  const queue = taskQueueSchema.parse(JSON.parse((await AsyncStorage.getItem(TASK_QUEUE_KEY)) || '[]'));
  logger.debug({queue}, 'processTaskQueue');
  if (queue.length === 0) {
    return;
  }
  const entry = queue[0];
  try {
    switch (entry.type) {
      case 'image':
        await uploadImage(entry.id, entry.data);
        break;
      case 'observation':
        await uploadObservation(entry.id, entry.data);
        break;
    }
    logger.debug({entry}, `processed task queue entry successfully`);
    await AsyncStorage.setItem(TASK_QUEUE_KEY, JSON.stringify(queue.slice(1)));
    subscribers.forEach(subscriber => subscriber(entry, true, 0));
  } catch (error) {
    logger.error({error, entry}, `error processing task queue entry`);
    subscribers.forEach(subscriber => subscriber(entry, false, 0));
  } finally {
    pendingTaskQueueUpdate = setTimeout(() => void processTaskQueue(), 1000);
  }
};

const enqueueTasks = async (entries: TaskQueueEntry[]) => {
  logger.debug({entries}, 'enqueueTasks');
  const queue = taskQueueSchema.parse(JSON.parse((await AsyncStorage.getItem(TASK_QUEUE_KEY)) || '[]'));
  queue.push(...entries);
  await AsyncStorage.setItem(TASK_QUEUE_KEY, JSON.stringify(queue));
  if (!pendingTaskQueueUpdate) {
    pendingTaskQueueUpdate = setTimeout(() => void processTaskQueue(), 1000);
  }
};

const resetTaskQueue = async () => {
  logger.debug('resetTaskQueue');
  await AsyncStorage.setItem(TASK_QUEUE_KEY, JSON.stringify([]));
};

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

const getUploadedImageByTaskId = async (taskId: string): Promise<MediaItem | null> => {
  const imageCacheKey = `${imageUploadCachePrefix}:${taskId}`;
  const imageCacheString = await AsyncStorage.getItem(imageCacheKey);
  return imageCacheString ? mediaItemSchema.parse(JSON.parse(imageCacheString)) : null;
};

const setUploadedImageByTaskId = async (taskId: string, image: MediaItem): Promise<void> => {
  const imageCacheKey = `${imageUploadCachePrefix}:${taskId}`;
  await AsyncStorage.setItem(imageCacheKey, JSON.stringify(image));
};

const clearUploadedImageByTaskId = async (taskId: string): Promise<void> => {
  const imageCacheKey = `${imageUploadCachePrefix}:${taskId}`;
  await AsyncStorage.removeItem(imageCacheKey);
};

type Subscriber = (entry: TaskQueueEntry, success: boolean, attempts: number) => void;
let subscribers: Subscriber[] = [];
const subscribeToTaskInvocations = (callback: Subscriber) => {
  subscribers.push(callback);
};

const unsubscribeFromTaskInvocations = (callback: Subscriber) => {
  subscribers = subscribers.filter(subscriber => subscriber !== callback);
};

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

const uploadImage = async (taskId: string, {apiPrefix, image, name, center_id, photoUsage}: UploadImageOptions): Promise<MediaItem> => {
  // If we've already uploaded this image once, don't do it again.
  const cached = await getUploadedImageByTaskId(taskId);
  const thisLogger = logger.child({uri: image.uri});
  if (cached) {
    thisLogger.debug({taskId, image}, `image has already been uploaded, using cached media item`);
    try {
      return Promise.resolve(cached);
    } catch (error) {
      thisLogger.warn(`unable to load cached image data, uploading it again`);
      await clearUploadedImageByTaskId(taskId);
      // fallthrough
    }
  }

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
  await setUploadedImageByTaskId(taskId, response.data);
  return response.data;
};

async function uploadObservation(id: string, data: ObservationTaskData): Promise<Observation> {
  const {url, imageTaskIds, ...params} = data;
  const media = (await Promise.all(imageTaskIds.map(getUploadedImageByTaskId))).filter((image): image is MediaItem => image != null);
  const payload: Partial<Observation> = {
    ...params,
    media,
    obs_source: 'public',
    body: params.observation_summary,
  };
  try {
    const {data: responseData} = await axios.post<Observation>(url, payload, {
      headers: {
        // Public API uses the Origin header to determine who's authorized to call it
        Origin: 'https://nwac.us',
      },
    });
    // You'd think we could feed data to Zod and get a strongly typed object back, but
    // the object that we get back from the post can't actually be parsed by our schema :(
    // TODO(skuznets): figure out what we get from POST and actually parse it ...
    return responseData;
  } catch (error) {
    logger.error(
      {
        error,
        url,
        payload,
      },
      'error uploading observation',
    );
    throw error;
  }
}

export const submitObservation = async ({
  apiPrefix,
  center_id,
  observationFormData,
}: {
  apiPrefix: string;
  center_id: AvalancheCenterID;
  observationFormData: Partial<ObservationFormData>;
}): Promise<void> => {
  try {
    const {photoUsage, name} = observationFormData;

    const tasks: TaskQueueEntry[] = [];

    observationFormData.images?.forEach(image => {
      tasks.push({
        // uuid.v4 has a goofy implementation that only returns a byte array if you pass a byte array in
        id: uuid.v4() as string,
        type: 'image',
        data: {
          apiPrefix: apiPrefix,
          image: {
            uri: image.uri,
            exif: image.exif
              ? {
                  // The type of ImagePickerAsset.exif is (unfortunately) Record<string, any>
                  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                  Orientation: image.exif.Orientation,
                }
              : undefined,
          },
          name: name ?? '',
          center_id: center_id,
          photoUsage: photoUsage ?? MediaUsage.Credit,
        },
      });
    });

    const imageTaskIds = tasks.map(task => task.id);
    // uuid.v4 has a goofy implementation that only returns a byte array if you pass a byte array in
    const uploadTaskId = uuid.v4() as string;
    const url = `${apiPrefix}/obs/v1/public/observation/`;
    tasks.push({
      id: uploadTaskId,
      type: 'observation',
      data: {
        ...observationFormData,
        imageTaskIds,
        url,
        center_id,
        organization: center_id,
        status: 'published',
        observer_type: 'public',
        // Date has to be a plain-old YYYY-MM-DD string
        start_date: apiDateString(observationFormData.start_date ?? new Date()),
      },
    });

    const promise: Promise<void> = new Promise((resolve, _reject) => {
      const listener = (entry: TaskQueueEntry, success: boolean) => {
        if (entry.type === 'observation' && entry.id === uploadTaskId) {
          if (success) {
            resolve(/*entry.data as Observation*/);
            unsubscribeFromTaskInvocations(listener);
          }
        }
      };
      subscribeToTaskInvocations(listener);
    });

    await enqueueTasks(tasks);

    return promise;
  } catch (e) {
    logger.error({e}, 'error submitting observation');
    throw e;
  }
};

// Kick off the task queue on startup
pendingTaskQueueUpdate = setTimeout(() => void processTaskQueue(), 1000);
