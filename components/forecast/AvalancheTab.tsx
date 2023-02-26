import React from 'react';

import {addDays} from 'date-fns';

import {Feather} from '@expo/vector-icons';
import {useNavigation} from '@react-navigation/native';
import {AvalancheDangerIcon} from 'components/AvalancheDangerIcon';
import {colorFor} from 'components/AvalancheDangerPyramid';
import {AvalancheDangerTable} from 'components/AvalancheDangerTable';
import {AvalancheProblemCard} from 'components/AvalancheProblemCard';
import {Card, CollapsibleCard} from 'components/content/Card';
import {Carousel} from 'components/content/carousel';
import {InfoTooltip} from 'components/content/InfoTooltip';
import {incompleteQueryState, QueryState} from 'components/content/QueryState';
import {HStack, View, VStack} from 'components/core';
import {AllCapsSm, AllCapsSmBlack, BodyBlack, bodySize, BodySmSemibold, Title3, Title3Black} from 'components/text';
import {HTML} from 'components/text/HTML';
import helpStrings from 'content/helpStrings';
import {toDate} from 'date-fns-tz';
import {useAvalancheForecast} from 'hooks/useAvalancheForecast';
import {useAvalancheWarning} from 'hooks/useAvalancheWarning';
import {HomeStackNavigationProps} from 'routes';
import {
  AvalancheCenter,
  AvalancheCenterID,
  AvalancheDangerForecast,
  AvalancheForecastZoneSummary,
  DangerLevel,
  ElevationBandNames,
  ForecastPeriod,
} from 'types/nationalAvalancheCenter';
import {isNotFound} from 'types/requests';
import {RequestedTime, utcDateToLocalTimeString} from 'utils/date';

interface AvalancheTabProps {
  elevationBandNames: ElevationBandNames;
  center_id: AvalancheCenterID;
  center: AvalancheCenter;
  requestedTime: RequestedTime;
  forecast_zone_id: number;
}

const HeaderWithTooltip = ({title, content}) => (
  // the icon style is designed to make the circle "i" look natural next to the
  // text - neither `center` nor `baseline` alignment look good on their own
  <HStack space={6} alignItems="center">
    <BodyBlack>{title}</BodyBlack>
    <InfoTooltip size={bodySize} title={title} content={content} style={{paddingBottom: 0, paddingTop: 1}} />
  </HStack>
);

export const AvalancheTab: React.FunctionComponent<AvalancheTabProps> = React.memo(({elevationBandNames, center_id, center, forecast_zone_id, requestedTime}) => {
  const forecastResult = useAvalancheForecast(center_id, center, forecast_zone_id, requestedTime);
  const forecast = forecastResult.data;
  const warningResult = useAvalancheWarning(center_id, forecast_zone_id, requestedTime);
  const warning = warningResult.data;

  // When navigating from elsewhere in the app, the screen title should already
  // be set to the zone name. But if we warp directly to a forecast link, we
  // need to load the zone name dynamically.
  const navigation = useNavigation<HomeStackNavigationProps>();
  React.useEffect(() => {
    if (forecast && !isNotFound(forecast)) {
      const thisZone: AvalancheForecastZoneSummary | undefined = forecast.forecast_zone.find(zone => zone.id === forecast_zone_id);
      if (thisZone) {
        navigation.setOptions({title: thisZone.name});
      }
    }
  }, [forecast, forecast_zone_id, navigation]);

  if (incompleteQueryState(forecastResult, warningResult) || isNotFound(forecast)) {
    return <QueryState results={[forecastResult, warningResult]} />;
  }

  // very much not clear why sometimes (perhaps after hydrating?) the time fields are strings, not dates
  const publishedTime = typeof forecast.published_time === 'string' ? toDate(forecast.published_time) : forecast.published_time;

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

  return (
    <VStack space={8} bgColor={'#f0f2f5'}>
      <Card marginTop={1} borderRadius={0} borderColor="white" header={<Title3Black>Avalanche Forecast</Title3Black>}>
        <HStack justifyContent="space-evenly" space={8}>
          <VStack space={8} style={{flex: 1}}>
            <AllCapsSmBlack>Issued</AllCapsSmBlack>
            <AllCapsSm style={{textTransform: 'none'}} color="text.secondary">
              {utcDateToLocalTimeString(forecast.published_time)}
            </AllCapsSm>
          </VStack>
          <VStack space={8} style={{flex: 1}}>
            <AllCapsSmBlack>Expires</AllCapsSmBlack>
            <AllCapsSm style={{textTransform: 'none'}} color="text.secondary">
              {utcDateToLocalTimeString(forecast.expires_time)}
            </AllCapsSm>
          </VStack>
          <VStack space={8} style={{flex: 1}}>
            <AllCapsSmBlack>Author</AllCapsSmBlack>
            <AllCapsSm style={{textTransform: 'none'}} color="text.secondary">
              {forecast.author || 'Unknown'}
              {'\n'}
            </AllCapsSm>
          </VStack>
        </HStack>
      </Card>
      {warning.expires_time && (
        <View mx={16} py={16} borderRadius={10} borderColor={'#333333'} backgroundColor={'#333333'}>
          <HStack ml={12} space={16}>
            <View backgroundColor={colorFor(DangerLevel.High).string()} width={4} height={'100%'} borderRadius={12}></View>
            <VStack space={16} pr={8}>
              <VStack space={8}>
                <HStack space={8} alignItems={'flex-start'}>
                  <Feather name="alert-triangle" size={24} color={colorFor(DangerLevel.High).string()} />
                  <Title3Black color="white">AVALANCHE WARNING</Title3Black>
                </HStack>
                <VStack>
                  <HStack px={4} space={2}>
                    <BodySmSemibold color="white">Issued:</BodySmSemibold>
                    <AllCapsSm style={{textTransform: 'none'}} color="white">
                      {utcDateToLocalTimeString(warning.published_time)}
                    </AllCapsSm>
                  </HStack>
                  <HStack px={4} space={2}>
                    <BodySmSemibold color="white">Expires:</BodySmSemibold>
                    <AllCapsSm style={{textTransform: 'none'}} color="white">
                      {utcDateToLocalTimeString(warning.expires_time)}
                    </AllCapsSm>
                  </HStack>
                </VStack>
              </VStack>
              <View pr={8}>
                <Title3 color={'white'}>{warning.bottom_line}</Title3>
              </View>
            </VStack>
          </HStack>
        </View>
      )}
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
        <AvalancheDangerTable date={addDays(publishedTime, 1)} forecast={currentDanger} elevation_band_names={elevationBandNames} size={'main'} />
      </Card>
      <CollapsibleCard startsCollapsed borderRadius={0} borderColor="white" header={<HeaderWithTooltip title="Outlook" content={helpStrings.avalancheDangerOutlook} />}>
        <AvalancheDangerTable date={addDays(publishedTime, 2)} forecast={outlookDanger} elevation_band_names={elevationBandNames} size={'outlook'} />
      </CollapsibleCard>
      {forecast.forecast_avalanche_problems.map((problem, index) => (
        <CollapsibleCard
          key={`avalanche-problem-${index}-card`}
          startsCollapsed
          borderRadius={0}
          borderColor="white"
          header={<HeaderWithTooltip title={`Avalanche Problem #${index + 1}`} content={helpStrings.avalancheProblem} />}>
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
