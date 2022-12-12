/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

export type StationNote = {
  id: string;
  client_id: number;
  stid: string;
  date_created: string;
  date_updated: string;
  start_date: string;
  end_date?: string;
  status: string;
  note: string;
  history?: any;
};

