import {CompositeNavigationProp, useFocusEffect, useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import * as Sentry from '@sentry/react-native';
import {ActionList} from 'components/content/ActionList';
import {Card, CollapsibleCard} from 'components/content/Card';
import {NotFound, QueryState, incompleteQueryState} from 'components/content/QueryState';
import {HStack, VStack} from 'components/core';
import {NWACWeatherZoneForecast} from 'components/forecast/WeatherTab/NWACWeatherTab/NWACWeatherZoneForecast';
import {AllCapsSm, AllCapsSmBlack, BodySm, Title3Black} from 'components/text';
import {HTML} from 'components/text/HTML';
import {NWACStationsByZone, ZoneWithWeatherStations} from 'components/weather_data/NWACWeatherStationList';
import {useAllMapLayers} from 'hooks/useAllMapLayers';
import {useAnalytics} from 'hooks/useAnalytics';
import {useAvalancheCenterMetadata} from 'hooks/useAvalancheCenterMetadata';
import {useNWACWeatherForecast} from 'hooks/useNWACWeatherForecast';
import {useRefresh} from 'hooks/useRefresh';
import {useWeatherStationsMetadata} from 'hooks/useWeatherStationsMetadata';
import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {RefreshControl, ScrollView} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {MainStackParamList, TabNavigationProps} from 'routes';
import {colorLookup} from 'theme';
import {AvalancheCenterID, AvalancheForecastZone, WeatherStationSource, mapFeaturesForCenter} from 'types/nationalAvalancheCenter';
import {issuanceLabel, zonesFor} from 'types/nwacWeather/nwacWeatherFormat';
import {windowShowing} from 'types/nwacWeather/nwacWeatherWindow';
import {NotFoundError} from 'types/requests';
import {RequestedTime, formatRequestedTime, utcDateToLocalTimeString} from 'utils/date';

type ForecastNavigationProp = CompositeNavigationProp<NativeStackNavigationProp<MainStackParamList, 'forecast'>, TabNavigationProps>;

interface NWACWeatherTabProps {
  zone: AvalancheForecastZone;
  center_id: AvalancheCenterID;
  requestedTime: RequestedTime;
}

export const nwacWeatherWindowToShow = <Window extends {startsAt: string; issuance: number}>(windows: Window[], issuances: {issuedAt: string}[], now: Date): Window => {
  const issuedAtOf = (forecastWindow: Window) => new Date(issuances[forecastWindow.issuance].issuedAt).getTime();
  const issued = windows.filter(forecastWindow => issuedAtOf(forecastWindow) <= now.getTime());
  if (issued.length === 0) {
    return windowShowing(windows, now);
  }
  const newestIssuedAt = Math.max(...issued.map(issuedAtOf));
  return windowShowing(
    issued.filter(forecastWindow => issuedAtOf(forecastWindow) === newestIssuedAt),
    now,
  );
};

export const NWACWeatherTab: React.FC<NWACWeatherTabProps> = ({zone, center_id, requestedTime}) => {
  const insets = useSafeAreaInsets();
  const avalancheCenterMetadataResult = useAvalancheCenterMetadata(center_id);
  const metadata = avalancheCenterMetadataResult.data;
  const nwacForecastResult = useNWACWeatherForecast(zone.id, requestedTime);
  const nwacForecast = nwacForecastResult.data;
  const mapLayerResult = useAllMapLayers(requestedTime);
  const mapLayer = mapLayerResult.data;
  const weatherStationsResult = useWeatherStationsMetadata(center_id, metadata?.widget_config.stations?.token);
  const weatherStations = weatherStationsResult.data;
  const [stationsByZone, setStationsByZone] = useState<ZoneWithWeatherStations[]>([]);
  const {isRefreshing, refresh} = useRefresh(nwacForecastResult.refetch, avalancheCenterMetadataResult.refetch, mapLayerResult.refetch);
  const onRefresh = useCallback(() => {
    void refresh();
  }, [refresh]);

  const navigation = useNavigation<ForecastNavigationProp>();
  useEffect(() => {
    if (metadata?.widget_config.stations?.token && weatherStations && mapLayer) {
      setStationsByZone(NWACStationsByZone(mapFeaturesForCenter(mapLayer, center_id), weatherStations));
    }
  }, [metadata, weatherStations, mapLayer, center_id]);

  const analytics = useAnalytics();

  const recordAnalytics = useCallback(() => {
    if (center_id && zone.name) {
      analytics.screen('weather_forecast_tab', {
        center: center_id,
        zone: zone.name,
      });
    }
  }, [analytics, center_id, zone.name]);
  useFocusEffect(recordAnalytics);

  // In the UI, we show weather station groups, which may contain 1 or more weather stations.
  // Example: Alpental Ski Area shows 3 weather stations.
  const actionListData = useMemo(
    () =>
      Object.entries(stationsByZone?.find(zoneData => zoneData.feature.id === zone.id)?.stationGroups || {})
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([name, stations]) => ({
          label: name,
          data: stations,
          action: () => {
            navigation.navigate('stationsDetail', {
              center_id: center_id,
              stations: stations
                .map(s => ({id: s.stid, source: s.source}))
                .reduce((accum, value) => {
                  accum[value.id] = value.source;
                  return accum;
                }, {} as Record<string, WeatherStationSource>),
              name: name,
              requestedTime: formatRequestedTime(requestedTime),
              zoneName: zone.name,
            });
          },
        })),
    [center_id, stationsByZone, navigation, requestedTime, zone.name, zone.id],
  );

  if (incompleteQueryState(avalancheCenterMetadataResult, mapLayerResult) || !metadata || !mapLayer) {
    return <QueryState results={[nwacForecastResult, avalancheCenterMetadataResult, mapLayerResult]} />;
  }

  if (metadata?.widget_config.stations?.token) {
    if (incompleteQueryState(weatherStationsResult) || !weatherStations) {
      return (
        <QueryState
          results={[weatherStationsResult]}
          terminal
          customMessage={{
            notFound: () => ({
              headline: 'Missing forecast',
              body: 'There may not be a forecast available for today.',
            }),
          }}
        />
      );
    }
  }

  if (incompleteQueryState(nwacForecastResult) || !nwacForecast) {
    return (
      <QueryState
        results={[nwacForecastResult]}
        terminal
        customMessage={{
          notFound: () => ({
            headline: 'Missing forecast',
            body: 'There may not be a forecast available for today.',
          }),
        }}
      />
    );
  }

  const windows = nwacForecast.windows.filter(forecastWindow => {
    const windowIssuance = nwacForecast.issuances[forecastWindow.issuance];
    return windowIssuance != null && zonesFor(windowIssuance, zone.id).length > 0;
  });
  const shown = windows.length > 0 ? nwacWeatherWindowToShow(windows, nwacForecast.issuances, new Date(nwacForecastResult.dataUpdatedAt)) : undefined;
  const issuance = shown ? nwacForecast.issuances[shown.issuance] : undefined;
  if (!shown || !issuance) {
    if (nwacForecast.windows.length > 0) {
      Sentry.captureException(new Error(`NWAC weather day ${nwacForecast.serviceDate} has no window for avalanche zone ${zone.id}`), {
        tags: {center_id: center_id, zone_id: zone.id},
      });
    }
    return (
      <NotFound
        terminal
        what={[new NotFoundError(`no NWAC weather zone for avalanche zone ${zone.id}`, 'weather forecast')]}
        headline="Missing forecast"
        body="There may not be a forecast available for today."
      />
    );
  }
  const weatherZones = zonesFor(issuance, zone.id);

  return (
    <ScrollView
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
      directionalLockEnabled={true}
      contentContainerStyle={{paddingBottom: insets.bottom}}>
      <VStack space={8} backgroundColor={colorLookup('primary.background')}>
        <Card
          borderRadius={0}
          borderColor="white"
          header={
            <VStack space={2}>
              <Title3Black>Mountain Weather</Title3Black>
              <BodySm color="text.secondary">{issuanceLabel(issuance.type)}</BodySm>
            </VStack>
          }
          noDivider>
          <HStack justifyContent="space-evenly" alignItems="flex-start" space={8}>
            <VStack space={8} style={{flex: 1}}>
              <AllCapsSmBlack>Issued</AllCapsSmBlack>
              <AllCapsSm style={{textTransform: 'none'}} color="text.secondary">
                {utcDateToLocalTimeString(issuance.issuedAt)}
              </AllCapsSm>
            </VStack>
            <VStack space={8} style={{flex: 1}}>
              <AllCapsSmBlack>Author</AllCapsSmBlack>
              <AllCapsSm style={{textTransform: 'none'}} color="text.secondary">
                {issuance.author || 'Unknown'}
                {'\n'}
              </AllCapsSm>
            </VStack>
          </HStack>
        </Card>

        {issuance.synopsis && (
          <CollapsibleCard
            center_id={center_id}
            identifier={'NWACWeatherSynopsis'}
            marginTop={1}
            borderRadius={0}
            borderColor="white"
            header={<Title3Black>Weather Synopsis</Title3Black>}
            startsCollapsed={true}>
            <HTML source={{html: issuance.synopsis}} />
          </CollapsibleCard>
        )}

        {weatherZones.map(weatherZone => (
          <NWACWeatherZoneForecast key={weatherZone.id} issuance={issuance} zone={weatherZone} periodKeys={shown.periodKeys} held={shown.held ?? false} />
        ))}
        {actionListData.length > 0 && <ActionList pl={16} backgroundColor="white" header={<Title3Black>Weather Data</Title3Black>} actions={actionListData} />}
        {issuance.extendedOutlook && (
          <CollapsibleCard
            center_id={center_id}
            identifier={'NWACWeatherExtendedSynopsis'}
            marginTop={1}
            borderRadius={0}
            borderColor="white"
            header={<Title3Black>Extended Synopsis</Title3Black>}
            startsCollapsed={true}>
            <HTML source={{html: issuance.extendedOutlook}} />
          </CollapsibleCard>
        )}
      </VStack>
    </ScrollView>
  );
};
