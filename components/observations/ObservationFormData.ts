import {ImagePickerAsset} from 'expo-image-picker';
import {merge} from 'lodash';
import {z} from 'zod';

import {Activity, InstabilityDistribution, MediaUsage, PartnerType} from 'types/nationalAvalancheCenter';

const FAKE_OBSERVATION_DATA: Partial<ObservationFormData> = {
  activity: ['skiing_snowboarding'],
  location_point: {
    lat: 47.6062,
    lng: -122.3321,
  },
  email: 'developer@nwac.us',
  name: 'NWAC Developer',
  phone: `(012) 345 - 6789`,
  observation_summary: '[TEST] This is a test observation.',
  location_name: '[TEST] Snoqualmie Pass',
};

export const defaultObservationFormData = (initialValues: Partial<ObservationFormData> | null = null): Partial<ObservationFormData> =>
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
      observer_type: PartnerType.Public,
      photoUsage: MediaUsage.Credit,
      private: false,
      start_date: new Date(),
      status: 'draft',
      images: [],
      show_name: false,
    },
    process.env.EXPO_PUBLIC_AUTOFILL_FAKE_OBSERVATION ? FAKE_OBSERVATION_DATA : {},
    initialValues,
  );
const required = 'This field is required.';
const tooLong = 'This value is too long.';

const locationPointSchema = z.object(
  {
    lat: z.number(),
    lng: z.number(),
  },
  {required_error: required},
);
export type LocationPoint = z.infer<typeof locationPointSchema>;

// This matches the type for ImagePicker.ImagePickerAsset
// it adds the expected exif key/value pairs used by image upload
const imageAssetSchema = z
  .object({
    uri: z.string(),
    assetId: z.string().nullable(),
    width: z.number(),
    height: z.number(),
    type: z.union([z.literal('image'), z.literal('video'), z.literal('livePhoto'), z.literal('pairedVideo')]),
    fileName: z.string().nullable(),
    fileSize: z.number(),
    exif: z
      .intersection(
        z
          .object({
            // this is how it's defined in expo-image-picker
            Orientation: z.union([z.string(), z.number()]),
            DateTimeOriginal: z.string(),
          })
          .partial(),
        z.record(z.string(), z.any()),
      )
      .nullable(),
    base64: z.string().nullable(),
    duration: z.number().nullable(),
    mimeType: z.string(),
  })
  .partial({
    assetId: true,
    type: true,
    fileName: true,
    fileSize: true,
    exif: true,
    base64: true,
    duration: true,
    mimeType: true,
  });

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
    location_point: locationPointSchema,
    name: z.string({required_error: required}).max(50, tooLong),
    status: z.enum(['draft', 'published']),
    phone: z
      .string()
      .regex(/\(\d{3}\) \d{3} - \d{4}/, "That doesn't look like a phone number.")
      .optional(),
    show_name: z.boolean().optional(),
    observer_type: z.literal(PartnerType.Public),
    observation_summary: z.string({required_error: required}).max(1024, tooLong),
    photoUsage: z.nativeEnum(MediaUsage, {required_error: required}),
    private: z.boolean(),
    // Using `coerce` allows us to transparently round-trip a Date object to JSON and back
    start_date: z.coerce.date({required_error: required}),
    images: z.array(
      z
        .object({
          image: imageAssetSchema,
          caption: z.string(),
        })
        .partial({
          caption: true,
        }),
    ),
  })
  .partial({images: true})
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

export interface ImageAndCaption {
  image: ImagePickerAsset;
  caption?: string;
}

export interface ImagePickerAssetSchema extends z.infer<typeof imageAssetSchema> {}

export interface ObservationFormData extends z.infer<typeof simpleObservationFormSchema> {}
