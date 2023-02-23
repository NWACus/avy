import {merge} from 'lodash';
import {LatLng} from 'react-native-maps';
import * as Yup from 'yup';

export interface Observation {
  visibility: string;
  photoUsage: string;

  name: string;
  email: string;
  observationDate: Date;
  zone: string;
  activity: string[];
  location: LatLng;

  fieldNotes: string;
}

export const createObservation = (initialValues: Partial<Observation> | null = null): Observation =>
  merge(
    {
      visibility: 'Private',
      photoUsage: 'anonymous',

      name: '',
      email: '',
      observationDate: new Date(),
      zone: '',
      activity: [],
      location: '',
      mapLocation: null,
    },
    initialValues,
  );

const requiredMsg = 'This field is required.';
const tooShort = 'This value is too short.';
const tooLong = 'This value is too long.';

export const observationSchema = Yup.object().shape({
  name: Yup.string().min(2, tooShort).max(50, tooLong).required(requiredMsg),

  email: Yup.string().email("That doesn't look like an email address.").required(requiredMsg),

  observationDate: Yup.date().required(requiredMsg),

  zone: Yup.string().required('You must select a region.'),

  activity: Yup.array().min(1, 'You must select at least one activity.').required('You must select at least one activity.'),

  location: Yup.string().min(8, tooShort).max(256, tooLong).required(requiredMsg),

  mapLocation: Yup.object()
    .shape({
      lat: Yup.number(),
      lng: Yup.number(),
    })
    .required(requiredMsg),

  fieldNotes: Yup.string().min(8, tooShort).max(1024, tooLong).required(requiredMsg),
});
