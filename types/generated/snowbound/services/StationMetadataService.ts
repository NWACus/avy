/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ClientStationMetadata } from '../models/ClientStationMetadata';
import type { StationMetadata } from '../models/StationMetadata';

import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';

export class StationMetadataService {

  /**
   * Read Station Metadata
   * Retrieve multiple station metadata.
   * @returns any Successful Response
   * @throws ApiError
   */
  public static readStationMetadataWxV1StationMetadataGet({
    stid,
    source,
    bbox,
    limit,
    accept,
    token,
  }: {
    /**
     * Station id or comma seperated list, for example 'SVB' or 'SVB,BNRI1'
     */
    stid?: string,
    /**
     * Station source. Possible sources are ['mesowest', 'snotel']
     */
    source?: string,
    /**
     * Bounding box, comma seperated list from lower
     * left to upper right. For example, '-116,45,-115,47'
     */
    bbox?: string,
    /**
     * Limit the number of stations returned
     */
    limit?: number,
    accept?: string,
    /**
     * API key
     */
    token?: string,
  }): CancelablePromise<any> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/wx/v1/station/metadata/',
      headers: {
        'accept': accept,
      },
      query: {
        'stid': stid,
        'source': source,
        'bbox': bbox,
        'limit': limit,
        'token': token,
      },
      errors: {
        422: `Validation Error`,
      },
    });
  }

  /**
   * Get Station Metadata
   * Get station metadata by it's UUID
   * @returns StationMetadata Successful Response
   * @throws ApiError
   */
  public static getStationMetadataWxV1StationMetadataIdGet({
    id,
    token,
  }: {
    id: string,
    /**
     * API key
     */
    token?: string,
  }): CancelablePromise<StationMetadata> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/wx/v1/station/metadata/{id}',
      path: {
        'id': id,
      },
      query: {
        'token': token,
      },
      errors: {
        422: `Validation Error`,
      },
    });
  }

  /**
   * Read Station Metadata
   * Retrieve multiple station metadata.
   * @returns ClientStationMetadata Successful Response
   * @throws ApiError
   */
  public static readStationMetadataWxV1StationMetadataClientGet({
    token,
  }: {
    /**
     * API key
     */
    token?: string,
  }): CancelablePromise<Array<ClientStationMetadata>> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/wx/v1/station/metadata/client/',
      query: {
        'token': token,
      },
    });
  }

}
