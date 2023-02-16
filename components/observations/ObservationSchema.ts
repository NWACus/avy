import * as Yup from 'yup';
import {merge} from 'lodash';

export interface Observation {
  name: string;
  email: string;
  observationDate: Date;
  zone: string;
  activity: string;
  location: string;
}

export const createObservation = (initialValues: Partial<Observation> | null = null): Observation =>
  merge(
    {
      name: '',
      email: '',
      observationDate: new Date(),
      zone: '',
      activity: '',
      location: '',
    },
    initialValues,
  );

const requiredMsg = 'This field is required.';

export const observationSchema = Yup.object().shape({
  name: Yup.string().min(2, 'That name is too short.').max(50, 'That name is too long.').required(requiredMsg),

  email: Yup.string().email("That doesn't look like an email address.").required(requiredMsg),

  observationDate: Yup.date().required(requiredMsg),

  zone: Yup.string().required('You must select a region.'),

  activity: Yup.string().required('You must select an activity.'),

  location: Yup.string().min(2, 'Please provide a location.'),
});
