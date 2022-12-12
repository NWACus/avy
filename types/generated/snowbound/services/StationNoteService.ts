/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { StationNote } from '../models/StationNote';

import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';

export class StationNoteService {

  /**
   * Get Notes
   * Retrieve notes for the client
   * @returns StationNote Successful Response
   * @throws ApiError
   */
  public static getNotesWxV1StationNoteGet({
    stid,
    status,
    token,
  }: {
    /**
     * Station id or comma seperated list, for example 'SVB' or 'SVB,BNRI1'
     */
    stid?: string,
    /**
     * Note status, one of [active, inactive, deleted]
     */
    status?: string,
    /**
     * API key
     */
    token?: string,
  }): CancelablePromise<Array<StationNote>> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/wx/v1/station/note/',
      query: {
        'stid': stid,
        'status': status,
        'token': token,
      },
      errors: {
        422: `Validation Error`,
      },
    });
  }

}
