import React from 'react';
import {OverviewFragment, useObservationsQuery} from '../hooks/useObservations';
import {format, parseISO, sub} from 'date-fns';
import {ActivityIndicator, View, Text, FlatList, TouchableOpacity} from 'react-native';
import {HomeStackNavigationProps} from '../routes';
import {useNavigation} from '@react-navigation/native';

export const Observations: React.FunctionComponent<{
  center_id: string;
  date: string;
}> = ({center_id, date}) => {
  const currentDate: Date = parseISO(date);
  const startDate: string = format(sub(currentDate, {months: 1}), 'y-MM-dd');
  const endDate: string = format(currentDate, 'y-MM-dd');
  const {
    isLoading,
    isError,
    data: observations,
    error,
  } = useObservationsQuery({
    center: center_id,
    startDate: startDate,
    endDate: endDate,
  });

  if (isLoading || !observations) {
    return <ActivityIndicator />;
  }
  if (isError) {
    return (
      <View>
        <Text>{`Could not fetch ${center_id} observations: ${error}.`}</Text>
      </View>
    );
  }
  if (!observations.getObservationList || observations.getObservationList.length === 0) {
    return (
      <View>
        <Text>{`No observations were recorded for ${center_id} between ${startDate} and ${endDate}.`}</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={observations.getObservationList.map(observation => ({
        id: observation.id,
        observation: observation,
      }))}
      renderItem={({item}) => <ObservationSummaryCard observation={item.observation} />}
    />
  );
};

export const ObservationSummaryCard: React.FunctionComponent<{
  observation: OverviewFragment;
}> = ({observation}) => {
  const navigation = useNavigation<HomeStackNavigationProps>();
  return (
    <TouchableOpacity
      onPress={() => {
        navigation.navigate('observation', {
          id: observation.id,
        });
      }}>
      <View>
        <Text>
          `{observation.startDate}: {observation.name} - {observation.locationName}`
        </Text>
      </View>
    </TouchableOpacity>
  );
};
