import _ from 'lodash';
import uuid from 'react-native-uuid';

import {ObservationFormData} from 'components/observations/ObservationFormData';
import {ObservationUploader} from 'components/observations/uploader/ObservationsUploader';
import {TaskQueueEntry} from 'components/observations/uploader/Task';
import {logger} from 'logger';
import {AvalancheCenterID, MediaUsage} from 'types/nationalAvalancheCenter';

const uploader = new ObservationUploader();
void uploader.initialize();

export const submitObservation = async ({
  apiPrefix,
  center_id,
  observationFormData,
}: {
  apiPrefix: string;
  center_id: AvalancheCenterID;
  observationFormData: ObservationFormData;
}): Promise<void> => {
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

    const url = `${apiPrefix}/obs/v1/public/observation/`;
    tasks.push({
      id: observationTaskId,
      type: 'observation',
      parentId: undefined,
      attemptCount: 0,
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

    const promise: Promise<void> = new Promise((resolve, _reject) => {
      const listener = (entry: TaskQueueEntry, success: boolean) => {
        if (entry.type === 'observation' && entry.id === observationTaskId) {
          if (success) {
            resolve();
            uploader.unsubscribeFromTaskInvocations(listener);
          }
        }
      };
      uploader.subscribeToTaskInvocations(listener);
    });

    await uploader.enqueueTasks(tasks);

    return promise;
  } catch (e) {
    logger.error({e}, 'error submitting observation');
    throw e;
  }
};
