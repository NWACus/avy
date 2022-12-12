/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';

export class CurrentDataService {

  /**
   * Get Station Data Current
   * Retrieve station data
   * @returns any Successful Response
   * @throws ApiError
   */
  public static getStationDataCurrentWxV1StationDataCurrentGet({
    units = 'default',
    calcDiff = false,
    accept,
    token,
  }: {
    /**
     * Units return data in
     */
    units?: string,
    /**
     * Calculate 24hr difference
     */
    calcDiff?: boolean,
    accept?: string,
    /**
     * API key
     */
    token?: string,
  }): CancelablePromise<any> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/wx/v1/station/data/current/',
      headers: {
        'accept': accept,
      },
      query: {
        'units': units,
        'calc_diff': calcDiff,
        'token': token,
      },
      errors: {
        422: `Validation Error`,
      },
    });
  }

}
