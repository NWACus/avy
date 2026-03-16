import React, {useCallback, useState} from 'react';

import {addDays, formatDistanceToNow, isAfter} from 'date-fns';

import Ionicons from '@expo/vector-icons/Ionicons';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import * as Sentry from '@sentry/react-native';
import {AvalancheDangerIcon} from 'components/AvalancheDangerIcon';
import {AvalancheDangerTable} from 'components/AvalancheDangerTable';
import {colorFor} from 'components/AvalancheDangerTriangle';
import {AvalancheProblemCard} from 'components/AvalancheProblemCard';
import {InlineDangerScale} from 'components/DangerScale';
import {Card, CollapsibleCard} from 'components/content/Card';
import {InfoTooltip} from 'components/content/InfoTooltip';
import {NotFound, QueryState, incompleteQueryState} from 'components/content/QueryState';
import {MediaCarousel} from 'components/content/carousel/MediaCarousel';
import {HStack, VStack, View} from 'components/core';
import {AllCapsSm, AllCapsSmBlack, Body, BodyBlack, BodySemibold, BodySm, BodySmBlack, BodySmSemibold, Title3Black} from 'components/text';
import {HTML} from 'components/text/HTML';
import helpStrings from 'content/helpStrings';
import {toDate} from 'date-fns-tz';
import {useAvalancheCenterMetadata} from 'hooks/useAvalancheCenterMetadata';
import {useAvalancheForecast} from 'hooks/useAvalancheForecast';
import {useAvalancheWarning} from 'hooks/useAvalancheWarning';
import {useRefresh} from 'hooks/useRefresh';
import {useToggle} from 'hooks/useToggle';
import {usePostHog} from 'posthog-react-native';
import {RefreshControl, ScrollView, TouchableOpacity} from 'react-native';
import Collapsible from 'react-native-collapsible';
import Toast from 'react-native-toast-message';
import {HomeStackNavigationProps} from 'routes';
import {colorLookup} from 'theme';
import {COLORS} from 'theme/colors';
import {
  AvalancheCenterID,
  AvalancheDangerForecast,
  AvalancheForecastZone,
  AvalancheForecastZoneStatus,
  AvalancheForecastZoneSummary,
  DangerLevel,
  ForecastPeriod,
  ProductType,
  Special,
  Warning,
  Watch,
} from 'types/nationalAvalancheCenter';
import {NotFoundError} from 'types/requests';
import {RequestedTimeString, parseRequestedTimeString, utcDateToLocalDateString, utcDateToLocalTimeString} from 'utils/date';

const HeaderWithTooltip: React.FunctionComponent<{
  title: string;
  content: string;
}> = ({title, content}) => (
  // the icon style is designed to make the circle "i" look natural next to the
  // text - neither `center` nor `baseline` alignment look good on their own
  <HStack space={6} alignItems="center">
    <BodyBlack numberOfLines={1}>{title}</BodyBlack>
    <InfoTooltip size={20} title={title} content={content} style={{paddingBottom: 0, paddingTop: 1}} />
  </HStack>
);

