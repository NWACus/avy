import React from 'react';

import {StyleSheet} from 'react-native';
import RenderHTML from 'react-native-render-html';

import {Heading, HStack, Text, View, VStack} from 'native-base';

import {format, parseISO} from 'date-fns';

import {AvalancheDangerForecast, AvalancheForecastZone, DangerLevel, ElevationBandNames, ForecastPeriod, Product} from 'types/nationalAvalancheCenter';
import {AvalancheDangerTable} from 'components/AvalancheDangerTable';
import {AvalancheDangerIcon} from 'components/AvalancheDangerIcon';
import {AvalancheProblemCard} from 'components/AvalancheProblemCard';
import {Card} from 'components/Card';

interface AvalancheTabProps {
  windowWidth: number;
  zone: AvalancheForecastZone;
  forecast: Product;
}

const dateToString = (dateString: string | undefined): string => {
  if (!dateString) {
    return 'Unknown';
  }
  const date = parseISO(dateString);
  return format(date, `EEE, MMM d, yyyy h:mm a`);
};

export const AvalancheTab: React.FunctionComponent<AvalancheTabProps> = React.memo(({windowWidth, zone, forecast}) => {
  console.dir(forecast);
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
    <VStack space="4" bgColor={'#f0f2f5'}>
      <Card paddingTop={2} borderRadius={0} borderColor="white" header={<Heading>Avalanche Forecast</Heading>}>
        <HStack justifyContent="space-evenly" space="2">
          <VStack space="2" style={{flex: 1}}>
            <Text bold style={{textTransform: 'uppercase'}}>
              Issued
            </Text>
            <Text>{dateToString(forecast.published_time)}</Text>
          </VStack>
          <VStack space="2" style={{flex: 1}}>
            <Text bold style={{textTransform: 'uppercase'}}>
              Expires
            </Text>
            <Text>{dateToString(forecast.expires_time)}</Text>
          </VStack>
          <VStack space="2" style={{flex: 1}}>
            <Text bold style={{textTransform: 'uppercase'}}>
              Author
            </Text>
            <Text>{forecast.author || 'Unknown'}</Text>
          </VStack>
        </HStack>
      </Card>
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
});

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
