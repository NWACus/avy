/* eslint-disable @typescript-eslint/no-explicit-any */
import {useQuery, UseQueryOptions} from 'react-query';
import {useFetch} from './observations-fetcher';
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
    centerId: string;
    createdAt: any;
    lastUpdated: any;
    status: string;
    private: boolean;
    observerType: string;
    organization: string;
    name?: string | null;
    startDate?: any | null;
    endDate?: any | null;
    activity: Array<string>;
    locationName: string;
    route?: string | null;
    instability: any;
    instabilitySummary?: string | null;
    observationSummary: string;
    media?: any | null;
    urls?: Array<string> | null;
    avalanchesSummary?: string | null;
    numberMedia: number;
    locationPoint: {__typename?: 'CoordinatesGraph'; lat?: number | null; lng?: number | null};
    avalanches: Array<{
      __typename?: 'AvalancheObservationGraph';
      id: any;
      observationId: any;
      date?: any | null;
      time?: any | null;
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
      weakLayerDate?: any | null;
      comments?: string | null;
      media?: any | null;
    }>;
    advancedFields?: {
      __typename?: 'AdvancedFieldsGraphPublic';
      id: any;
      observationId: any;
      observedTerrain?: string | null;
      timeInField: any;
      weatherSummary?: string | null;
      weather?: any | null;
      avalancheComments?: string | null;
      snowpackSummary?: string | null;
      snowpack?: any | null;
      snowpackMedia?: any | null;
      avalancheProblems?: any | null;
      avalancheProblemsComments?: string | null;
      terrainUse?: string | null;
      bottomLine?: string | null;
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
    startDate?: any | null;
    locationName: string;
    instability: any;
    observationSummary: string;
    locationPoint: {__typename?: 'CoordinatesGraph'; lat?: number | null; lng?: number | null};
  }>;
};

export type OverviewFragment = {
  __typename?: 'ObservationGraphPublic';
  id: any;
  observerType: string;
  name?: string | null;
  startDate?: any | null;
  locationName: string;
  instability: any;
  observationSummary: string;
  locationPoint: {__typename?: 'CoordinatesGraph'; lat?: number | null; lng?: number | null};
};

export type EverythingFragment = {
  __typename?: 'ObservationGraphPublic';
  id: any;
  centerId: string;
  createdAt: any;
  lastUpdated: any;
  status: string;
  private: boolean;
  observerType: string;
  organization: string;
  name?: string | null;
  startDate?: any | null;
  endDate?: any | null;
  activity: Array<string>;
  locationName: string;
  route?: string | null;
  instability: any;
  instabilitySummary?: string | null;
  observationSummary: string;
  media?: any | null;
  urls?: Array<string> | null;
  avalanchesSummary?: string | null;
  numberMedia: number;
  locationPoint: {__typename?: 'CoordinatesGraph'; lat?: number | null; lng?: number | null};
  avalanches: Array<{
    __typename?: 'AvalancheObservationGraph';
    id: any;
    observationId: any;
    date?: any | null;
    time?: any | null;
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
    weakLayerDate?: any | null;
    comments?: string | null;
    media?: any | null;
  }>;
  advancedFields?: {
    __typename?: 'AdvancedFieldsGraphPublic';
    id: any;
    observationId: any;
    observedTerrain?: string | null;
    timeInField: any;
    weatherSummary?: string | null;
    weather?: any | null;
    avalancheComments?: string | null;
    snowpackSummary?: string | null;
    snowpack?: any | null;
    snowpackMedia?: any | null;
    avalancheProblems?: any | null;
    avalancheProblemsComments?: string | null;
    terrainUse?: string | null;
    bottomLine?: string | null;
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
}
    `;
export const EverythingFragmentDoc = `
    fragment everything on ObservationGraphPublic {
  id
  centerId
  createdAt
  lastUpdated
  status
  private
  observerType
  organization
  name
  startDate
  endDate
  activity
  locationPoint {
    lat
    lng
  }
  locationName
  route
  instability
  instabilitySummary
  observationSummary
  media
  urls
  avalanchesSummary
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
  advancedFields {
    id
    observationId
    observedTerrain
    timeInField
    weatherSummary
    weather
    avalancheComments
    snowpackSummary
    snowpack
    snowpackMedia
    avalancheProblems
    avalancheProblemsComments
    terrainUse
    bottomLine
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
export const useObservationQuery = <TData = ObservationQuery, TError = unknown>(variables: ObservationQueryVariables, options?: UseQueryOptions<ObservationQuery, TError, TData>) =>
  useQuery<ObservationQuery, TError, TData>(['observation', variables], useFetch<ObservationQuery, ObservationQueryVariables>(ObservationDocument).bind(null, variables), options);
export const ObservationsDocument = `
    query observations($center: String!, $startDate: String!, $endDate: String!) {
  getObservationList(centerId: $center, startDate: $startDate, endDate: $endDate) {
    ...overview
  }
}
    ${OverviewFragmentDoc}`;
export const useObservationsQuery = <TData = ObservationsQuery, TError = unknown>(
  variables: ObservationsQueryVariables,
  options?: UseQueryOptions<ObservationsQuery, TError, TData>,
) =>
  useQuery<ObservationsQuery, TError, TData>(
    ['observations', variables],
    useFetch<ObservationsQuery, ObservationsQueryVariables>(ObservationsDocument).bind(null, variables),
    options,
  );
