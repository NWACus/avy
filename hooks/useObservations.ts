/* eslint-disable @typescript-eslint/no-explicit-any */
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends {[key: string]: unknown}> = {[K in keyof T]: T[K]};
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & {[SubKey in K]?: Maybe<T[SubKey]>};
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & {[SubKey in K]: Maybe<T[SubKey]>};
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
  /** Date (isoformat) */
  Date: any;
  /** Date with time (isoformat) */
  DateTime: any;
  /** The `JSON` scalar type represents JSON values */
  JSON: any;
  /** Time (isoformat) */
  Time: any;
  UUID: any;
};

export type AdvancedFieldsGraphPublic = {
  __typename?: 'AdvancedFieldsGraphPublic';
  avalancheComments?: Maybe<Scalars['String']>;
  avalancheProblems?: Maybe<Scalars['JSON']>;
  avalancheProblemsComments?: Maybe<Scalars['String']>;
  bottomLine?: Maybe<Scalars['String']>;
  id: Scalars['UUID'];
  observationId: Scalars['UUID'];
  observedTerrain?: Maybe<Scalars['String']>;
  snowpack?: Maybe<Scalars['JSON']>;
  snowpackMedia?: Maybe<Scalars['JSON']>;
  snowpackSummary?: Maybe<Scalars['String']>;
  terrainUse?: Maybe<Scalars['String']>;
  timeInField: Scalars['JSON'];
  weather?: Maybe<Scalars['JSON']>;
  weatherSummary?: Maybe<Scalars['String']>;
};

export type AvalancheObservationGraph = {
  __typename?: 'AvalancheObservationGraph';
  aspect?: Maybe<Scalars['String']>;
  avalancheType?: Maybe<Scalars['String']>;
  avgCrownDepth?: Maybe<Scalars['Float']>;
  bedSfc?: Maybe<Scalars['String']>;
  cause?: Maybe<Scalars['String']>;
  comments?: Maybe<Scalars['String']>;
  dSize?: Maybe<Scalars['String']>;
  date?: Maybe<Scalars['Date']>;
  dateAccuracy?: Maybe<Scalars['String']>;
  elevation?: Maybe<Scalars['Int']>;
  id: Scalars['UUID'];
  location?: Maybe<Scalars['String']>;
  media?: Maybe<Scalars['JSON']>;
  number?: Maybe<Scalars['Int']>;
  observationId: Scalars['UUID'];
  rSize?: Maybe<Scalars['String']>;
  slopeAngle?: Maybe<Scalars['Float']>;
  time?: Maybe<Scalars['Time']>;
  trigger?: Maybe<Scalars['String']>;
  verticalFall?: Maybe<Scalars['Float']>;
  weakLayerDate?: Maybe<Scalars['Date']>;
  weakLayerType?: Maybe<Scalars['String']>;
  width?: Maybe<Scalars['Float']>;
};

export type CoordinatesGraph = {
  __typename?: 'CoordinatesGraph';
  lat?: Maybe<Scalars['Float']>;
  lng?: Maybe<Scalars['Float']>;
};

export type ObservationGraphPublic = {
  __typename?: 'ObservationGraphPublic';
  activity: Array<Scalars['String']>;
  advancedFields?: Maybe<AdvancedFieldsGraphPublic>;
  avalanches: Array<AvalancheObservationGraph>;
  avalanchesSummary?: Maybe<Scalars['String']>;
  centerId: Scalars['String'];
  createdAt: Scalars['DateTime'];
  endDate?: Maybe<Scalars['Date']>;
  id: Scalars['UUID'];
  instability: Scalars['JSON'];
  instabilitySummary?: Maybe<Scalars['String']>;
  lastUpdated: Scalars['DateTime'];
  locationName: Scalars['String'];
  locationPoint: CoordinatesGraph;
  media?: Maybe<Scalars['JSON']>;
  name?: Maybe<Scalars['String']>;
  numberMedia: Scalars['Int'];
  observationSummary: Scalars['String'];
  observerType: Scalars['String'];
  organization: Scalars['String'];
  private: Scalars['Boolean'];
  route?: Maybe<Scalars['String']>;
  startDate?: Maybe<Scalars['Date']>;
  status: Scalars['String'];
  urls?: Maybe<Array<Scalars['String']>>;
};

