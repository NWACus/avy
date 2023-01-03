import React from 'react';

import RenderHTML, {RenderHTMLProps} from 'react-native-render-html';

import {Heading, HStack, Text, useToken, VStack} from 'native-base';

import {format, parseISO} from 'date-fns';

import {AvalancheDangerForecast, AvalancheForecastZone, DangerLevel, ElevationBandNames, ForecastPeriod, Product} from 'types/nationalAvalancheCenter';
import {AvalancheDangerTable} from 'components/AvalancheDangerTable';
import {AvalancheDangerIcon} from 'components/AvalancheDangerIcon';
import {AvalancheProblemCard} from 'components/AvalancheProblemCard';
import {Card, CollapsibleCard} from 'components/Card';

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

  const [textColor] = useToken('colors', ['darkText']);
  const renderHTMLProps: Partial<RenderHTMLProps> = {
    contentWidth: windowWidth,
    defaultTextProps: {
      style: {
        fontSize: 16,
        color: textColor,
      },
    },
  };

  return (
    <VStack space="2" bgColor={'#f0f2f5'}>
      <Card marginTop={2} borderRadius={0} borderColor="white" header={<Heading>Avalanche Forecast</Heading>}>
        <HStack justifyContent="space-evenly" space="2">
          <VStack space="2" style={{flex: 1}}>
            <Text bold style={{textTransform: 'uppercase'}}>
              Issued
            </Text>
            <Text color="lightText">{dateToString(forecast.published_time)}</Text>
          </VStack>
          <VStack space="2" style={{flex: 1}}>
            <Text bold style={{textTransform: 'uppercase'}}>
              Expires
            </Text>
            <Text color="lightText">{dateToString(forecast.expires_time)}</Text>
          </VStack>
          <VStack space="2" style={{flex: 1}}>
            <Text bold style={{textTransform: 'uppercase'}}>
              Author
            </Text>
            <Text color="lightText">{forecast.author || 'Unknown'}</Text>
          </VStack>
        </HStack>
      </Card>
      <Card
        borderRadius={0}
        borderColor="white"
        header={
          <HStack space={2} alignItems="center">
            {/* TODO wrong icon here */}
            <AvalancheDangerIcon style={{height: 24}} level={highestDangerToday} />
            <Heading>The Bottom Line</Heading>
          </HStack>
        }>
        <RenderHTML source={{html: forecast.bottom_line}} {...renderHTMLProps} />
      </Card>
      <Card borderRadius={0} borderColor="white" header={<Heading>Avalanche Danger</Heading>}>
        <AvalancheDangerTable date={parseISO(forecast.published_time)} current={currentDanger} outlook={outlookDanger} elevation_band_names={elevationBandNames} />
      </Card>
      <CollapsibleCard startsCollapsed borderRadius={0} borderColor="white" header={<Heading>Avalanche Problems</Heading>}>
        {forecast.forecast_avalanche_problems.map((problem, index) => (
          <AvalancheProblemCard key={`avalanche-problem-${index}`} problem={problem} names={elevationBandNames} />
        ))}
      </CollapsibleCard>
      <CollapsibleCard startsCollapsed borderRadius={0} borderColor="white" header={<Heading>Forecast Discussion</Heading>}>
        <RenderHTML source={{html: forecast.hazard_discussion}} {...renderHTMLProps} />
      </CollapsibleCard>
      <Card borderRadius={0} borderColor="white" header={<Heading>Media</Heading>}>
        <Text>TBD!</Text>
      </Card>
    </VStack>
  );
});
