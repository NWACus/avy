import Ionicons from '@expo/vector-icons/Ionicons';
import {CompositeNavigationProp, useFocusEffect, useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import * as Sentry from '@sentry/react-native';
import {ActionList} from 'components/content/ActionList';
import {Card, CollapsibleCard} from 'components/content/Card';
import {NotFound, QueryState, incompleteQueryState} from 'components/content/QueryState';
import {HStack, VStack, View} from 'components/core';
import {SmallHeaderWithTooltip} from 'components/forecast/WeatherTab/SmallHeaderWithTooltip';
import {AllCapsSm, AllCapsSmBlack, Body, BodyBlack, BodySm, BodySmBlack, BodySmSemibold, BodyXSm, Title3Black} from 'components/text';
import {HTML} from 'components/text/HTML';
import {NWACStationsByZone, ZoneWithWeatherStations} from 'components/weather_data/NWACWeatherStationList';
import helpStrings from 'content/helpStrings';
import {useAllMapLayers} from 'hooks/useAllMapLayers';
import {useAnalytics} from 'hooks/useAnalytics';
import {useAvalancheCenterMetadata} from 'hooks/useAvalancheCenterMetadata';
import {useAvalancheForecast} from 'hooks/useAvalancheForecast';
import {useNWACWeatherForecast} from 'hooks/useNWACWeatherForecast';
import {useRefresh} from 'hooks/useRefresh';
import {useWeatherStationsMetadata} from 'hooks/useWeatherStationsMetadata';
import React, {PropsWithChildren, useCallback, useEffect, useMemo, useState} from 'react';
import {RefreshControl, ScrollView} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {MainStackParamList, TabNavigationProps} from 'routes';
import {colorLookup} from 'theme';
import {AvalancheCenterID, AvalancheForecastZone, WeatherStationSource, mapFeaturesForCenter} from 'types/nationalAvalancheCenter';
import {NWACWeatherBlock, NWACWeatherIssuance, NWACWeatherPeriod, NWACWeatherPoint, NWACWeatherTempCell, NWACWeatherWindCell, NWACWeatherZone} from 'types/nwacWeather/nwacWeather';
import {
  DASH,
  deriveSnowLevel,
  fmtCalendarDate,
  fmtWind,
  issuanceLabel,
  levelKind,
  periodDateGroups,
  pointSnow,
  sensibleSlots,
  snowRange,
  snowTier,
  tempPeriods,
  windBearing,
  windRange,
  windWording,
  zonePoints,
  zoneSnow,
  zonesFor,
} from 'types/nwacWeather/nwacWeatherFormat';
import {NotFoundError} from 'types/requests';
import {RequestedTime, formatRequestedTime, utcDateToLocalTimeString} from 'utils/date';

type ForecastNavigationProp = CompositeNavigationProp<NativeStackNavigationProp<MainStackParamList, 'forecast'>, TabNavigationProps>;

interface NWACWeatherTabProps {
  zone: AvalancheForecastZone;
  center_id: AvalancheCenterID;
  requestedTime: RequestedTime;
}

export const NWACWeatherTab: React.FC<NWACWeatherTabProps> = ({zone, center_id, requestedTime}) => {
  const insets = useSafeAreaInsets();
  const avalancheCenterMetadataResult = useAvalancheCenterMetadata(center_id);
  const metadata = avalancheCenterMetadataResult.data;
  const avalancheForecastResult = useAvalancheForecast(center_id, zone.id, requestedTime, metadata);
  const avalancheForecast = avalancheForecastResult.data;
  const nwacForecastResult = useNWACWeatherForecast(zone.id, avalancheForecast?.published_time);
  const nwacForecast = nwacForecastResult.data;
  const mapLayerResult = useAllMapLayers(requestedTime);
  const mapLayer = mapLayerResult.data;
  const weatherStationsResult = useWeatherStationsMetadata(center_id, metadata?.widget_config.stations?.token);
  const weatherStations = weatherStationsResult.data;
  const [stationsByZone, setStationsByZone] = useState<ZoneWithWeatherStations[]>([]);
  const {isRefreshing, refresh} = useRefresh(avalancheForecastResult.refetch, nwacForecastResult.refetch, avalancheCenterMetadataResult.refetch, mapLayerResult.refetch);
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

  if (incompleteQueryState(avalancheCenterMetadataResult, avalancheForecastResult, mapLayerResult) || !metadata || !avalancheForecast || !mapLayer) {
    return <QueryState results={[avalancheCenterMetadataResult, avalancheForecastResult, mapLayerResult]} />;
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

  if (!avalancheForecast.published_time) {
    return (
      <NotFound
        terminal
        what={[new NotFoundError(`avalanche forecast for zone ${zone.id} has no published time`, 'weather forecast')]}
        headline="Missing forecast"
        body="There may not be a forecast available for today."
      />
    );
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

  const issuance = nwacForecast.issuances.length > 0 ? nwacForecast.issuances[0] : undefined;
  const weatherZones = issuance ? zonesFor(issuance, zone.id) : [];
  if (!issuance || weatherZones.length === 0) {
    if (issuance) {
      Sentry.captureException(new Error(`NWAC weather issuance ${issuance.id} has no weather zone for avalanche zone ${zone.id}`), {
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
        {weatherZones.map(weatherZone => (
          <NWACWeatherZoneForecast key={weatherZone.id} issuance={issuance} zone={weatherZone} showName={weatherZones.length > 1} />
        ))}
        {actionListData.length > 0 && <ActionList pl={16} backgroundColor="white" header={<Title3Black>Weather Data</Title3Black>} actions={actionListData} />}
        {issuance.synopsis && (
          <CollapsibleCard
            center_id={center_id}
            identifier={'weatherSynopsis'}
            marginTop={1}
            borderRadius={0}
            borderColor="white"
            header={<Title3Black>Weather Synopsis</Title3Black>}
            startsCollapsed={true}>
            <HTML source={{html: issuance.synopsis}} />
          </CollapsibleCard>
        )}
        {issuance.extendedOutlook && (
          <CollapsibleCard
            center_id={center_id}
            identifier={'weatherExtendedSynopsis'}
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

interface NWACWeatherBlockView {
  block: NWACWeatherBlock;
  level: number | null;
  snow: boolean;
  wind: NWACWeatherWindCell | undefined;
}

interface NWACWeatherPeriodView {
  period: NWACWeatherPeriod;
  tempOut: boolean;
  blocks: NWACWeatherBlockView[];
}

const firstUncoveredIndex = <T,>(items: T[], isCovered: (item: T) => boolean): number => {
  const lastCoveredIndex = items.findLastIndex(isCovered);
  return lastCoveredIndex === -1 ? items.length : lastCoveredIndex + 1;
};

export const nwacWeatherPeriodViews = (issuance: NWACWeatherIssuance, zoneId: string): NWACWeatherPeriodView[] => {
  const temps = new Set(tempPeriods(issuance).map(p => p.key));
  const blocksOf = (period: NWACWeatherPeriod) => issuance.blocks.filter(b => b.period === period.key);
  const firstTempOutIndex = firstUncoveredIndex(issuance.periods, period => temps.has(period.key));
  return issuance.periods.map((period, periodIndex) => ({
    period,
    tempOut: periodIndex >= firstTempOutIndex,
    blocks: blocksOf(period).map(block => ({
      block,
      level: deriveSnowLevel(issuance.snowLevel[zoneId]?.[block.key]?.freezing),
      snow: levelKind(issuance, zoneId, block) === 'snow',
      wind: issuance.wind[zoneId]?.[block.key],
    })),
  }));
};

const NWAC_SNOW_FILLS = ['nwacWeather.snow.0', 'nwacWeather.snow.1', 'nwacWeather.snow.2', 'nwacWeather.snow.3'];

const NWAC_LEVEL_FILLS: {below: number; fill: string}[] = [
  {below: 2000, fill: 'nwacWeather.level.below2000'},
  {below: 3000, fill: 'nwacWeather.level.2000'},
  {below: 4000, fill: 'nwacWeather.level.3000'},
  {below: 5000, fill: 'nwacWeather.level.4000'},
  {below: 6000, fill: 'nwacWeather.level.5000'},
  {below: 7000, fill: 'nwacWeather.level.6000'},
  {below: 8000, fill: 'nwacWeather.level.7000'},
  {below: 9000, fill: 'nwacWeather.level.8000'},
  {below: 10000, fill: 'nwacWeather.level.9000'},
  {below: Infinity, fill: 'nwacWeather.level.10000'},
];

const nwacLevelFill = (level: number): string => NWAC_LEVEL_FILLS.find(f => level < f.below)?.fill ?? 'nwacWeather.level.10000';

const NWACWeatherZoneForecast: React.FunctionComponent<{issuance: NWACWeatherIssuance; zone: NWACWeatherZone; showName: boolean}> = ({issuance, zone, showName}) => {
  const periodViews = nwacWeatherPeriodViews(issuance, zone.id);
  const points = zonePoints(issuance, zone.id);
  const sensible = issuance.sensible[zone.id] ?? {};
  const slots = sensibleSlots(issuance)
    .map(slot => ({...slot, text: sensible[slot.key]?.trim()}))
    .filter(slot => slot.text);
  return (
    <>
      {showName && <Card borderRadius={0} borderColor="white" noDivider header={<Title3Black>{zone.name}</Title3Black>} />}
      {slots.map(slot => (
        <Card
          key={slot.key}
          borderRadius={0}
          borderColor="white"
          noDivider
          header={
            <VStack space={2}>
              <BodyBlack>{slot.date ? `${slot.label} · ${fmtCalendarDate(slot.date)}` : slot.label}</BodyBlack>
              <Body>{slot.text}</Body>
            </VStack>
          }
        />
      ))}
      {periodDateGroups(issuance.periods).map(({date}) => (
        <Card key={date} borderRadius={0} borderColor="white" noDivider noInternalSpace header={<BodyBlack>{fmtCalendarDate(date)}</BodyBlack>}>
          {periodViews
            .filter(periodView => periodView.period.date === date)
            .map(periodView => (
              <NWACWeatherPeriodCard key={periodView.period.key} issuance={issuance} zoneId={zone.id} points={points} view={periodView} />
            ))}
        </Card>
      ))}
      <NWACWeatherExtendedSnowLevels issuance={issuance} zoneId={zone.id} />
    </>
  );
};

const NoForecastLabel: React.FunctionComponent = () => {
  return (
    <BodySm color="text.tertiary" style={{fontStyle: 'italic'}}>
      No forecast
    </BodySm>
  );
};

const NWACWeatherLine: React.FunctionComponent<PropsWithChildren<{label: string; dialogTitle?: string; content?: string; sub?: boolean; alignItems?: 'center' | 'flex-start'}>> = ({
  label,
  dialogTitle,
  content,
  sub,
  alignItems = 'center',
  children,
}) => (
  <HStack justifyContent="space-between" alignItems={alignItems} borderTopWidth={1} borderColor={colorLookup('light.300')} pl={sub ? 24 : 12} pr={12} py={8} space={12}>
    <View flex={1}>
      {sub ? (
        <BodySm color="text.secondary">{label}</BodySm>
      ) : (
        <SmallHeaderWithTooltip title={label} dialogTitle={dialogTitle ?? label} content={content} tooltipPlacement="adjacent" />
      )}
    </View>
    {children}
  </HStack>
);

const BLOCK_PART_SHORT_LABELS: Record<string, string> = {
  Morning: 'AM',
  Afternoon: 'PM',
  Evening: 'Eve',
  Night: 'Night',
};

const blockPartShortLabel = (part: string): string => BLOCK_PART_SHORT_LABELS[part] ?? part;

const NWACWeatherBlockValue: React.FunctionComponent<PropsWithChildren<{part: string}>> = ({part, children}) => (
  <HStack space={8} alignItems="center">
    <BodySm color="text.secondary">{blockPartShortLabel(part)}</BodySm>
    <View flexGrow={1} alignItems="flex-end">
      {children}
    </View>
  </HStack>
);

const NWACWeatherPeriodCard: React.FunctionComponent<{issuance: NWACWeatherIssuance; zoneId: string; points: NWACWeatherPoint[]; view: NWACWeatherPeriodView}> = ({
  issuance,
  zoneId,
  points,
  view,
}) => {
  const night = view.period.kind === 'night';
  return (
    <View borderWidth={1} borderColor={colorLookup('light.300')} borderRadius={8} mt={12}>
      <HStack space={6} alignItems="center" px={12} py={8} bg={colorLookup('light.100')} borderTopLeftRadius={8} borderTopRightRadius={8}>
        <Ionicons name={night ? 'moon-outline' : 'sunny-outline'} size={16} color={colorLookup('text.secondary')} />
        <BodySmBlack>{night ? 'Night' : 'Day'}</BodySmBlack>
      </HStack>
      <NWACWeatherLine label="Snow (in)" dialogTitle="Snow" content={helpStrings.weather.precipitation}>
        <NWACSnowAmount snow={zoneSnow(issuance, zoneId, view.period.key)} />
      </NWACWeatherLine>
      {points.length > 1 &&
        points.map(point => (
          <NWACWeatherLine key={point.code} label={point.name} sub>
            <NWACSnowAmount snow={pointSnow(issuance, point.code, view.period.key)} />
          </NWACWeatherLine>
        ))}
      <NWACWeatherLine label="5K ft Temps (°F)" dialogTitle="Temperature" content={helpStrings.weather.temperature}>
        {view.tempOut ? <NoForecastLabel /> : <NWACTempValue cell={issuance.temp[zoneId]?.[view.period.key]} />}
      </NWACWeatherLine>
      <NWACWeatherLine label="Snow Level (ft)" dialogTitle="Snow Level" content={helpStrings.weather.snowLevelNoAsterisk} alignItems="flex-start">
        <VStack space={6}>
          {view.blocks.map(blockView => (
            <NWACWeatherBlockValue key={blockView.block.key} part={blockView.block.part}>
              <NWACSnowLevelValue level={blockView.level} snow={blockView.snow} />
            </NWACWeatherBlockValue>
          ))}
        </VStack>
      </NWACWeatherLine>
      <NWACWeatherLine label="Ridgeline Winds (mph)" dialogTitle="Ridgeline Winds" content={helpStrings.weather.wind} alignItems="flex-start">
        <VStack space={6}>
          {view.blocks.map(blockView => (
            <NWACWeatherBlockValue key={blockView.block.key} part={blockView.block.part}>
              <NWACWindValue cell={blockView.wind} />
            </NWACWeatherBlockValue>
          ))}
        </VStack>
      </NWACWeatherLine>
    </View>
  );
};

const NWACWeatherExtendedSnowLevels: React.FunctionComponent<{issuance: NWACWeatherIssuance; zoneId: string}> = ({issuance, zoneId}) => {
  const levels = issuance.extendedSnowLevel[zoneId];
  if (!levels || issuance.extendedBlocks.length === 0) {
    return null;
  }
  return (
    <Card
      borderRadius={0}
      borderColor="white"
      noDivider
      noInternalSpace
      header={<SmallHeaderWithTooltip title="Extended Snow Levels (ft)" dialogTitle="Snow Level" content={helpStrings.weather.snowLevelNoAsterisk} />}>
      <View borderWidth={1} borderColor={colorLookup('light.300')} borderRadius={8} mt={12}>
        {issuance.extendedBlocks.map((block, index) => (
          <HStack
            key={block.key}
            justifyContent="space-between"
            alignItems="center"
            borderTopWidth={index > 0 ? 1 : 0}
            borderColor={colorLookup('light.300')}
            px={12}
            py={6}
            space={8}>
            <BodySm color="text.secondary">{`${fmtCalendarDate(block.date)} ${block.part}`}</BodySm>
            <NWACSnowLevelValue level={deriveSnowLevel(levels[block.key]?.freezing)} snow={levels[block.key]?.mode !== 'freezing'} />
          </HStack>
        ))}
      </View>
    </Card>
  );
};

const NWACSnowAmount: React.FunctionComponent<{snow: number | null}> = ({snow}) => {
  const tier = snowTier(snow);
  const text = snowRange(snow);
  return (
    <View bg={tier == null ? undefined : colorLookup(NWAC_SNOW_FILLS[tier])} borderRadius={4} px={6} py={2}>
      {snow != null && snow > 0 ? <BodySmBlack>{text}</BodySmBlack> : <BodySm color="text.secondary">{text}</BodySm>}
    </View>
  );
};

const NWACTempValue: React.FunctionComponent<{cell: NWACWeatherTempCell | undefined}> = ({cell}) => {
  if (cell?.high == null || cell.low == null) {
    return <BodySm color="text.secondary">{DASH}</BodySm>;
  }
  return (
    <BodySm color="text.secondary">
      <BodySmBlack>{cell.high}</BodySmBlack> / <BodySmBlack>{cell.low}</BodySmBlack>
    </BodySm>
  );
};

const NWACSnowLevelValue: React.FunctionComponent<{level: number | null; snow: boolean}> = ({level, snow}) => {
  if (level == null) {
    return <BodySm color="text.secondary">{DASH}</BodySm>;
  }
  return (
    <HStack space={4} alignItems="center" bg={colorLookup(nwacLevelFill(level))} borderRadius={4} px={6} py={2}>
      <View width={14}>{snow && <Ionicons name="snow-outline" size={14} color={colorLookup('nwacWeather.snowflake')} />}</View>
      <BodySmBlack>{`${level.toLocaleString('en-US')}'`}</BodySmBlack>
    </HStack>
  );
};

const NWACWindValue: React.FunctionComponent<{cell: NWACWeatherWindCell | undefined}> = ({cell}) => {
  if (cell == null) {
    return <NoForecastLabel />;
  }
  if (cell.speed == null || windWording(cell.speed) === 'Calm') {
    return <BodySm color="text.secondary">{fmtWind(cell)}</BodySm>;
  }
  const bearing = windBearing(cell.dir);
  const range = windRange(cell.speed);
  return (
    <VStack alignItems="flex-end">
      <HStack space={4} alignItems="center">
        {bearing != null && <Ionicons name="arrow-up" size={14} color={colorLookup('primary')} style={{transform: [{rotate: `${bearing + 180}deg`}]}} />}
        <BodyXSm color="text.secondary">{cell.dir}</BodyXSm>
        {cell.speed >= 25 ? <BodySmBlack>{range}</BodySmBlack> : cell.speed >= 15 ? <BodySmSemibold>{range}</BodySmSemibold> : <BodySm>{range}</BodySm>}
      </HStack>
      <BodyXSm color="text.secondary">{windWording(cell.speed)}</BodyXSm>
    </VStack>
  );
};
