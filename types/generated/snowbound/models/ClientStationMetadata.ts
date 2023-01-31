/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { Coordinates } from './Coordinates';
import type { DataIngestBase } from './DataIngestBase';
import type { StationNote } from './StationNote';

export type ClientStationMetadata = {
  id: string;
  stid: string;
  name: string;
  latitude: number;
  longitude: number;
  elevation?: number;
  timezone: string;
  source: string;
  date_created: string;
  coordinates: Coordinates;
  meta: any;
  station_note?: Array<StationNote>;
  data_ingest?: Array<DataIngestBase>;
};

