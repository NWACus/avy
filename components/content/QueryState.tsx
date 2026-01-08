import * as Sentry from '@sentry/react-native';
import {onlineManager, UseQueryResult} from '@tanstack/react-query';
import ErrorIllustration from 'assets/illustrations/Error.svg';
import NoConnection from 'assets/illustrations/NoConnection.svg';
import NoSearchResult from 'assets/illustrations/NoSearchResult.svg';
import {Outcome} from 'components/content/Outcome';
import {HStack} from 'components/core';
import {useToggle} from 'hooks/useToggle';
import {LoggerContext, LoggerProps} from 'loggerContext';
import React from 'react';
import {ActivityIndicator} from 'react-native';
import {NotFoundError} from 'types/requests';

interface QueryStateProps {
  results: UseQueryResult[];
  terminal?: boolean;
  customMessage?: {
    notFound?: (what?: NotFoundError[]) => {headline: string; body: string};
  };
}

export const QueryState: React.FunctionComponent<QueryStateProps> = ({results, terminal, customMessage}) => {
  const {logger} = React.useContext<LoggerProps>(LoggerContext);

  const errors = results.filter(result => result.isError && !(result.error instanceof NotFoundError)).map(result => result.error);
  if (errors.length > 0) {
    errors.forEach(error => {
      Sentry.captureException(error);
    });
    logger.error({errors: errors}, 'queries errored');
    return <InternalError />;
  }

  if (results.map(result => result.isLoading).reduce((accumulator, value) => accumulator || value)) {
    if (!onlineManager.isOnline()) {
      return <ConnectionLost />;
    }

    return <Loading />;
  }

  if (results.map(isResultNotFound).reduce((accumulator, value) => accumulator || value)) {
    const what = results.filter(isResultNotFound).map(result => result.error as NotFoundError);
    const {headline, body} = customMessage?.notFound?.(what) || {headline: undefined, body: undefined};
    return <NotFound what={what} body={body} headline={headline} terminal={terminal} />;
  }

  logger.error({results: results}, 'QueryState called with a set of queries that were loaded and had no errors');
  Sentry.captureException(new Error(`QueryState called with a set of queries that were loaded and had no errors: ${JSON.stringify(results)}`));

  return <InternalError />;
};

const isResultNotFound = (result: UseQueryResult): boolean => result.isError && result.error instanceof NotFoundError;

export const InternalError: React.FunctionComponent<{inline?: boolean}> = ({inline}) => {
  // const navigation = useNavigation<TabNavigationProps>();
  return (
    <Outcome
      headline={'Oh no!'}
      body={"We're sorry, but we cannot complete your request at this time."}
      illustration={<ErrorIllustration />}
      illustrationBottomMargin={-64}
      illustrationLeftMargin={-16}
      inline={inline}
      // onClose={() => navigation.navigate('Home')} // TODO(skuznets): figure out how to navigate home here, as we don't have the props needed to go home - can we go to defaults for tab navigator?
    />
  );
};

export const Loading: React.FunctionComponent = () => {
  return (
    <HStack width={'100%'} space={8} style={{flex: 1}} justifyContent={'center'} alignItems={'center'}>
      <ActivityIndicator size="large" />
    </HStack>
  );
};

interface NotFoundProps {
  what?: NotFoundError[];
  terminal?: boolean;
  inline?: boolean;
  body?: string;
  headline?: string;
}
export const NotFound: React.FunctionComponent<NotFoundProps> = ({what, terminal, inline, body, headline}) => {
  let thing = 'the requested resource';
  if (what && what[0] && what[0] instanceof NotFoundError && what[0].pretty) {
    thing = what[0].pretty;
  }
  // const navigation = useNavigation<TabNavigationProps>();
  // let onClose: (() => void) | undefined = () => navigation.navigate('Home');
  let onClose: (() => void) | undefined = () => ({});
  if (terminal) {
    onClose = undefined;
  }
  return (
    <Outcome
      headline={headline || 'No results found'}
      body={body || `We could not find ${thing}.`}
      inline={inline}
      illustration={<NoSearchResult />}
      illustrationBottomMargin={-48}
      onClose={onClose}
    />
  );
};

export const ConnectionLost: React.FunctionComponent = () => {
  // const navigation = useNavigation<TabNavigationProps>();
  const [loading, {on: setLoadingOn, off: setLoadingOff}] = useToggle(false);
  React.useEffect(() => {
    if (loading) {
      setTimeout(setLoadingOff, 750); // TODO(skuznets): plumb through the refresh here
    }
  }, [loading, setLoadingOff]);

  if (loading) {
    return <Loading />;
  } else {
    return (
      <Outcome
        headline={'Oh no!'}
        body={"It looks like you're not connected to the internet. Please reconnect and try again."}
        illustration={<NoConnection />}
        illustrationBottomMargin={-32}
        illustrationLeftMargin={-16}
        onRetry={setLoadingOn}
      />
    );
  }
};

// incompleteQueryState checks to see if any of the queries are not yet complete - if so, render a <QueryState/>.
export const incompleteQueryState = (...results: UseQueryResult[]): boolean => {
  return results.some(result => result.isError || result.isLoading);
};
