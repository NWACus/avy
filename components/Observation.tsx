import React from 'react';
import {EverythingFragment, useObservationQuery} from '../hooks/useObservations';
import {ActivityIndicator, View, Text} from 'react-native';

export const Observation: React.FunctionComponent<{
  id: string;
}> = ({id}) => {
  const {
    isLoading,
    isError,
    data: observation,
    error,
  } = useObservationQuery({
    id: id,
  });

  if (isLoading || !observation) {
    return <ActivityIndicator />;
  }
  if (isError) {
    return (
      <View>
        <Text>{`Could not fetch observation ${id}: ${error}.`}</Text>
      </View>
    );
  }

  return <ObservationCard observation={observation.getSingleObservation} />;
};

export const ObservationCard: React.FunctionComponent<{
  observation: EverythingFragment;
}> = ({observation}) => {
  return (
    <View>
      <Text>
        `{observation.startDate}: {observation.name} - {observation.locationName} ... {JSON.stringify(observation.advancedFields)}`
      </Text>
    </View>
  );
};