export const AvalancheTab: React.FunctionComponent<{
  center_id: AvalancheCenterID;
  requestedTime: RequestedTimeString;
  forecast_zone_id: number;
}> = ({center_id, forecast_zone_id, requestedTime: requestedTimeString}) => {
  const requestedTime = parseRequestedTimeString(requestedTimeString);
  const centerResult = useAvalancheCenterMetadata(center_id);
  const center = centerResult.data;
  const forecastResult = useAvalancheForecast(center_id, forecast_zone_id, requestedTime, center);
  const forecast = forecastResult.data;
  const warningResult = useAvalancheWarning(center_id, forecast_zone_id, requestedTime);
  const warning = warningResult.data;
  const {isRefreshing, refresh} = useRefresh(forecastResult.refetch, warningResult.refetch);
  const onRefresh = useCallback(() => void refresh(), [refresh]);
  const postHog = usePostHog();

  // When navigating from elsewhere in the app, the screen title should already
  // be set to the zone name. But if we warp directly to a forecast link, we
  // need to load the zone name dynamically.
  const navigation = useNavigation<HomeStackNavigationProps>();
  const [zoneName, setZoneName] = useState('');
  React.useEffect(() => {
    if (forecast) {
      const thisZone: AvalancheForecastZoneSummary | undefined = forecast.forecast_zone.find(zone => zone.id === forecast_zone_id);
      if (thisZone) {
        navigation.setOptions({title: thisZone.name});
        setZoneName(thisZone.name);
      }
    }
  }, [forecast, forecast_zone_id, navigation]);

  useFocusEffect(
    useCallback(() => {
      if (forecast?.expires_time) {
        const expires_time = new Date(forecast.expires_time);
        if (isAfter(new Date(), expires_time)) {
          setTimeout(
            // entirely unclear why this needs to be in a setTimeout, but nothing works without it
            () =>
              Toast.show({
                type: 'error',
                text1: `This avalanche forecast expired ${formatDistanceToNow(expires_time)} ago.`,
                autoHide: false,
                position: 'bottom',
                onPress: () => Toast.hide(),
              }),
            0,
          );
        }
      }
      return () => Toast.hide();
    }, [forecast]),
  );

  const recordAnalytics = useCallback(() => {
    if (postHog && center_id && zoneName) {
      postHog.screen('avalancheForecastTab', {
        center: center_id,
        zone: zoneName,
      });
    }
  }, [postHog, center_id, zoneName]);
  useFocusEffect(recordAnalytics);

  if (incompleteQueryState(centerResult, forecastResult, warningResult) || !center || !forecast || !warning) {
    return <QueryState results={[centerResult, forecastResult, warningResult]} />;
  }

  const zone: AvalancheForecastZone | undefined = center.zones.find(item => item.id === forecast_zone_id);
  if (!zone || zone.status === AvalancheForecastZoneStatus.Disabled) {
    const message = `Avalanche center ${center_id} had no zone with id ${forecast_zone_id}`;
    if (!zone) {
      // If the zone is intentionally disabled, don't log to Sentry
      Sentry.captureException(new Error(message));
    }
    return <NotFound what={[new NotFoundError(message, 'avalanche forecast zone')]} />;
  }
  const elevationBandNames = zone.config.elevation_band_names ?? {
    lower: 'Below Treeline',
    middle: 'Near Treeline',
    upper: 'Above Treeline',
  };

  const publishedTime = forecast.published_time ? toDate(forecast.published_time) : new Date();

  // when a forecast center publishes in the morning, they want 'current' danger to mean today and 'tomorrow' to mean tomorrow
  // however, when the publication is in the evening, 'current' means tomorrow and 'tomorrow' means two days from now
  const forecastOffset = publishedTime.getHours() < 12 ? 0 : 1;

  let currentDanger: AvalancheDangerForecast | undefined = undefined;
  let outlookDanger: AvalancheDangerForecast | undefined = undefined;
  let highestDangerToday: DangerLevel = DangerLevel.None;
  if (forecast.product_type === ProductType.Forecast) {
    currentDanger = forecast.danger?.find(item => item.valid_day === ForecastPeriod.Current);
    if (currentDanger) {
      highestDangerToday = Math.max(currentDanger.lower, currentDanger.middle, currentDanger.upper);
    }
    outlookDanger = forecast.danger.find(item => item.valid_day === ForecastPeriod.Tomorrow);
  }

  return (
    <ScrollView refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}>
      <VStack space={8} backgroundColor={colorLookup('primary.background')}>
        <Card
          borderRadius={0}
          borderColor="white"
          header={<Title3Black>{forecast.product_type === ProductType.Forecast ? 'Avalanche Forecast' : 'General Avalanche Information'}</Title3Black>}>
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
        {warning.data && warning.data.expires_time && <WarningCard warning={warning.data} />}
        {forecast.bottom_line && (
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
        )}
        {forecast.product_type === ProductType.Forecast && (
          <Card borderRadius={0} borderColor="white" header={<HeaderWithTooltip title="Avalanche Danger" content={helpStrings.avalancheDanger} />}>
            <AvalancheDangerTable date={addDays(publishedTime, forecastOffset)} forecast={currentDanger} elevation_band_names={elevationBandNames} size={'main'} />
          </Card>
        )}
        {forecast.product_type === ProductType.Forecast && (
          <CollapsibleCard
            identifier={'outlookDangerTable'}
            startsCollapsed
            borderRadius={0}
            borderColor="white"
            header={<BodySmBlack>{utcDateToLocalDateString(addDays(publishedTime, forecastOffset + 1))}</BodySmBlack>}
            noDivider={true}>
            <AvalancheDangerTable forecast={outlookDanger} size={'outlook'} />
          </CollapsibleCard>
        )}
        {forecast.product_type === ProductType.Forecast && (
          <Card borderRadius={0} borderColor="white" header={<HeaderWithTooltip title="Danger Scale" content={helpStrings.dangerScale} />} noDivider={true}>
            <InlineDangerScale />
          </Card>
        )}
        {forecast.product_type === ProductType.Forecast &&
          forecast.forecast_avalanche_problems &&
          forecast.forecast_avalanche_problems.map((problem, index) => (
            <CollapsibleCard
              identifier={'avalancheProblem'}
              startsCollapsed={false}
              key={`avalanche-problem-${index}-card`}
              borderRadius={0}
              borderColor="white"
              header={<HeaderWithTooltip title={`Problem #${index + 1}: ${problem.name}`} content={helpStrings.avalancheProblem} />}>
              <AvalancheProblemCard key={`avalanche-problem-${index}`} problem={problem} names={elevationBandNames} />
            </CollapsibleCard>
          ))}
        {forecast.hazard_discussion && (
          <CollapsibleCard identifier={'hazardDiscussion'} startsCollapsed={false} borderRadius={0} borderColor="white" header={<BodyBlack>Forecast Discussion</BodyBlack>}>
            <HTML source={{html: forecast.hazard_discussion}} />
          </CollapsibleCard>
        )}
        {forecast.media && forecast.media.length > 0 && (
          <Card borderRadius={0} borderColor="white" header={<BodyBlack>Media</BodyBlack>} noDivider>
            <MediaCarousel thumbnailHeight={160} thumbnailAspectRatio={1.3} mediaItems={forecast.media} />
          </Card>
        )}
        <View height={16} />
      </VStack>
    </ScrollView>
  );
};