export type Query = {
  __typename?: 'Query';
  getObservationList: Array<ObservationGraphPublic>;
  getSingleObservation: ObservationGraphPublic;
};

export type QueryGetObservationListArgs = {
  centerId: Scalars['String'];
  endDate: Scalars['String'];
  startDate: Scalars['String'];
};

export type QueryGetSingleObservationArgs = {
  id: Scalars['ID'];
};

export type ObservationQueryVariables = Exact<{
  id: Scalars['ID'];
}>;

export type ObservationQuery = {
  __typename?: 'Query';
  getSingleObservation: {
    __typename?: 'ObservationGraphPublic';
    id: any;
    status: string;
    private: boolean;
    organization: string;
    name?: string | null;
    activity: Array<string>;
    route?: string | null;
    instability: any;
    media?: any;
    urls?: Array<string> | null;
    numberMedia: number;
    center_id: string;
    created_at: any;
    last_updated: any;
    observer_type: string;
    start_date?: any;
    end_date?: any;
    location_name: string;
    instability_summary?: string | null;
    observation_summary: string;
    avalanches_summary?: string | null;
    location_point: {__typename?: 'CoordinatesGraph'; lat?: number | null; lng?: number | null};
    avalanches: Array<{
      __typename?: 'AvalancheObservationGraph';
      id: any;
      observationId: any;
      date?: any;
      time?: any;
      dateAccuracy?: string | null;
      location?: string | null;
      number?: number | null;
      avalancheType?: string | null;
      cause?: string | null;
      trigger?: string | null;
      avgCrownDepth?: number | null;
      dSize?: string | null;
      rSize?: string | null;
      bedSfc?: string | null;
      elevation?: number | null;
      verticalFall?: number | null;
      width?: number | null;
      slopeAngle?: number | null;
      aspect?: string | null;
      weakLayerType?: string | null;
      weakLayerDate?: any;
      comments?: string | null;
      media?: any;
    }>;
    advanced_fields?: {
      __typename?: 'AdvancedFieldsGraphPublic';
      id: any;
      weather?: any;
      snowpack?: any;
      observation_id: any;
      observed_terrain?: string | null;
      time_in_field: any;
      weather_summary?: string | null;
      avalanche_comments?: string | null;
      snowpack_summary?: string | null;
      snowpack_media?: any;
      avalanche_problems?: any;
      avalanche_problems_comments?: string | null;
      terrain_use?: string | null;
      bottom_line?: string | null;
    } | null;
  };
};

export type ObservationsQueryVariables = Exact<{
  center: Scalars['String'];
  startDate: Scalars['String'];
  endDate: Scalars['String'];
}>;

export type ObservationsQuery = {
  __typename?: 'Query';
  getObservationList: Array<{
    __typename?: 'ObservationGraphPublic';
    id: any;
    observerType: string;
    name?: string | null;
    createdAt: any;
    locationName: string;
    instability: any;
    observationSummary: string;
    media?: any;
    locationPoint: {__typename?: 'CoordinatesGraph'; lat?: number | null; lng?: number | null};
  }>;
};

export type OverviewFragment = {
  __typename?: 'ObservationGraphPublic';
  id: any;
  observerType: string;
  name?: string | null;
  createdAt: any;
  locationName: string;
  instability: any;
  observationSummary: string;
  media?: any;
  locationPoint: {__typename?: 'CoordinatesGraph'; lat?: number | null; lng?: number | null};
};

