import {z} from 'zod';

import {simpleObservationFormSchema} from 'components/observations/ObservationFormData';
import {avalancheCenterIDSchema, mediaItemSchema, MediaUsage} from 'types/nationalAvalancheCenter';

const taskStatus = z.enum(['pending', 'paused', 'working', 'success', 'error']);
export type TaskStatus = z.infer<typeof taskStatus>;

const taskQueueEntrySchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('image'),
    id: z.string().uuid(),
    parentId: z.string().uuid(),
    attemptCount: z.number(),
    status: taskStatus.default('pending'),
    data: z.object({
      apiPrefix: z.string(),
      image: z.object({
        uri: z.string(),
        width: z.number(),
        height: z.number(),
        exif: z
          .object({
            Orientation: z.number().or(z.string()).optional(),
            DateTimeOriginal: z.string().optional(),
          })
          .optional(),
      }),
      name: z.string(),
      title: z.string(),
      caption: z.string().optional(),
      center_id: avalancheCenterIDSchema,
      photoUsage: z.nativeEnum(MediaUsage),
    }),
  }),
  z.object({
    type: z.literal('observation'),
    id: z.string().uuid(),
    parentId: z.string().uuid().optional(),
    attemptCount: z.number(),
    status: taskStatus.default('pending'),
    data: z.object({
      formData: simpleObservationFormSchema,
      extraData: z.object({
        url: z.string().url(),
        center_id: avalancheCenterIDSchema,
        organization: avalancheCenterIDSchema.optional(),
        observer_type: z.literal('public'),
        media: z.array(mediaItemSchema),
      }),
    }),
  }),
]);
export type TaskQueueEntry = z.infer<typeof taskQueueEntrySchema>;

export type ObservationTask = Extract<TaskQueueEntry, {type: 'observation'}>;
export type ObservationTaskData = ObservationTask['data'];
export const isObservationTask = (entry: TaskQueueEntry): entry is ObservationTask => entry.type === 'observation';

export type ImageTask = Extract<TaskQueueEntry, {type: 'image'}>;
export type ImageTaskData = ImageTask['data'];
export const isImageTask = (entry: TaskQueueEntry): entry is ImageTask => entry.type === 'image';

export const taskQueueSchema = z.array(taskQueueEntrySchema);
