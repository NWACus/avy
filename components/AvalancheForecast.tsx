import React from 'react';

import {ActivityIndicator, Alert, RefreshControl, ScrollView, StyleSheet, Text, useWindowDimensions, View} from 'react-native';
import RenderHTML from 'react-native-render-html';
import {useNavigation} from '@react-navigation/native';

import {parseISO} from 'date-fns';

import {AvalancheDangerForecast, AvalancheForecastZone, AvalancheForecastZoneSummary, DangerLevel, ElevationBandNames, ForecastPeriod} from '../types/nationalAvalancheCenter';
import {AvalancheDangerTable} from './AvalancheDangerTable';
import {AvalancheDangerIcon} from './AvalancheDangerIcon';
import {AvalancheProblemCard} from './AvalancheProblemCard';
import {useAvalancheForecast} from '../hooks/useAvalancheForecast';
import {useAvalancheCenterMetadata} from '../hooks/useAvalancheCenterMetadata';
import {useRefreshByUser} from '../hooks/useRefreshByUser';

export interface AvalancheForecastProps {
  center_id: string;
  date: string;
  forecast_zone_id: number;
}

export const AvalancheForecast: React.FunctionComponent<AvalancheForecastProps> = ({center_id, date, forecast_zone_id}: AvalancheForecastProps) => {
  const forecastDate: Date = parseISO(date);
  const navigation = useNavigation();

  const {width} = useWindowDimensions();
  const {isLoading: isCenterLoading, isError: isCenterError, data: center, error: centerError, refetch: refetchCenter} = useAvalancheCenterMetadata(center_id);
  const {
    isLoading: isForecastLoading,
    isError: isForecastError,
    data: forecast,
    error: forecastError,
    refetch: refetchForecast,
  } = useAvalancheForecast(center_id, forecast_zone_id, forecastDate);
  const {isRefetchingByUser, refetchByUser} = useRefreshByUser(refetchCenter, refetchForecast);

  React.useEffect(() => {
    if (forecast) {
      const thisZone: AvalancheForecastZoneSummary | undefined = forecast.forecast_zone.find(zone => zone.id === forecast_zone_id);
      if (thisZone) {
        navigation.setOptions({title: thisZone.name});
      }
    }
  }, [forecast]); // eslint-disable-line react-hooks/exhaustive-deps

  if (isForecastLoading || isCenterLoading || !center || !forecast) {
    return <ActivityIndicator />;
  }
  if (isForecastError || isCenterError) {
    return (
      <View>
        {isCenterError && <Text>{`Could not fetch ${center_id} properties: ${centerError?.message}.`}</Text>}
        {isForecastError && <Text>{`Could not fetch forecast for ${center_id} zone ${forecast_zone_id}: ${forecastError?.message}.`}</Text>}
      </View>
    );
  }

  const currentDanger: AvalancheDangerForecast | undefined = forecast.danger.find(item => item.valid_day === ForecastPeriod.Current);
  if (!currentDanger) {
    Alert.alert('No danger recorded.', '', [
      {
        text: 'OK',
      },
    ]);
    return (
      <View>
        <Text>{'No danger recorded'}</Text>
      </View>
    );
  }
  const highestDangerToday: DangerLevel = Math.max(currentDanger.lower, currentDanger.middle, currentDanger.upper);

  let outlookDanger: AvalancheDangerForecast | undefined = forecast.danger.find(item => item.valid_day === ForecastPeriod.Tomorrow);
  if (!outlookDanger || !outlookDanger.upper) {
    // sometimes, we get an entry of nulls for tomorrow
    outlookDanger = {
      lower: DangerLevel.None,
      middle: DangerLevel.None,
      upper: DangerLevel.None,
      valid_day: ForecastPeriod.Tomorrow,
    };
  }

  const zone: AvalancheForecastZone | undefined = center.zones.find(item => item.id === forecast_zone_id);
  if (!zone) {
    const message = `No such zone ${forecast_zone_id} for center ${center_id}.`;
    Alert.alert('Avalanche forecast zone not found', message, [
      {
        text: 'OK',
      },
    ]);
    return (
      <View>
        <Text>{message}</Text>
      </View>
    );
  }
  const elevationBandNames: ElevationBandNames = zone.config.elevation_band_names;

  return (
    <ScrollView style={styles.view} refreshControl={<RefreshControl refreshing={isRefetchingByUser} onRefresh={refetchByUser} />}>
      <View>
        <Text style={styles.title}>{zone.name}</Text>
        <View style={styles.bound}>
          <AvalancheDangerIcon style={styles.icon} level={highestDangerToday} />
          <View style={styles.content}>
            <Text style={styles.title}>THE BOTTOM LINE</Text>
            <RenderHTML source={{html: forecast.bottom_line}} contentWidth={width} />
          </View>
        </View>
      </View>
      <AvalancheDangerTable date={parseISO(forecast.published_time)} current={currentDanger} outlook={outlookDanger} elevation_band_names={elevationBandNames} />
      <Text style={styles.heading}>Avalanche Problems</Text>
      {forecast.forecast_avalanche_problems.map((problem, index) => (
        <AvalancheProblemCard key={`avalanche-problem-${index}`} problem={problem} names={elevationBandNames} />
      ))}
      <Text style={styles.heading}>Forecast Discussion</Text>
      <View style={styles.discussion}>
        <RenderHTML source={{html: forecast.hazard_discussion}} contentWidth={width} />
      </View>
      <Text style={styles.heading}>Media</Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  view: {
    ...StyleSheet.absoluteFillObject,
  },
  icon: {
    position: 'absolute',
    top: -25,
    left: -25,
    height: 50,
  },
  bound: {
    margin: 25,
    borderStyle: 'solid',
    borderWidth: 1.2,
    borderColor: 'rgb(200,202,206)',
    shadowOffset: {width: 1, height: 2},
    shadowOpacity: 0.8,
    shadowColor: 'rgb(157,162,165)',
  },
  content: {
    flexDirection: 'column',
    paddingTop: 15,
    paddingLeft: 15,
    paddingBottom: 0,
    paddingRight: 5,
  },
  title: {
    fontWeight: 'bold',
  },
  heading: {
    textTransform: 'uppercase',
    fontWeight: 'bold',
    paddingBottom: 10,
    marginHorizontal: 10,
  },
  discussion: {
    flexDirection: 'column',
    paddingTop: 0,
    paddingLeft: 10,
    paddingBottom: 0,
    paddingRight: 10,
  },
});
