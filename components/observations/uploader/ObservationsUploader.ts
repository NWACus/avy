import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo, {NetInfoState} from '@react-native-community/netinfo';
import {AxiosError} from 'axios';
import _ from 'lodash';
import uuid from 'react-native-uuid';

import {ImagePickerAssetSchema, ObservationFormData} from 'components/observations/ObservationFormData';
import {
  ImageTaskData,
  ObservationTask,
  ObservationTaskData,
  TaskQueueEntry,
  TaskStatus,
  isImageTask,
  isObservationTask,
  taskQueueSchema,
} from 'components/observations/uploader/Task';
import {uploadImage} from 'components/observations/uploader/uploadImage';
import {uploadObservation} from 'components/observations/uploader/uploadObservation';
import {format} from 'date-fns';
import {logger} from 'logger';
import {filterLoggedData} from 'logging/filterLoggedData';
import {AvalancheCenterID, MediaType, MediaUsage, ObservationFragment, PartnerType} from 'types/nationalAvalancheCenter';

type StateSubscriber = (state: UploaderState) => void;
export interface ObservationFragmentWithStatus {
  status: UploadStatus;
  observation: ObservationFragment;
}

export const isRetryableError = (error: unknown): boolean => {
  // This may evolve over time as we learn more about what errors the NAC API can
  // return and what errors are transient vs permanent, but it's a reasonable starting point.
  if (error instanceof AxiosError) {
    if (error.code === 'ERR_NETWORK') {
      return true;
    } else if (error.response) {
      const status = error.response.status;
      return (
        status >= 500 || // server error
        status === 408 || // request timeout, probably returned by LB
        status === 425 || // too early
        status === 429 // too many requests - rate limited
      );
    } else {
      // Network error or timeout. Implies that the server never responded
      return true;
    }
  }
  return false;
};

export const backoffTimeMs = (attemptCount: number): number => {
  return attemptCount === 0 ? 0 : Math.min(1000 * 2 ** attemptCount, 30000);
};

export interface UploaderState {
  networkStatus: 'online' | 'offline';
  observations: {
    id: string;
    status: TaskStatus;
    data: ObservationTaskData;
    attemptCount: number;
    images: {
      id: string;
      status: TaskStatus;
      attemptCount: number;
      data: ImageTaskData;
    }[];
  }[];
}

interface UploadStatus {
  networkStatus: 'online' | 'offline';
  observation: {
    status: TaskStatus;
    attemptCount: number;
  };
  images: {
    status: TaskStatus;
    attemptCount: number;
  }[];
}

// The ObservationUploader manages a persistent queue of upload tasks (images and observations) to be performed.
// It is responsible for:
// - persisting the queue to disk
// - running the queue
// - retrying failed tasks
// - notifying subscribers of task completion
//
// It delegates out to the uploadImage and uploadObservation functions to actually perform the uploads.
//
// TODO
// - build out a status API
export class ObservationUploader {
  private static TASK_QUEUE_KEY = 'OBSERVATION_UPLOAD_TASK_QUEUE';

  private pendingTaskQueueUpdate: null | NodeJS.Timeout = null;
  private taskQueue: TaskQueueEntry[] = [];
  private completedTasks: TaskQueueEntry[] = [];
  private ready = false;
  private offline = true;
  private logger = logger.child({component: 'ObservationUploader'});
  private stateSubscribers: StateSubscriber[] = [];

  async initialize() {
    try {
      this.taskQueue = taskQueueSchema.parse(JSON.parse((await AsyncStorage.getItem(ObservationUploader.TASK_QUEUE_KEY)) || '[]'));
    } catch (error) {
      this.logger.warn({error}, `failed to parse task queue from disk, resetting to empty`);
      this.taskQueue = [];
    }
    this.ready = true;
    this.handleNetInfoStateChange(await NetInfo.fetch());
    NetInfo.addEventListener((state: NetInfoState) => this.handleNetInfoStateChange(state));
    this.tryRunTaskQueue();
  }

  private checkInitialized() {
    if (!this.ready) {
      this.logger.error('ObservationUploader not initialized');
      throw new Error('ObservationUploader not initialized');
    }
  }

  private handleNetInfoStateChange(state: NetInfoState) {
    this.offline = !(state.isConnected && !!state.isInternetReachable);
    this.logger.info({state}, 'NetInfo state updated', this.offline ? 'offline' : 'online');
    if (!this.offline) {
      this.tryRunTaskQueue();
    }
  }

  private async flush() {
    this.checkInitialized();
    this.logger.debug({queue: this.taskQueue}, 'flushing new task queue to disk');
    const state = this.getState();
    this.stateSubscribers.forEach(subscriber => subscriber(state));
    await AsyncStorage.setItem(ObservationUploader.TASK_QUEUE_KEY, JSON.stringify(this.taskQueue));
  }

