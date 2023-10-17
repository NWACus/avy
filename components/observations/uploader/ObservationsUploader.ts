import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo, {NetInfoState} from '@react-native-community/netinfo';
import {AxiosError} from 'axios';
import _ from 'lodash';
import uuid from 'react-native-uuid';

import {ObservationFormData} from 'components/observations/ObservationFormData';
import {ImageTaskData, ObservationTaskData, TaskQueueEntry, TaskStatus, isImageTask, isObservationTask, taskQueueSchema} from 'components/observations/uploader/Task';
import {uploadImage} from 'components/observations/uploader/uploadImage';
import {uploadObservation} from 'components/observations/uploader/uploadObservation';
import {logger} from 'logger';
import {filterLoggedData} from 'logging/filterLoggedData';
import {AvalancheCenterID, MediaUsage} from 'types/nationalAvalancheCenter';

type Subscriber = (entry: TaskQueueEntry, success: boolean, attempts: number) => void;

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

interface UploaderState {
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
  private subscribers: Subscriber[] = [];

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

      // uuid.v4 has a goofy implementation that only returns a byte array if you pass a byte array in,
      // but returns string otherwise. hence the use of `as string`.
      const observationTaskId = uuid.v4() as string;

      observationFormData.images?.forEach(image => {
        tasks.push({
          id: uuid.v4() as string,
          parentId: observationTaskId,
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
            organization: center_id,
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
              parentTask.data.extraData.media.push(mediaItem);
              // this change will be flushed in the `finally` block below
            }
          }
          break;
        case 'observation':
          await uploadObservation(entry.id, entry.data);
          break;
      }
      this.logger.debug({entry}, `processed task queue entry successfully`);
      this.subscribers.forEach(subscriber => subscriber(entry, true, entry.attemptCount));
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
      this.subscribers.forEach(subscriber => subscriber(entry, false, entry.attemptCount));
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

  getUploadStatus(observationId: string): UploadStatus {
    const task = this.findTaskById(observationId);
    if (!task) {
      throw new Error(`No task found with id ${observationId}`);
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

  async resetTaskQueue() {
    this.logger.debug('resetTaskQueue');
    this.checkInitialized();
    this.taskQueue = [];
    await this.flush();
  }

  subscribeToTaskInvocations(callback: Subscriber) {
    this.checkInitialized();
    this.subscribers.push(callback);
  }

  unsubscribeFromTaskInvocations(callback: Subscriber) {
    this.checkInitialized();
    this.subscribers = this.subscribers.filter(subscriber => subscriber !== callback);
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
