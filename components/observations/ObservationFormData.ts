import {ImagePickerAsset} from 'expo-image-picker';
import {merge} from 'lodash';
import {z} from 'zod';

import {Activity, InstabilityDistribution, MediaUsage, Observation, PartnerType} from 'types/nationalAvalancheCenter';

export const defaultObservationFormData = (initialValues: Partial<Observation> | null = null): ObservationFormData =>
  merge(
    {
      activity: [],
      instability: {
        avalanches_observed: false,
        avalanches_triggered: false,
        avalanches_caught: false,
        cracking: false,
        collapsing: false,
      },
      media: [],
      observer_type: PartnerType.Public,
      photoUsage: MediaUsage.Credit,
      private: false,
      start_date: new Date(),
      status: 'published',
    },
    initialValues,
  );
const required = 'This field is required.';
const tooLong = 'This value is too long.';

// For the form, we have specific rules that we require for any new observations
// we create, thus we don't reuse the existing observationSchema
export const simpleObservationFormSchema = z
  .object({
    activity: z.array(z.nativeEnum(Activity)).min(1, 'You must select at least one activity.'),
    avalanches_summary: z.string().optional(),
    email: z.string({required_error: required}).email("That doesn't look like an email address."),
    instability: z.object({
      avalanches_observed: z.boolean(),
      avalanches_triggered: z.boolean(),
      avalanches_caught: z.boolean(),
      cracking: z.boolean(),
      cracking_description: z.nativeEnum(InstabilityDistribution).optional(),
      collapsing: z.boolean(),
      collapsing_description: z.nativeEnum(InstabilityDistribution).optional(),
    }),
    location_name: z.string({required_error: required}).max(256, tooLong),
    location_point: z.object(
      {
        lat: z.number(),
        lng: z.number(),
      },
      {required_error: required},
    ),
    name: z.string({required_error: required}).max(50, tooLong),
    observation_summary: z.string({required_error: required}).max(1024, tooLong),
    photoUsage: z.nativeEnum(MediaUsage, {required_error: required}),
    private: z.boolean(),
    start_date: z.date({required_error: required}),
  })
  .superRefine((arg, ctx) => {
    // Some more complex validations to apply here

    // if instability.avalanches_observed, then we'll want avalanches_summary to exist
    if (arg.instability?.avalanches_observed) {
      const {avalanches_summary} = arg;
      if (!avalanches_summary || avalanches_summary.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: required,
          path: ['avalanches_summary'],
        });
      } else if (avalanches_summary.length > 1024) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: tooLong,
          path: ['avalanches_summary'],
        });
      }
    }

    // if instability.cracking, then we'll want cracking_description to be set
    // cracking_description is an enum, so no max length validation is required -
    // it just needs to be set
    if (arg.instability?.cracking) {
      const {cracking_description} = arg.instability;
      if (!cracking_description || cracking_description.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: required,
          path: ['instability', 'cracking_description'],
        });
      }
    }

    // if instability.collapsing, then we'll want collapsing_description to be set
    // collapsing_description is an enum, so no max length validation is required -
    // it just needs to be set
    if (arg.instability?.collapsing) {
      const {collapsing_description} = arg.instability;
      if (!collapsing_description || collapsing_description.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: required,
          path: ['instability', 'collapsing_description'],
        });
      }
    }

    return z.NEVER;
  });

export interface ObservationFormData extends z.infer<typeof simpleObservationFormSchema> {
  images: ImagePickerAsset[];
}
