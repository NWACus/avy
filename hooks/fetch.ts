import {AxiosResponse} from 'axios';
import {Logger} from 'browser-bunyan';

export const safeFetch = async <T>(request: () => Promise<AxiosResponse<T>>, logger: Logger) => {
  try {
    const {data} = await request();
    return data;
  } catch (error) {
    if (error.response) {
      logger.warn({status: error.response.status, error: error.response.data}, `error response on fetch`);
      throw new Error(`error response ${error.response.status}: ${error.response.data.message}`);
    } else if (error.request) {
      logger.warn({error: error.request}, `no response on fetch`);
      throw new Error(`no response: ${error.request}`);
    } else {
      logger.warn({error: error}, `could not create request`);
      throw new Error(`failed to request: ${error}`);
    }
  }
};