export type EverythingFragment = {
  __typename?: 'ObservationGraphPublic';
  id: any;
  status: string;
  private: boolean;
  organization: string;
  name?: string | null;
  activity: Array<string>;
  route?: string | null;
  instability: any;
  media?: any;
  urls?: Array<string> | null;
  numberMedia: number;
  center_id: string;
  created_at: any;
  last_updated: any;
  observer_type: string;
  start_date?: any;
  end_date?: any;
  location_name: string;
  instability_summary?: string | null;
  observation_summary: string;
  avalanches_summary?: string | null;
  location_point: {__typename?: 'CoordinatesGraph'; lat?: number | null; lng?: number | null};
  avalanches: Array<{
    __typename?: 'AvalancheObservationGraph';
    id: any;
    observationId: any;
    date?: any;
    time?: any;
    dateAccuracy?: string | null;
    location?: string | null;
    number?: number | null;
    avalancheType?: string | null;
    cause?: string | null;
    trigger?: string | null;
    avgCrownDepth?: number | null;
    dSize?: string | null;
    rSize?: string | null;
    bedSfc?: string | null;
    elevation?: number | null;
    verticalFall?: number | null;
    width?: number | null;
    slopeAngle?: number | null;
    aspect?: string | null;
    weakLayerType?: string | null;
    weakLayerDate?: any;
    comments?: string | null;
    media?: any;
  }>;
  advanced_fields?: {
    __typename?: 'AdvancedFieldsGraphPublic';
    id: any;
    weather?: any;
    snowpack?: any;
    observation_id: any;
    observed_terrain?: string | null;
    time_in_field: any;
    weather_summary?: string | null;
    avalanche_comments?: string | null;
    snowpack_summary?: string | null;
    snowpack_media?: any;
    avalanche_problems?: any;
    avalanche_problems_comments?: string | null;
    terrain_use?: string | null;
    bottom_line?: string | null;
  } | null;
};

export const OverviewFragmentDoc = `
    fragment overview on ObservationGraphPublic {
  id
  observerType
  name
  startDate
  locationPoint {
    lat
    lng
  }
  locationName
  instability
  observationSummary
  media
}
    `;
export const EverythingFragmentDoc = `
    fragment everything on ObservationGraphPublic {
  id
  center_id: centerId
  created_at: createdAt
  last_updated: lastUpdated
  status
  private
  observer_type: observerType
  organization
  name
  start_date: startDate
  end_date: endDate
  activity
  location_point: locationPoint {
    lat
    lng
  }
  location_name: locationName
  route
  instability
  instability_summary: instabilitySummary
  observation_summary: observationSummary
  media
  urls
  avalanches_summary: avalanchesSummary
  avalanches {
    id
    observationId
    date
    time
    dateAccuracy
    location
    number
    avalancheType
    cause
    trigger
    avgCrownDepth
    dSize
    rSize
    bedSfc
    elevation
    verticalFall
    width
    slopeAngle
    aspect
    weakLayerType
    weakLayerDate
    comments
    media
  }
  advanced_fields: advancedFields {
    id
    observation_id: observationId
    observed_terrain: observedTerrain
    time_in_field: timeInField
    weather_summary: weatherSummary
    weather
    avalanche_comments: avalancheComments
    snowpack_summary: snowpackSummary
    snowpack
    snowpack_media: snowpackMedia
    avalanche_problems: avalancheProblems
    avalanche_problems_comments: avalancheProblemsComments
    terrain_use: terrainUse
    bottom_line: bottomLine
  }
  numberMedia
}
    `;
export const ObservationDocument = `
    query observation($id: ID!) {
  getSingleObservation(id: $id) {
    ...everything
  }
}
    ${EverythingFragmentDoc}`;

export const ObservationsDocument = `
    query observations($center: String!, $startDate: String!, $endDate: String!) {
  getObservationList(centerId: $center, startDate: $startDate, endDate: $endDate) {
    ...overview
  }
}
    ${OverviewFragmentDoc}`;
