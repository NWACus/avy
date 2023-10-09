jest.mock('components/observations/uploader/uploadImage');

import AsyncStorage from '@react-native-async-storage/async-storage';
import {AxiosError} from 'axios';
import {ObservationUploader, backoffTimeMs, isRetryableError} from 'components/observations/uploader/ObservationsUploader';
import {TaskQueueEntry} from 'components/observations/uploader/Task';
import {uploadImage as uploadImageOriginal} from 'components/observations/uploader/uploadImage';
// import Deferred from 'tests/helpers/Deferred';
import {logger} from 'logger';
import {MediaItem, MediaType, MediaUsage} from 'types/nationalAvalancheCenter';

const uploadImage = uploadImageOriginal as jest.MockedFunction<typeof uploadImageOriginal>;

// Deferred wraps up a Promise and allows the promise to be resolved or rejected externally.
// This is different from a vanilla Promise, which only allows accessing its resolve/reject
// methods in the Promise constructor. We use this in tests to allow us to resolve/reject
// mocks and test various scenarios.
class Deferred<T> {
  public promise: Promise<T>;
  public resolve!: (value: T | PromiseLike<T>) => void;
  public reject!: (reason?: unknown) => void;
  constructor() {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    this.promise = new Promise<T>(function (resolve, reject) {
      self.reject = reject;
      self.resolve = resolve;
    });
  }
}

const createAxiosError = (status: number): AxiosError =>
  new AxiosError(
    'Boom!',
    'ESOMETHING',
    {
      url: 'http://localhost:3000',
    },
    {
      path: '/foo',
    },
    {
      status,
      config: {
        url: 'http://localhost:3000',
      },
      headers: {},
      data: {},
      statusText: 'Boom!',
    },
  );

describe('isRetryableError', () => {
  it('should return true for network offline errors', () => {
    const error = new AxiosError(
      'Boom!',
      'ERR_NETWORK',
      {
        url: 'http://localhost:3000',
      },
      {
        path: '/foo',
      },
      {
        status: 400,
        config: {
          url: 'http://localhost:3000',
        },
        headers: {},
        data: {},
        statusText: 'Boom!',
      },
    );
    expect(isRetryableError(error)).toBe(true);
  });

  it('should return true for server errors', () => {
    const error = createAxiosError(500);
    expect(isRetryableError(error)).toBe(true);
  });

  it('should return true for request timeout errors', () => {
    const error = createAxiosError(408);
    expect(isRetryableError(error)).toBe(true);
  });

  it('should return true for too early errors', () => {
    const error = createAxiosError(425);
    expect(isRetryableError(error)).toBe(true);
  });

  it('should return true for rate limited errors', () => {
    const error = createAxiosError(429);
    expect(isRetryableError(error)).toBe(true);
  });

  it('should return false for non-retryable errors', () => {
    const error = createAxiosError(400);
    expect(isRetryableError(error)).toBe(false);
  });

  it('should return false for non-network errors', () => {
    const error = new Error('Some Error');
    expect(isRetryableError(error)).toBe(false);
  });

  it('should return false for random objects', () => {
    const error = 'howdy';
    expect(isRetryableError(error)).toBe(false);
  });
});

describe('backoffTimeMs', () => {
  it('should return 0 for the first attempt', () => {
    expect(backoffTimeMs(0)).toBe(0);
  });
  it('should return 1000 for the second attempt', () => {
    expect(backoffTimeMs(1)).toBe(2000);
  });
  it('should return 4000 for the third attempt', () => {
    expect(backoffTimeMs(2)).toBe(4000);
  });
  it('should return 8000 for the fourth attempt', () => {
    expect(backoffTimeMs(3)).toBe(8000);
  });
  it('should return 16000 for the fourth attempt', () => {
    expect(backoffTimeMs(4)).toBe(16000);
  });
  it('should return 30000 for the fourth attempt and beyond', () => {
    expect(backoffTimeMs(5)).toBe(30000);
    expect(backoffTimeMs(10)).toBe(30000);
    expect(backoffTimeMs(100)).toBe(30000);
  });
});

