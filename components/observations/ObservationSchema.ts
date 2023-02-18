import * as Yup from 'yup';
import {merge} from 'lodash';
import {LatLng} from 'react-native-maps';

export interface Observation {
  visibility: string;
  photoUsage: string;

  name: string;
  email: string;
  observationDate: Date;
  zone: string;
  activity: string[];
  location: LatLng;
}

export const createObservation = (initialValues: Partial<Observation> | null = null): Observation =>
  merge(
    {
      visibility: 'Private',

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

export const observationSchema = Yup.object().shape({
  name: Yup.string().min(2, 'That name is too short.').max(50, 'That name is too long.').required(requiredMsg),

  email: Yup.string().email("That doesn't look like an email address.").required(requiredMsg),

  observationDate: Yup.date().required(requiredMsg),

  zone: Yup.string().required('You must select a region.'),

  activity: Yup.array().min(1, 'You must select at least one activity.').required('You must select at least one activity.'),

  location: Yup.string().required(requiredMsg),

  mapLocation: Yup.object()
    .shape({
      lat: Yup.number(),
      lng: Yup.number(),
    })
    .required(requiredMsg),
});