  private tryRunTaskQueue() {
    this.checkInitialized();
    this.logger.debug({offline: this.offline, queueLength: this.taskQueue.length, pendingTaskQueueUpdate: this.pendingTaskQueueUpdate != null}, 'tryRunTaskQueue');
    if (this.offline || this.taskQueue.length === 0 || this.pendingTaskQueueUpdate) {
      return;
    }
    const headEntry = this.taskQueue[0];
    this.pendingTaskQueueUpdate = setTimeout(() => void this.processTaskQueue(), backoffTimeMs(headEntry.attemptCount));
    this.logger.debug({backoffTimeMs: backoffTimeMs(headEntry.attemptCount), pendingTaskQueueUpdate: this.pendingTaskQueueUpdate != null}, 'tryRunTaskQueue complete');
  }

  private async enqueueTasks(entries: TaskQueueEntry[]) {
    this.checkInitialized();
    this.logger.debug({entries}, 'enqueueTasks');
    this.taskQueue.push(...entries);
    await this.flush();
    this.tryRunTaskQueue();
  }

  async submitObservation({apiPrefix, center_id, observationFormData}: {apiPrefix: string; center_id: AvalancheCenterID; observationFormData: ObservationFormData}) {
    this.checkInitialized();
    try {
      const {photoUsage, name} = observationFormData;

      const tasks: TaskQueueEntry[] = [];

      const observationTaskId = uuid.v4();

      observationFormData.images?.forEach(({image, caption}) => {
        this.addImageTask(tasks, image, caption, apiPrefix, center_id, observationFormData.location_name, observationTaskId, photoUsage, name);
      });

      observationFormData.avalanches.forEach((avalanche, index) => {
        avalanche.images?.forEach(({image, caption}) => {
          this.addImageTask(tasks, image, caption, apiPrefix, center_id, avalanche.location, observationTaskId, photoUsage, name, index);
        });
      });

      // Remove images from the observation form data since they're handled in separate tasks
      observationFormData.avalanches.forEach((avalanche, _) => {
        delete avalanche.images;
      });

      const url = `${apiPrefix}/obs/v1/public/observation/`;
      tasks.push({
        id: observationTaskId,
        type: 'observation',
        parentId: undefined,
        attemptCount: 0,
        status: 'pending',
        data: {
          // We don't persist images with the observation task, since they're already
          // encoded in individual image upload tasks
          formData: _.omit(observationFormData, 'images'),
          extraData: {
            url,
            center_id,
            observer_type: 'public',
            media: [],
          },
        },
      });

      await this.enqueueTasks(tasks);

      return observationTaskId;
    } catch (error) {
      this.logger.error({error}, 'error submitting observation');
      throw error;
    }
  }

  private addImageTask = (
    tasks: TaskQueueEntry[],
    image: ImagePickerAssetSchema,
    caption: string | undefined,
    apiPrefix: string,
    center_id: AvalancheCenterID,
    locationName: string,
    observationTaskId: string,
    photoUsage: MediaUsage,
    name: string,
    avalancheIndex?: number,
  ) => {
    tasks.push({
      id: uuid.v4(),
      parentId: observationTaskId,
      avalancheId: avalancheIndex,
      attemptCount: 0,
      type: 'image',
      status: 'pending',
      data: {
        apiPrefix: apiPrefix,
        image: {
          uri: image.uri,
          width: image.width,
          height: image.height,
          exif: image.exif
            ? {
                Orientation: typeof image.exif.Orientation === 'string' || typeof image.exif.Orientation === 'number' ? image.exif.Orientation : undefined,
                DateTimeOriginal: typeof image.exif.DateTimeOriginal === 'string' ? image.exif.DateTimeOriginal : undefined,
              }
            : undefined,
        },
        caption,
        name: name ?? '',
        title: `Public Observation: ${locationName}`,
        center_id: center_id,
        photoUsage: photoUsage ?? MediaUsage.Credit,
      },
    });
  };

  private async processTaskQueue() {
    this.pendingTaskQueueUpdate = null;
    this.logger.debug({queue: this.taskQueue}, 'processTaskQueue');

    const entry = this.taskQueue.find(t => t.status === 'pending');
    if (!entry) {
      return;
    }
    entry.attemptCount++;
    entry.status = 'working';
    try {
      switch (entry.type) {
        case 'image':
          {
            // We upload the image, and if successful we update the parent observation task to include it
            const mediaItem = await uploadImage(entry.id, entry.data);
            const parentTask = this.taskQueue.find(task => task.id === entry.parentId);
            if (!parentTask || parentTask.type !== 'observation') {
              this.logger.warn({entry, parentTask, queue: this.taskQueue}, `Unexpected: image task has no parent observation task`);
            } else {
              if (entry.avalancheId != null && parentTask.data.formData.avalanches.length > entry.avalancheId) {
                parentTask.data.formData.avalanches[entry.avalancheId].media.push(mediaItem);
              } else {
                parentTask.data.extraData.media.push(mediaItem);
              }
              // this change will be flushed in the `finally` block below
            }
          }
          break;
        case 'observation':
          await uploadObservation(entry.id, entry.data);
          break;
      }
      this.logger.debug({entry}, `processed task queue entry successfully`);
      this.taskQueue.shift(); // we're done with this task, so remove it from the queue
      entry.status = 'success';
      this.completedTasks.push(entry);
    } catch (error) {
      if (isRetryableError(error)) {
        this.logger.warn({error: filterLoggedData(error), entry, retryable: isRetryableError(error)}, `transient error processing task queue entry. it will be retried.`);
        entry.status = 'pending';
      } else {
        this.logger.error({error: filterLoggedData(error), entry, retryable: isRetryableError(error)}, `fatal error processing task queue entry. it will not be retried.`);
        // Since this can't be retried, remove it from the queue
        this.taskQueue.shift();
        entry.status = 'error';
        this.completedTasks.push(entry);
      }
    }

    this.logger.debug({taskCount: this.taskQueue.length}, 'processTaskQueue end');
    await this.flush();
    this.tryRunTaskQueue();
  }

