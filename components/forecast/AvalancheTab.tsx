import React from 'react';

import {addDays} from 'date-fns';

import {AvalancheDangerForecast, AvalancheForecastZone, DangerLevel, ElevationBandNames, ForecastPeriod, Product} from 'types/nationalAvalancheCenter';
import {AvalancheDangerTable} from 'components/AvalancheDangerTable';
import {AvalancheDangerIcon} from 'components/AvalancheDangerIcon';
import {AvalancheProblemCard} from 'components/AvalancheProblemCard';
import {Card, CollapsibleCard} from 'components/content/Card';
import {HTML} from 'components/text/HTML';
import {utcDateToLocalTimeString} from 'utils/date';
import {AllCapsSm, AllCapsSmBlack, BodyBlack, bodySize, Title3Black} from 'components/text';
import {HStack, View, VStack} from 'components/core';
import {Carousel} from 'components/content/carousel';
import {InfoTooltip} from 'components/content/InfoTooltip';
import helpStrings from 'content/helpStrings';

interface AvalancheTabProps {
  zone: AvalancheForecastZone;
  forecast: Product;
}

const HeaderWithTooltip = ({title, content}) => (
  // the icon style is designed to make the circle "i" look natural next to the
  // text - neither `center` nor `baseline` alignment look good on their own
  <HStack space={6} alignItems="center">
    <BodyBlack>{title}</BodyBlack>
    <InfoTooltip size={bodySize} title={title} content={content} style={{paddingBottom: 0, paddingTop: 1}} />
  </HStack>
);

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
      <Card marginTop={1} borderRadius={0} borderColor="white" header={<Title3Black>Avalanche Forecast</Title3Black>}>
        <HStack justifyContent="space-evenly" space={8}>
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
              {'\n'}
            </AllCapsSm>
          </VStack>
        </HStack>
      </Card>
      <Card
        borderRadius={0}
        borderColor="white"
        header={
          <HStack space={8} alignItems="center">
            <AvalancheDangerIcon style={{height: 32}} level={highestDangerToday} />
            <BodyBlack>The Bottom Line</BodyBlack>
          </HStack>
        }>
        <HTML source={{html: forecast.bottom_line}} />
      </Card>
      <Card borderRadius={0} borderColor="white" header={<HeaderWithTooltip title="Avalanche Danger" content={helpStrings.avalancheDanger} />}>
        <AvalancheDangerTable date={forecast.published_time} forecast={currentDanger} elevation_band_names={elevationBandNames} size={'main'} />
      </Card>
      <CollapsibleCard startsCollapsed borderRadius={0} borderColor="white" header={<HeaderWithTooltip title="Outlook" content={helpStrings.avalancheDangerOutlook} />}>
        <AvalancheDangerTable date={addDays(forecast.published_time, 1)} forecast={outlookDanger} elevation_band_names={elevationBandNames} size={'outlook'} />
      </CollapsibleCard>
      {forecast.forecast_avalanche_problems.map((problem, index) => (
        <CollapsibleCard
          key={`avalanche-problem-${index}-card`}
          startsCollapsed
          borderRadius={0}
          borderColor="white"
          header={<HeaderWithTooltip title="Avalanche Problems" content={helpStrings.avalancheProblem} />}>
          <AvalancheProblemCard key={`avalanche-problem-${index}`} problem={problem} names={elevationBandNames} />
        </CollapsibleCard>
      ))}
      <CollapsibleCard startsCollapsed borderRadius={0} borderColor="white" header={<BodyBlack>Forecast Discussion</BodyBlack>}>
        <HTML source={{html: forecast.hazard_discussion}} />
      </CollapsibleCard>
      {forecast.media && (
        <Card borderRadius={0} borderColor="white" header={<BodyBlack>Media</BodyBlack>}>
          <Carousel thumbnailHeight={160} thumbnailAspectRatio={1.3} media={forecast.media} displayCaptions={false} />
        </Card>
      )}
      <View height={16} />
    </VStack>
  );
});
