import React from 'react';

import {HStack} from 'native-base';

import {addDays, parseISO} from 'date-fns';

import {AvalancheDangerForecast, AvalancheForecastZone, DangerLevel, ElevationBandNames, ForecastPeriod, Product} from 'types/nationalAvalancheCenter';
import {AvalancheDangerTable} from 'components/AvalancheDangerTable';
import {AvalancheDangerIcon} from 'components/AvalancheDangerIcon';
import {AvalancheProblemCard} from 'components/AvalancheProblemCard';
import {Card, CollapsibleCard} from 'components/Card';
import {HTML} from 'components/text/HTML';
import {utcDateToLocalTimeString} from 'utils/date';
import {AllCapsSm, AllCapsSmBlack, Body, BodyBlack, Title3Black} from 'components/text';
import {VStack} from 'components/core';

interface AvalancheTabProps {
  zone: AvalancheForecastZone;
  forecast: Product;
}

export const AvalancheTab: React.FunctionComponent<AvalancheTabProps> = React.memo(({zone, forecast}) => {
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
    <VStack space={8} bgColor={'#f0f2f5'}>
      <Card marginTop={2} borderRadius={0} borderColor="white" header={<Title3Black>Avalanche Forecast</Title3Black>}>
        <HStack justifyContent="space-evenly" space="2">
          <VStack space={8} style={{flex: 1}}>
            <AllCapsSmBlack>Issued</AllCapsSmBlack>
            <AllCapsSm style={{textTransform: 'none'}} color="lightText">
              {utcDateToLocalTimeString(forecast.published_time)}
            </AllCapsSm>
          </VStack>
          <VStack space={8} style={{flex: 1}}>
            <AllCapsSmBlack>Expires</AllCapsSmBlack>
            <AllCapsSm style={{textTransform: 'none'}} color="lightText">
              {utcDateToLocalTimeString(forecast.expires_time)}
            </AllCapsSm>
          </VStack>
          <VStack space={8} style={{flex: 1}}>
            <AllCapsSmBlack>Author</AllCapsSmBlack>
            <AllCapsSm style={{textTransform: 'none'}} color="lightText">
              {forecast.author || 'Unknown'}
            </AllCapsSm>
          </VStack>
        </HStack>
      </Card>
      <Card
        borderRadius={0}
        borderColor="white"
        header={
          <HStack space={2} alignItems="center">
            <AvalancheDangerIcon style={{height: 32}} level={highestDangerToday} />
            <BodyBlack>The Bottom Line</BodyBlack>
          </HStack>
        }>
        <HTML source={{html: forecast.bottom_line}} />
      </Card>
      <Card borderRadius={0} borderColor="white" header={<BodyBlack>Avalanche Danger</BodyBlack>}>
        <AvalancheDangerTable date={parseISO(forecast.published_time)} forecast={currentDanger} elevation_band_names={elevationBandNames} size={'main'} />
      </Card>
      <CollapsibleCard startsCollapsed borderRadius={0} borderColor="white" header={<BodyBlack>Outlook</BodyBlack>}>
        <AvalancheDangerTable date={addDays(parseISO(forecast.published_time), 1)} forecast={outlookDanger} elevation_band_names={elevationBandNames} size={'outlook'} />
      </CollapsibleCard>
      {forecast.forecast_avalanche_problems.map((problem, index) => (
        <CollapsibleCard
          key={`avalanche-problem-${index}-card`}
          startsCollapsed
          borderRadius={0}
          borderColor="white"
          header={<BodyBlack>Avalanche Problem #{index + 1}</BodyBlack>}>
          <AvalancheProblemCard key={`avalanche-problem-${index}`} problem={problem} names={elevationBandNames} />
        </CollapsibleCard>
      ))}
      <CollapsibleCard startsCollapsed borderRadius={0} borderColor="white" header={<BodyBlack>Forecast Discussion</BodyBlack>}>
        <HTML source={{html: forecast.hazard_discussion}} />
      </CollapsibleCard>
      <Card borderRadius={0} borderColor="white" header={<BodyBlack>Media</BodyBlack>}>
        <Body>TBD!</Body>
      </Card>
    </VStack>
  );
});
