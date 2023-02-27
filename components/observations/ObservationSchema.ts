import {merge} from 'lodash';
import {Activity, InstabilityDistribution, Observation, PartnerType} from 'types/nationalAvalancheCenter';
import {z} from 'zod';

export const createObservation = (initialValues: Partial<Observation> | null = null): ObservationFormData =>
  merge(
    {
      activity: [],
      center_id: 'NWAC',
      instability: {
        avalanches_observed: false,
        avalanches_triggered: false,
        avalanches_caught: false,
        cracking: false,
        collapsing: false,
      },
      media: [],
      observer_type: PartnerType.Public,
      photoUsage: 'anonymous',
      private: false,
      start_date: new Date(),
      status: 'published',
    },
    initialValues,
  );
const required = 'This field is required.';
const tooShort = 'This value is too short.';
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
    location_name: z.string({required_error: required}).min(8, tooShort).max(256, tooLong),
    location_point: z.object(
      {
        lat: z.number(),
        lng: z.number(),
      },
      {required_error: required},
    ),
    name: z.string({required_error: required}).min(2, tooShort).max(50, tooLong),
    observation_summary: z.string({required_error: required}).min(8, tooShort).max(1024, tooLong),
    private: z.boolean(),
    start_date: z.date({required_error: required}),
  })
  .superRefine((arg, ctx) => {
    // Some more complex validations to apply here

    // if instability.avalanches_observed, then we'll want avalanches_summary to exist
    if (arg.instability?.avalanches_observed) {
      const {avalanches_summary} = arg;
      if (!avalanches_summary) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: required,
          path: ['avalanches_summary'],
        });
      } else if (avalanches_summary.length < 8) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: tooShort,
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
  uploadPaths: string[];
}