const WarningCard: React.FunctionComponent<{warning: Warning | Watch | Special}> = ({warning}) => {
  const [isCollapsed, {toggle: toggleCollapsed}] = useToggle(true);
  const {accentColor, title} = assetsForType(warning.product_type);

  return (
    <View mx={16} py={16} borderRadius={10} borderColor={colorLookup('modal.background')} backgroundColor={colorLookup('modal.background')}>
      <HStack mx={12} space={16} alignItems={'flex-start'}>
        <View backgroundColor={accentColor} width={8} height={'100%'} borderRadius={12}></View>
        <VStack space={16} flex={1}>
          <VStack space={8}>
            <HStack space={8} alignItems={'flex-start'}>
              <Ionicons name="alert-circle-outline" size={24} color={accentColor} />
              <Title3Black color="white">{title}</Title3Black>
            </HStack>
            <VStack>
              <HStack pr={4} space={2}>
                <BodySmSemibold color="white">Issued:</BodySmSemibold>
                <BodySm color="white">{utcDateToLocalTimeString(warning.published_time)}</BodySm>
              </HStack>
              <HStack pr={4} space={2}>
                <BodySmSemibold color="white">Expires:</BodySmSemibold>
                <BodySm color="white">{utcDateToLocalTimeString(warning.expires_time)}</BodySm>
              </HStack>
            </VStack>
          </VStack>
          <View flex={1}>
            <BodySemibold color={'white'}>{warning.bottom_line}</BodySemibold>
          </View>
          <Collapsible collapsed={isCollapsed} renderChildrenCollapsed>
            <VStack space={8} pt={8}>
              <View mr={8} flex={1}>
                <VStack px={4} space={2}>
                  <BodySemibold color="white">What:</BodySemibold>
                  <Body style={{textTransform: 'none'}} color="white">
                    {warning.hazard_discussion}
                  </Body>
                </VStack>
                <VStack px={4} space={2}>
                  <BodySemibold color="white">Where:</BodySemibold>
                  <Body style={{textTransform: 'none'}} color="white">
                    {warning.affected_area}
                  </Body>
                </VStack>
                <VStack px={4} space={2}>
                  <BodySemibold color="white">Why:</BodySemibold>
                  <Body style={{textTransform: 'none'}} color="white">
                    {warning.reason}
                  </Body>
                </VStack>
              </View>
            </VStack>
          </Collapsible>
        </VStack>
        <TouchableOpacity onPress={toggleCollapsed}>
          <HStack mr={12} justifyContent="space-between" alignItems="center">
            <Ionicons name={isCollapsed ? 'chevron-down' : 'chevron-up'} color={'white'} backgroundColor={colorLookup('modal.background')} size={24} />
          </HStack>
        </TouchableOpacity>
      </HStack>
    </View>
  );
};

const assetsForType = (productType: ProductType.Warning | ProductType.Watch | ProductType.Special): {title: string; accentColor: string} => {
  switch (productType) {
    case ProductType.Warning:
      return {
        title: `Avalanche Warning`,
        accentColor: colorFor(DangerLevel.High).toString(),
      };
    case ProductType.Watch:
      return {
        title: `Avalanche Watch`,
        accentColor: colorFor(DangerLevel.Considerable).toString(),
      };
    case ProductType.Special:
      return {
        title: `Special Bulletin`,
        accentColor: COLORS.primary.toString(),
      };
  }
  const invalid: never = productType;
  throw new Error(`Unknown product type: ${JSON.stringify(invalid)}`);
};
