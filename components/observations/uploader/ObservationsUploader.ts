import AsyncStorage from '@react-native-async-storage/async-storage';
import {AxiosError} from 'axios';

import {TaskQueueEntry, taskQueueSchema} from 'components/observations/uploader/Task';
import {uploadImage} from 'components/observations/uploader/uploadImage';
import {uploadObservation} from 'components/observations/uploader/uploadObservation';
import {logger} from 'logger';

//
// ObservationsUploader maintains a persistent queue in AsyncStorage of upload tasks to be performed.
//
// TODO
// - exponential backoff
// - detect online/offline errors and respond appropriately

type Subscriber = (entry: TaskQueueEntry, success: boolean, attempts: number) => void;

export const isRetryableError = (error: unknown): boolean => {
  if (error instanceof AxiosError) {
    if (error.response) {
      const status = error.response.status;
      return (
        status >= 500 || // server error
        status === 408 || // request timeout, probably returned by LB
        status === 425 || // too early
        status === 429 // too many requests - rate limited
      );
    } else {
      // Network error, the server never responded
      return true;
    }
  }
  return false;
};

export const backoffTimeMs = (attemptCount: number): number => {
  return attemptCount === 0 ? 0 : Math.min(1000 * 2 ** attemptCount, 30000);
};

export class ObservationUploader {
  private static TASK_QUEUE_KEY = 'OBSERVATION_UPLOAD_TASK_QUEUE';
  private static PROCESS_INTERVAL_MS = 1000;

  private pendingTaskQueueUpdate: null | NodeJS.Timeout = null;
  private taskQueue: TaskQueueEntry[] = [];
  private ready = false;
  private logger = logger.child({component: 'ObservationUploader'});
  private subscribers: Subscriber[] = [];

  async initialize() {
    this.taskQueue = taskQueueSchema.parse(JSON.parse((await AsyncStorage.getItem(ObservationUploader.TASK_QUEUE_KEY)) || '[]'));
    this.ready = true;
    this.tryRunTaskQueue();
  }

  private checkInitialized() {
    if (!this.ready) {
      this.logger.error('ObservationUploader not initialized');
      throw new Error('ObservationUploader not initialized');
    }
  }

  private async flush() {
    this.checkInitialized();
    this.logger.debug({queue: this.taskQueue}, 'flushing new task queue to disk');
    await AsyncStorage.setItem(ObservationUploader.TASK_QUEUE_KEY, JSON.stringify(this.taskQueue));
  }

  private tryRunTaskQueue() {
    this.logger.debug({queueLength: this.taskQueue.length, pendingTaskQueueUpdate: this.pendingTaskQueueUpdate != null}, 'tryRunTaskQueue');
    if (this.taskQueue.length === 0 || this.pendingTaskQueueUpdate) {
      return;
    }
    const headEntry = this.taskQueue[0];
    this.pendingTaskQueueUpdate = setTimeout(() => void this.processTaskQueue(), backoffTimeMs(headEntry.attemptCount));
    this.logger.debug({backoffTimeMs: backoffTimeMs(headEntry.attemptCount), pendingTaskQueueUpdate: this.pendingTaskQueueUpdate != null}, 'tryRunTaskQueue complete');
  }

  async enqueueTasks(entries: TaskQueueEntry[]) {
    this.logger.debug({entries}, 'enqueueTasks');
    this.taskQueue.push(...entries);
    await this.flush();
    this.tryRunTaskQueue();
  }

  private async processTaskQueue() {
    this.pendingTaskQueueUpdate = null;
    this.logger.debug({queue: this.taskQueue}, 'processTaskQueue');
    if (!this.taskQueue.length) {
      return;
    }
    const entry = this.taskQueue[0];
    entry.attemptCount++;
    try {
      switch (entry.type) {
        case 'image':
          {
            // We upload the image, and if successful we upload the parent observation task to include it
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
    } catch (error) {
      this.logger.error({error, entry, retryable: isRetryableError(error)}, `error processing task queue entry`);
      if (!isRetryableError(error)) {
        // Since this can't be retried, remove it from the queue
        this.taskQueue.shift();
      }
      this.subscribers.forEach(subscriber => subscriber(entry, false, entry.attemptCount));
    }

    this.logger.debug({taskCount: this.taskQueue.length}, 'processTaskQueue end');
    await this.flush();
    this.tryRunTaskQueue();
  }

  async resetTaskQueue() {
    this.logger.debug('resetTaskQueue');
    this.checkInitialized();
    this.taskQueue = [];
    await this.flush();
  }

  subscribeToTaskInvocations(callback: Subscriber) {
    this.subscribers.push(callback);
  }

  unsubscribeFromTaskInvocations(callback: Subscriber) {
    this.subscribers = this.subscribers.filter(subscriber => subscriber !== callback);
  }
}
