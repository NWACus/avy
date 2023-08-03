import {UseQueryResult} from '@tanstack/react-query';
import ErrorIllustration from 'assets/illustrations/Error.svg';
import NoGPS from 'assets/illustrations/NoGPS.svg';
import NoSearchResult from 'assets/illustrations/NoSearchResult.svg';
import Stop from 'assets/illustrations/Stop.svg';
import {Outcome} from 'components/content/Outcome';
import {HStack} from 'components/core';
import {LoggerContext, LoggerProps} from 'loggerContext';
import React from 'react';
import {ActivityIndicator} from 'react-native';
import * as Sentry from 'sentry-expo';
import {NotFoundError} from 'types/requests';

export const QueryState: React.FunctionComponent<{results: UseQueryResult[]}> = ({results}) => {
  const {logger} = React.useContext<LoggerProps>(LoggerContext);

  const errors = results.filter(result => result.isError && !(result.error instanceof NotFoundError)).map(result => result.error);
  if (errors.length > 0) {
    errors.forEach(error => {
      Sentry.Native.captureException(error);
    });
    logger.error({errors: errors}, 'queries errored');
    return <InternalError />;
  }

  if (results.map(result => result.isLoading).reduce((accumulator, value) => accumulator || value)) {
    return <Loading />;
  }

  if (results.map(isResultNotFound).reduce((accumulator, value) => accumulator || value)) {
    const what = results.filter(isResultNotFound).map(result => result.error as NotFoundError);
    return <NotFound what={what} />;
  }

  logger.error({results: results}, 'QueryState called with a set of queries that were loaded and had no errors');
  Sentry.Native.captureException(new Error(`QueryState called with a set of queries that were loaded and had no errors: ${JSON.stringify(results)}`));
  return <InternalError />;
};

const isResultNotFound = (result: UseQueryResult): boolean => result.isError && result.error instanceof NotFoundError;

export const InternalError: React.FunctionComponent<{inline?: boolean}> = ({inline}) => {
  // const navigation = useNavigation<TabNavigationProps>();
  return (
    <Outcome
      outcome={'Oops, something went wrong!'}
      reason={"We're sorry, but we cannot complete your request at this time."}
      illustration={<ErrorIllustration />}
      inline={inline}
      // onClose={() => navigation.navigate('Home')} // TODO(skuznets): figure out how to navigate home here, as we don't have the props needed to go home - can we go to defaults for tab navigator?
    />
  );
};

export const Loading: React.FunctionComponent = () => {
  return (
    <HStack width={'100%'} space={8} style={{flex: 1}} justifyContent={'center'} alignItems={'center'}>
      <ActivityIndicator />
    </HStack>
  );
};

export const NotFound: React.FunctionComponent<{what?: NotFoundError[]; terminal?: boolean; inline?: boolean}> = ({what, terminal, inline}) => {
  let thing = 'requested resource';
  if (what && what[0] && what[0] instanceof NotFoundError && what[0].pretty) {
    thing = what[0].pretty;
  }
  // const navigation = useNavigation<TabNavigationProps>();
  // let onClose: (() => void) | undefined = () => navigation.navigate('Home');
  let onClose: (() => void) | undefined = () => ({});
  if (terminal) {
    onClose = undefined;
  }
  return <Outcome outcome={'No results found'} reason={`We could not find the ${thing}.`} inline={inline} illustration={<NoSearchResult />} onClose={onClose} />;
};

export const ConnectionLost: React.FunctionComponent = () => {
  // const navigation = useNavigation<TabNavigationProps>();
  const [loading, setLoading] = React.useState<boolean>(false);
  React.useEffect(() => {
    if (loading) {
      setTimeout(() => setLoading(false), 750); // TODO(skuznets): plumb through the refresh here
    }
  }, [loading]);

  if (loading) {
    return <Loading />;
  } else {
    return (
      <Outcome
        outcome={'Connection lost!'}
        reason={'Something went wrong, please try again.'}
        illustration={<NoGPS />}
        onRetry={() => setLoading(true)}
        // onClose={() =>
        //   navigation.navigate('Home', {
        //     screen: 'avalancheCenter',
        //     params: {},
        //   })
        // }
      />
    );
  }
};

export const Unavailable: React.FunctionComponent = () => {
  return <Outcome outcome={'Under construction!'} reason={"This functionality is still under construction, check back later once it's done."} illustration={<Stop />} />;
};

// incompleteQueryState checks to see if any of the queries are not yet complete - if so, render a <QueryState/>.
export const incompleteQueryState = (...results: UseQueryResult[]): boolean => {
  return results
    .map(result => [result.isError, result.isLoading, isResultNotFound(result)])
    .flat()
    .reduce((accumulator, value) => accumulator || value);
};
