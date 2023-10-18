import {AxiosError, AxiosResponse} from 'axios';
import {Logger} from 'browser-bunyan';
import {NotFoundError} from 'types/requests';

export const safeFetch = async <T>(request: () => Promise<AxiosResponse<T>>, logger: Logger, pretty: string) => {
  try {
    logger.trace('sending request');
    const {data} = await request();
    return data;
  } catch (error) {
    if (!(error instanceof AxiosError)) {
      logger.warn({error: error}, `unexpected error`);
      throw new Error(`unexpected error: ${JSON.stringify(error)}`);
    }
    if (error.response) {
      if (error.response.status === 404) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        throw new NotFoundError(`error response ${error.response.status}: ${JSON.stringify(error.response.data.message)}`, pretty);
      } else {
        logger.warn({status: error.response.status, error: JSON.stringify(error.response.data)}, `error response on fetch`);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        throw new Error(`error response ${error.response.status}: ${JSON.stringify(error.response.data.message)}`);
      }
    } else if (error.request) {
      logger.warn({error: JSON.stringify(error.request)}, `no response on fetch`);
      throw new Error(`no response: ${JSON.stringify(error.request)}`);
    } else {
      logger.warn({error: error}, `could not create request`);
      throw new Error(`failed to request: ${JSON.stringify(error)}`);
    }
  }
};
