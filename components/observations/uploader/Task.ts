import {z} from 'zod';

import {simpleObservationFormSchema} from 'components/observations/ObservationFormData';
import {avalancheCenterIDSchema, mediaItemSchema, MediaUsage} from 'types/nationalAvalancheCenter';

const taskQueueEntrySchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('image'),
    id: z.string().uuid(),
    parentId: z.string().uuid(),
    attemptCount: z.number(),
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
    type: z.literal('observation'),
    id: z.string().uuid(),
    parentId: z.string().uuid().optional(),
    attemptCount: z.number(),
    data: z.object({
      formData: simpleObservationFormSchema,
      extraData: z.object({
        url: z.string().url(),
        center_id: avalancheCenterIDSchema,
        organization: avalancheCenterIDSchema,
        observer_type: z.literal('public'),
        media: z.array(mediaItemSchema),
      }),
    }),
  }),
]);
export type TaskQueueEntry = z.infer<typeof taskQueueEntrySchema>;
export type ObservationTaskData = Extract<TaskQueueEntry, {type: 'observation'}>['data'];

export const taskQueueSchema = z.array(taskQueueEntrySchema);
