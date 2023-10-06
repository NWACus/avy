import axios from 'axios';

import {ObservationTaskData} from 'components/observations/uploader/Task';
import {logger} from 'logger';
import {Observation} from 'types/nationalAvalancheCenter';
import {apiDateString} from 'utils/date';

export async function uploadObservation(id: string, data: ObservationTaskData): Promise<Observation> {
  const {formData, extraData} = data;
  const {url, ...params} = extraData;
  const payload: Partial<Observation> = {
    ...formData,
    ...params,
    obs_source: 'public',
    // Date has to be a plain-old YYYY-MM-DD string
    start_date: apiDateString(formData.start_date),
    status: 'published',
  };
  try {
    const {data: responseData} = await axios.post<Observation>(url, payload, {
      headers: {
        // Public API uses the Origin header to determine who's authorized to call it
        Origin: 'https://nwac.us',
      },
    });
    // You'd think we could feed data to Zod and get a strongly typed object back, but
    // the object that we get back from the post can't actually be parsed by our schema :(
    // TODO(skuznets): figure out what we get from POST and actually parse it ...
    return responseData;
  } catch (error) {
    logger.error(
      {
        error,
        url,
        payload,
      },
      'error uploading observation',
    );
    throw error;
  }
}
