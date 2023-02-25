import {UseQueryResult} from '@tanstack/react-query';
import {HStack} from 'components/core';
import {Body} from 'components/text';
import React from 'react';
import {ActivityIndicator} from 'react-native';
import * as Sentry from 'sentry-expo';

export const QueryState: React.FunctionComponent<{results: UseQueryResult[]}> = ({results}) => {
  const errors = results.filter(result => result.isError).map(result => result.error as Error);
  if (errors.length > 0) {
    errors.forEach(error => {
      Sentry.Native.captureException(error);
    });
    return <InternalError />;
  }

  if (results.map(result => result.isLoading).reduce((accumulator, value) => accumulator || value)) {
    return <Loading />;
  }

  if (results.map(result => result.isSuccess && !result.data).reduce((accumulator, value) => accumulator || value)) {
    return <NotFound />;
  }

  Sentry.Native.captureException(new Error(`QueryState called with a set of queries that were loaded and had no errors: ${JSON.stringify(results)}`));
  return <InternalError />;
};

export const InternalError: React.FunctionComponent = () => {
  return (
    <HStack width={'100%'} space={8} style={{flex: 1}} justifyContent={'center'} alignItems={'center'}>
      <Body>An internal error occurred.</Body>
    </HStack>
  );
};

export const Loading: React.FunctionComponent = () => {
  return (
    <HStack width={'100%'} space={8} style={{flex: 1}} justifyContent={'center'} alignItems={'center'}>
      <ActivityIndicator />
    </HStack>
  );
};

export const NotFound: React.FunctionComponent = () => {
  return (
    <HStack width={'100%'} space={8} style={{flex: 1}} justifyContent={'center'} alignItems={'center'}>
      <Body>Could not find the requested resource.</Body>
    </HStack>
  );
};

// incompleteQueryState checks to see if any of the queries are not yet complete - if so, render a <QueryState/>.
export const incompleteQueryState = (...results: UseQueryResult[]): boolean => {
  return results
    .map(result => [result.isError, result.isLoading, result.isSuccess && !result.data])
    .flat()
    .reduce((accumulator, value) => accumulator || value);
};
