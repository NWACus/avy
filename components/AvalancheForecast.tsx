import React, {useEffect} from 'react';

import {ActivityIndicator, Alert, RefreshControl, ScrollView, StyleSheet, useWindowDimensions} from 'react-native';
import RenderHTML from 'react-native-render-html';
import {useNavigation} from '@react-navigation/native';

import {Heading, Text, View, VStack} from 'native-base';

import {parseISO} from 'date-fns';

import {
  AvalancheCenter,
  AvalancheDangerForecast,
  AvalancheForecastZone,
  AvalancheForecastZoneSummary,
  DangerLevel,
  ElevationBandNames,
  ForecastPeriod,
  Product,
} from 'types/nationalAvalancheCenter';
import {AvalancheDangerTable} from './AvalancheDangerTable';
import {AvalancheDangerIcon} from './AvalancheDangerIcon';
import {AvalancheProblemCard} from './AvalancheProblemCard';
import {TabControl} from 'components/TabControl';
import {useAvalancheForecast} from 'hooks/useAvalancheForecast';
import {useAvalancheCenterMetadata} from 'hooks/useAvalancheCenterMetadata';
import {useRefreshByUser} from 'hooks/useRefreshByUser';

export interface AvalancheForecastProps {
  zoneName: string;
  center_id: string;
  date: string;
  forecast_zone_id: number;
}

const renderAvalancheTab = (windowWidth: number, center: AvalancheCenter, zone: AvalancheForecastZone, forecast: Product) => {
  let currentDanger: AvalancheDangerForecast | undefined = forecast.danger.find(item => item.valid_day === ForecastPeriod.Current);
  if (!currentDanger || !currentDanger.upper) {
    // sometimes, we get an entry of nulls for today
    currentDanger = {
      lower: DangerLevel.None,
      middle: DangerLevel.None,
      upper: DangerLevel.None,
      valid_day: ForecastPeriod.Tomorrow,
    };
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

  const elevationBandNames: ElevationBandNames = zone.config.elevation_band_names;

  return (
    <VStack>
      <View style={styles.bound}>
        <AvalancheDangerIcon style={styles.icon} level={highestDangerToday} />
        <View style={styles.content}>
          <Text style={styles.title}>THE BOTTOM LINE</Text>
          <RenderHTML source={{html: forecast.bottom_line}} contentWidth={windowWidth} />
        </View>
      </View>
      <AvalancheDangerTable date={parseISO(forecast.published_time)} current={currentDanger} outlook={outlookDanger} elevation_band_names={elevationBandNames} />
      <Text style={styles.heading}>Avalanche Problems</Text>
      {forecast.forecast_avalanche_problems.map((problem, index) => (
        <AvalancheProblemCard key={`avalanche-problem-${index}`} problem={problem} names={elevationBandNames} />
      ))}
      <Text style={styles.heading}>Forecast Discussion</Text>
      <View style={styles.discussion}>
        <RenderHTML source={{html: forecast.hazard_discussion}} contentWidth={windowWidth} />
      </View>
      <Text style={styles.heading}>Media</Text>
    </VStack>
  );
};

const renderWeatherTab = () => {
  return <Heading>Weather coming soon</Heading>;
};

const renderObservationsTab = () => {
  return <Heading>Observations coming soon</Heading>;
};

export const AvalancheForecast: React.FunctionComponent<AvalancheForecastProps> = ({center_id, date, forecast_zone_id}: AvalancheForecastProps) => {
  const forecastDate: Date = parseISO(date);

  const {width: windowWidth} = useWindowDimensions();
  const {isLoading: isCenterLoading, isError: isCenterError, data: center, error: centerError, refetch: refetchCenter} = useAvalancheCenterMetadata(center_id);
  const {
    isLoading: isForecastLoading,
    isError: isForecastError,
    data: forecast,
    error: forecastError,
    refetch: refetchForecast,
  } = useAvalancheForecast(center_id, forecast_zone_id, forecastDate);
  const {isRefetchingByUser, refetchByUser} = useRefreshByUser(refetchCenter, refetchForecast);

  // When navigating from elsewhere in the app, the screen title should already
  // be set to the zone name. But if we warp directly to a forecast link, we
  // need to load the zone name dynamically.
  const navigation = useNavigation();
  useEffect(() => {
    if (forecast) {
      const thisZone: AvalancheForecastZoneSummary | undefined = forecast.forecast_zone.find(zone => zone.id === forecast_zone_id);
      if (thisZone) {
        navigation.setOptions({title: thisZone.name});
      }
    }
  }, [forecast, forecast_zone_id, navigation]);

  if (isForecastLoading || isCenterLoading || !center || !forecast) {
    return <ActivityIndicator />;
  }
  if (isForecastError || isCenterError) {
    return (
      <View>
        {isCenterError && <Text>{`Could not fetch ${center_id} properties: ${centerError?.message}.`}</Text>}
        {isForecastError && <Text>{`Could not fetch forecast for ${center_id} zone ${forecast_zone_id}: ${forecastError?.message}.`}</Text>}
        {/* TODO(brian): we should add a "Try again" button and have that invoke `refetchByUser` */}
      </View>
    );
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

  return (
    <ScrollView style={StyleSheet.absoluteFillObject} refreshControl={<RefreshControl refreshing={isRefetchingByUser} onRefresh={refetchByUser} />}>
      <TabControl
        backgroundColor="white"
        tabs={[
          {
            title: 'Avalanche',
            render: () => renderAvalancheTab(windowWidth, center, zone, forecast),
          },
          {
            title: 'Weather',
            render: () => renderWeatherTab(),
          },
          {
            title: 'Observations',
            render: () => renderObservationsTab(),
          },
        ]}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
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
