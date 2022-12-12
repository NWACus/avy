/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { VariableTracking } from '../models/VariableTracking';
import type { VariableTrackingCreate } from '../models/VariableTrackingCreate';

import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';

export class VariableTrackingService {

  /**
   * Get Variable Tracking
   * Retrieve the variables that are being tracked
   * @returns VariableTracking Successful Response
   * @throws ApiError
   */
  public static getVariableTrackingWxV1VariableTrackingGet({
    token,
  }: {
    /**
     * API key
     */
    token?: string,
  }): CancelablePromise<Array<VariableTracking>> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/wx/v1/variable/tracking/',
      query: {
        'token': token,
      },
    });
  }

  /**
   * Upsert Variable Tracking
   * Upsert variable in bulk
   * @returns VariableTrackingCreate Successful Response
   * @throws ApiError
   */
  public static upsertVariableTrackingWxV1VariableTrackingPost({
    requestBody,
    token,
  }: {
    requestBody: Array<VariableTrackingCreate>,
    /**
     * API key
     */
    token?: string,
  }): CancelablePromise<Array<VariableTrackingCreate>> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/wx/v1/variable/tracking/',
      query: {
        'token': token,
      },
      body: requestBody,
      mediaType: 'application/json',
      errors: {
        422: `Validation Error`,
      },
    });
  }

  /**
   * Delete Tracking
   * Remove a variable being tracked by id
   * @returns VariableTracking Successful Response
   * @throws ApiError
   */
  public static deleteTrackingWxV1VariableTrackingVariableTrackingIdDelete({
    variableTrackingId,
    token,
  }: {
    variableTrackingId: string,
    /**
     * API key
     */
    token?: string,
  }): CancelablePromise<VariableTracking> {
    return __request(OpenAPI, {
      method: 'DELETE',
      url: '/wx/v1/variable/tracking/{variable_tracking_id}',
      path: {
        'variable_tracking_id': variableTrackingId,
      },
      query: {
        'token': token,
      },
      errors: {
        422: `Validation Error`,
      },
    });
  }

}