describe('ObservationUploader', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.resetAllMocks();
    jest.useRealTimers();
  });

  const createUploader = async () => {
    const uploader = new ObservationUploader();
    const processTaskQueueInvocations: Deferred<void>[] = [];
    const processTaskQueue = uploader['processTaskQueue'];
    // the `as keyof typeof uploader` allows us to spy on the private method `processTaskQueue`
    const processTaskQueueSpy = jest.spyOn(uploader, 'processTaskQueue' as keyof typeof uploader).mockImplementation(async () => {
      logger.info('processTaskQueue called');
      const deferred = new Deferred<void>();
      processTaskQueueInvocations.push(deferred);
      try {
        await processTaskQueue.call(uploader);
        deferred.resolve();
      } catch (error) {
        logger.info('processTaskQueue caught error');
        deferred.reject(error);
      }
      logger.info('processTaskQueue finished');
    });
    await uploader.initialize();
    return {uploader, processTaskQueueSpy, processTaskQueueInvocations};
  };

  it('expects to be initialized before performing other operations', async () => {
    const uploader = new ObservationUploader();

    await expect(async () => await uploader.enqueueTasks([])).rejects.toThrow(/ObservationUploader not initialized/);
    await expect(async () => await uploader.resetTaskQueue()).rejects.toThrow(/ObservationUploader not initialized/);
    expect(() => uploader.subscribeToTaskInvocations(() => undefined)).toThrow(/ObservationUploader not initialized/);
    expect(() => uploader.unsubscribeFromTaskInvocations(() => undefined)).toThrow(/ObservationUploader not initialized/);
  });

  it('should start in an idle state', async () => {
    const {processTaskQueueSpy} = await createUploader();
    expect(processTaskQueueSpy).not.toHaveBeenCalled();
  });

  it('should clear the task queue on startup if the contents are invalid', async () => {
    await AsyncStorage.setItem(ObservationUploader['TASK_QUEUE_KEY'], '[{"foo": "bar"}]');
    const {uploader} = await createUploader();
    await uploader.initialize();
    expect(uploader['ready']).toBeTruthy();
    expect(uploader['taskQueue']).toHaveLength(0);
  });

  it('should try to call uploadImage with a timeout of 0 when enqueueing a task', async () => {
    const {uploader, processTaskQueueSpy, processTaskQueueInvocations} = await createUploader();
    uploadImage.mockReturnValue(Promise.resolve(successfulUploadImageResponse));

    await uploader.enqueueTasks([imageUploadTask()]);

    expect(processTaskQueueSpy).toHaveBeenCalledTimes(0);
    jest.advanceTimersByTime(0);
    await processTaskQueueInvocations[0].promise;
    expect(processTaskQueueSpy).toHaveBeenCalledTimes(1);
    expect(uploadImage).toHaveBeenCalledTimes(1);
  });

  it('should delay by the exponential backoff controlled by attemptCount', async () => {
    const {uploader, processTaskQueueInvocations} = await createUploader();
    uploadImage.mockReturnValue(Promise.resolve(successfulUploadImageResponse));

    await uploader.enqueueTasks([
      {
        ...imageUploadTask(),
        attemptCount: 3,
      },
    ]);
    // We don't expect uploadImage to be called until 8000ms have passed
    jest.advanceTimersByTime(7999);
    expect(uploadImage).toHaveBeenCalledTimes(0);
    expect(processTaskQueueInvocations).toHaveLength(0);

    jest.advanceTimersByTime(1);
    expect(processTaskQueueInvocations).toHaveLength(1);
    await processTaskQueueInvocations[0].promise;
    expect(uploadImage).toHaveBeenCalledTimes(1);
  });

  it('should retry on retryable errors', async () => {
    const {uploader, processTaskQueueSpy, processTaskQueueInvocations} = await createUploader();
    uploadImage.mockRejectedValueOnce(createAxiosError(500)).mockResolvedValueOnce(successfulUploadImageResponse);

    await uploader.enqueueTasks([imageUploadTask()]);

    // Advance the timer to run the first invocation of processTaskQueue
    jest.advanceTimersByTime(0);
    jest.runAllTicks();
    expect(processTaskQueueInvocations).toHaveLength(1);
    await processTaskQueueInvocations[0].promise;

    expect(processTaskQueueSpy).toHaveBeenCalledTimes(1);
    expect(uploadImage).toHaveBeenCalledTimes(1);

    // Since the first call failed, it'll retry after the backoff time
    jest.advanceTimersByTime(backoffTimeMs(1));
    expect(processTaskQueueInvocations).toHaveLength(2);
    await processTaskQueueInvocations[1].promise;

    // Since the second call succeeded, it won't retry again
    expect(processTaskQueueSpy).toHaveBeenCalledTimes(2);
    expect(uploadImage).toHaveBeenCalledTimes(2);
  });

  it('should give up on fatal errors', async () => {
    const {uploader, processTaskQueueSpy, processTaskQueueInvocations} = await createUploader();
    uploadImage.mockRejectedValueOnce(new Error('oops')).mockResolvedValueOnce(successfulUploadImageResponse);

    await uploader.enqueueTasks([imageUploadTask()]);

    // Advance the timer to run the first invocation of processTaskQueue
    jest.advanceTimersByTime(0);
    jest.runAllTicks();
    expect(processTaskQueueInvocations).toHaveLength(1);
    await processTaskQueueInvocations[0].promise;

    expect(processTaskQueueSpy).toHaveBeenCalledTimes(1);
    expect(uploadImage).toHaveBeenCalledTimes(1);

    // Since this is a fatal error, it won't retry
    expect(uploader['taskQueue']).toHaveLength(0);
  });
});

const successfulUploadImageResponse: MediaItem = {
  id: 'de2218f6-63ba-11ee-9b3b-9fdd388ae1ef',
  url: {
    original: 'https://avalanche-org-media.s3.us-west-2.amazonaws.com/49DCBED7-2B97-4502-AB97-87D9C0C9FDA6_651f1796edad5.jpg',
    large: 'https://avalanche-org-media.s3.us-west-2.amazonaws.com/49DCBED7-2B97-4502-AB97-87D9C0C9FDA6_651f1796edad5-large.jpg',
    medium: 'https://avalanche-org-media.s3.us-west-2.amazonaws.com/49DCBED7-2B97-4502-AB97-87D9C0C9FDA6_651f1796edad5-medium.jpg',
    thumbnail: 'https://avalanche-org-media.s3.us-west-2.amazonaws.com/49DCBED7-2B97-4502-AB97-87D9C0C9FDA6_651f1796edad5-thumbnail.jpg',
  },
  type: MediaType.Image,
  title: null,
  caption: null,
};

const imageUploadTask = (): TaskQueueEntry => ({
  id: '2d58dbbc-03a4-40a8-bfa8-a61448ccb6c6',
  parentId: 'fbf53196-2af3-45fe-be3a-f2be5e6368e0',
  attemptCount: 0,
  type: 'image',
  data: {
    apiPrefix: 'https://localhost:3000',
    image: {
      uri: 'file:///test.jpg',
      width: 640,
      height: 480,
      exif: {Orientation: 1},
    },
    name: `created ${new Date().toLocaleTimeString()}`,
    center_id: 'NWAC',
    photoUsage: MediaUsage.Credit,
  },
});