  private findTaskById(taskId: string) {
    return this.completedTasks.find(t => t.id === taskId) || this.taskQueue.find(t => t.id === taskId);
  }

  private findTasksByParentId(taskId: string) {
    return [...this.completedTasks.filter(t => t.parentId === taskId), ...this.taskQueue.filter(t => t.parentId === taskId)];
  }

  private setTaskStatus(taskId: string, status: TaskStatus, updateChildren = true) {
    const task = this.findTaskById(taskId);

    if (!task) {
      this.logger.warn({taskId, status}, 'Unable to update task status - task not found');
      return false;
    } else if (task.status === 'working') {
      this.logger.warn({taskId, status}, 'Unable to update task status - task is in progress');
      return false;
    } else if (task.status === 'error' || task.status === 'success') {
      this.logger.warn({taskId, status}, 'Unable to update task status - task has finished');
      return false;
    }

    task.status = status;

    if (updateChildren) {
      this.findTasksByParentId(taskId).map(t => this.setTaskStatus(t.id, status, updateChildren));
    }

    return true;
  }

  pauseUpload(observationId: string, pauseImages = true) {
    this.setTaskStatus(observationId, 'paused', pauseImages);
    this.tryRunTaskQueue();
  }

  resumeUpload(observationId: string, resumeImages = true) {
    this.setTaskStatus(observationId, 'pending', resumeImages);
    this.tryRunTaskQueue();
  }

  private getObservationFragment(observationTask: ObservationTask): ObservationFragment {
    const observation = observationTask.data.formData;
    return {
      id: observationTask.id,
      observerType: PartnerType.Public,
      name: observation.name,
      startDate: format(observation.start_date, 'yyyy-MM-dd'),
      locationPoint: observation.location_point,
      locationName: observation.location_name,
      instability: observation.instability,
      observationSummary: observation.observation_summary,
      media: this.taskQueue
        .filter(t => t.parentId === observationTask.id)
        .filter(isImageTask)
        .map(t => ({
          type: MediaType.Image,
          caption: null,
          url: {
            original: t.data.image.uri,
            large: t.data.image.uri,
            medium: t.data.image.uri,
            thumbnail: t.data.image.uri,
          },
        })),
    };
  }

  getUploadStatus(observationId: string): UploadStatus | null {
    const task = this.findTaskById(observationId);
    if (!task) {
      this.logger.warn(`getUploadStatus: No task found with id ${observationId}`);
      return null;
    }
    return {
      networkStatus: this.offline ? 'offline' : 'online',
      observation: {
        status: task.status,
        attemptCount: task.attemptCount,
      },
      images: this.findTasksByParentId(observationId).map(t => ({
        status: t.status,
        attemptCount: t.attemptCount,
      })),
    };
  }

  getPendingObservations(): ObservationFragmentWithStatus[] {
    return this.taskQueue
      .filter(isObservationTask)
      .map(observationTask => ({
        status: this.getUploadStatus(observationTask.id),
        observation: this.getObservationFragment(observationTask),
      }))
      .filter((result): result is ObservationFragmentWithStatus => result.status != null);
  }

  async resetTaskQueue() {
    this.logger.debug('resetTaskQueue');
    this.checkInitialized();
    this.taskQueue = [];
    await this.flush();
  }

  subscribeToStateUpdates(callback: StateSubscriber) {
    this.checkInitialized();
    this.stateSubscribers.push(callback);
  }

  unsubscribeFromStateUpdates(callback: StateSubscriber) {
    this.checkInitialized();
    this.stateSubscribers = this.stateSubscribers.filter(subscriber => subscriber !== callback);
  }

  getState(): UploaderState {
    // The `map` call is because tsc needs a little help to grok the type of the filter expression
    const observationTasks = this.taskQueue.filter(isObservationTask);
    const imageTasks = this.taskQueue.filter(isImageTask);

    const observations: UploaderState['observations'] = observationTasks.map(obsTask => ({
      ...obsTask,
      images: imageTasks.filter(imageTask => imageTask.parentId === obsTask.id),
    }));
    const stats: UploaderState = {
      networkStatus: this.offline ? 'offline' : 'online',
      observations,
    };
    return stats;
  }
}

const uploader: ObservationUploader = new ObservationUploader();
void uploader.initialize();
export const getUploader = () => {
  return uploader;
};
