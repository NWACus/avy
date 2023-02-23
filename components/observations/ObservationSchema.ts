import {merge} from 'lodash';
import {LatLng} from 'react-native-maps';
import * as Yup from 'yup';

export interface Observation {
  private: boolean;
  photoUsage: string;

  name: string;
  email: string;
  start_date: Date;
  zone: string;
  activity: string[];
  location: LatLng;

  avalanches_summary: string;

  observation_summary: string;
}

export const createObservation = (initialValues: Partial<Observation> | null = null): Observation =>
  merge(
    {
      private: false,
      photoUsage: 'anonymous',

      name: '',
      email: '',
      start_date: new Date(),
      zone: '',
      activity: [],
      location: '',
      location_point: null,
    },
    initialValues,
  );

const required = 'This field is required.';
const tooShort = 'This value is too short.';
const tooLong = 'This value is too long.';

export const observationSchema = Yup.object().shape({
  name: Yup.string().min(2, tooShort).max(50, tooLong).required(required),

  email: Yup.string().email("That doesn't look like an email address.").required(required),

  start_date: Yup.date().required(required),

  zone: Yup.string().required('You must select a region.'),

  activity: Yup.array().min(1, 'You must select at least one activity.').required('You must select at least one activity.'),

  location: Yup.string().min(8, tooShort).max(256, tooLong).required(required),

  location_point: Yup.object()
    .shape({
      lat: Yup.number(),
      lng: Yup.number(),
    })
    .required(required),

  observation_summary: Yup.string().min(8, tooShort).max(1024, tooLong).required(required),

  avalanches_summary: Yup.string().max(1024, tooLong),
});
