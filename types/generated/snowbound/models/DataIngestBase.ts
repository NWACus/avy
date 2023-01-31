/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

export type DataIngestBase = {
  id?: string;
  client_id?: number;
  stid: string;
  date_created?: string;
  start_date: string;
  source: string;
  data_source: string;
  data_file_type: string;
  data_timezone: string;
  data_file_format: string;
  file_parse_options?: any;
  additional_processing?: any;
  column_map: any;
};

