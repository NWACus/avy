import Ionicons from '@expo/vector-icons/Ionicons';
import {CompositeNavigationProp, useFocusEffect, useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import * as Sentry from '@sentry/react-native';
import {ActionList} from 'components/content/ActionList';
import {Card, CollapsibleCard} from 'components/content/Card';
import {NotFound, QueryState, incompleteQueryState} from 'components/content/QueryState';
import {HStack, VStack, View} from 'components/core';
import {AllCapsSm, AllCapsSmBlack, BodySm, BodySmBlack, BodySmSemibold, BodyXSm, Title3Black} from 'components/text';
import {HTML} from 'components/text/HTML';
import {NWACStationsByZone, ZoneWithWeatherStations} from 'components/weather_data/NWACWeatherStationList';
import {useAllMapLayers} from 'hooks/useAllMapLayers';
import {useAnalytics} from 'hooks/useAnalytics';
import {useAvalancheCenterMetadata} from 'hooks/useAvalancheCenterMetadata';
import {useNWACWeatherForecast} from 'hooks/useNWACWeatherForecast';
import {useRefresh} from 'hooks/useRefresh';
import {useWeatherStationsMetadata} from 'hooks/useWeatherStationsMetadata';
import React, {PropsWithChildren, ReactNode, useCallback, useEffect, useMemo, useState} from 'react';
import {RefreshControl, ScrollView} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {MainStackParamList, TabNavigationProps} from 'routes';
import {colorLookup} from 'theme';
import {AvalancheCenterID, AvalancheForecastZone, WeatherStationSource, mapFeaturesForCenter} from 'types/nationalAvalancheCenter';
import {NWACWeatherBlock, NWACWeatherIssuance, NWACWeatherPeriod, NWACWeatherPoint, NWACWeatherTempCell, NWACWeatherWindCell, NWACWeatherZone} from 'types/nwacWeather/nwacWeather';
import {
  DASH,
  SNOW_TIER_LABELS,
  deriveSnowLevel,
  fmtCalendarDate,
  fmtQpf,
  issuanceLabel,
  levelKind,
  pointSnow,
  sensibleSlotFor,
  snowRange,
  snowTier,
  tempPeriods,
  windBearing,
  windBlocks,
  windRange,
  windWording,
  zonePoints,
  zonesFor,
} from 'types/nwacWeather/nwacWeatherFormat';
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

interface NWACWeatherBlockView {
  block: NWACWeatherBlock;
  level: number | null;
  snow: boolean;
  wind: NWACWeatherWindCell | undefined;
  windOut: boolean;
}

interface NWACWeatherPeriodView {
  period: NWACWeatherPeriod;
  name: string;
  label: string;
  night: boolean;
  summary: string | null;
  tempOut: boolean;
  blocks: NWACWeatherBlockView[];
}

const coveredCount = <T,>(items: T[], isCovered: (item: T) => boolean): number => {
  const lastCoveredIndex = items.findLastIndex(isCovered);
  return lastCoveredIndex === -1 ? items.length : lastCoveredIndex + 1;
};

const periodName = (period: NWACWeatherPeriod, index: number, held: boolean): string => {
  if (held) {
    return period.kind === 'night' ? 'Night' : 'Day';
  }
  if (period.kind === 'night') {
    return 'Tonight';
  }
  return index === 0 ? 'Today' : 'Tomorrow';
};

export const nwacWeatherPeriodViews = (issuance: NWACWeatherIssuance, zoneId: string, periodKeys: string[], held = false): NWACWeatherPeriodView[] => {
  const shown = issuance.periods.filter(period => periodKeys.includes(period.key));
  const temps = new Set(tempPeriods(issuance).map(period => period.key));
  const winds = new Set(windBlocks(issuance).map(block => block.key));
  const tempsCovered = coveredCount(shown, period => temps.has(period.key));
  const shownBlocks = shown.flatMap(period => issuance.blocks.filter(block => block.period === period.key));
  const windsCovered = coveredCount(shownBlocks, block => winds.has(block.key));
  const windOut = new Set(shownBlocks.slice(windsCovered).map(block => block.key));
  const sensible = issuance.sensible[zoneId] ?? {};
  const summaryOf = (periodKey: string) => {
    const slot = sensibleSlotFor(issuance, periodKey);
    return (slot && sensible[slot]?.trim()) || null;
  };
  return shown.map((period, periodIndex) => ({
    period,
    name: periodName(period, periodIndex, held),
    label: fmtCalendarDate(period.date),
    night: period.kind === 'night',
    summary: summaryOf(period.key),
    tempOut: periodIndex >= tempsCovered,
    blocks: shownBlocks
      .filter(block => block.period === period.key)
      .map(block => ({
        block,
        level: deriveSnowLevel(issuance.snowLevel[zoneId]?.[block.key]?.freezing),
        snow: levelKind(issuance, zoneId, block) === 'snow',
        wind: issuance.wind[zoneId]?.[block.key],
        windOut: windOut.has(block.key),
      })),
  }));
};

const NWAC_SNOW_FILLS = ['nwacWeather.snow.0', 'nwacWeather.snow.1', 'nwacWeather.snow.2', 'nwacWeather.snow.3'];

const NWAC_LEVEL_FILLS: {below: number; fill: string; label: string}[] = [
  {below: 2000, fill: 'nwacWeather.level.below2000', label: "<2,000'"},
  {below: 3000, fill: 'nwacWeather.level.2000', label: "2,000'"},
  {below: 4000, fill: 'nwacWeather.level.3000', label: "3,000'"},
  {below: 5000, fill: 'nwacWeather.level.4000', label: "4,000'"},
  {below: 6000, fill: 'nwacWeather.level.5000', label: "5,000'"},
  {below: 7000, fill: 'nwacWeather.level.6000', label: "6,000'"},
  {below: 8000, fill: 'nwacWeather.level.7000', label: "7,000'"},
  {below: 9000, fill: 'nwacWeather.level.8000', label: "8,000'"},
  {below: 10000, fill: 'nwacWeather.level.9000', label: "9,000'"},
  {below: Infinity, fill: 'nwacWeather.level.10000', label: "10,000'+"},
];

interface NWACKeyLabel {
  label?: string;
  span: number;
}

const NWAC_SNOW_KEY_LABELS: NWACKeyLabel[] = SNOW_TIER_LABELS.map(label => ({label, span: 1}));

const NWAC_LEVEL_KEY_LABELS: NWACKeyLabel[] = [
  {span: 1},
  {label: "2k'", span: 2},
  {label: "4k'", span: 2},
  {label: "6k'", span: 2},
  {label: "8k'", span: 2},
  {label: "10k'+", span: 1},
];

const nwacLevelFill = (level: number): string => NWAC_LEVEL_FILLS.find(levelFill => level < levelFill.below)?.fill ?? 'nwacWeather.level.10000';

const NWAC_WIND_FILL_BY_WORDING: Partial<Record<string, string>> = {
  Light: 'nwacWeather.wind.light',
  'Light to occasionally Moderate': 'nwacWeather.wind.lightToModerate',
  'Light to Moderate': 'nwacWeather.wind.lightToModerate',
  Moderate: 'nwacWeather.wind.moderate',
  'Moderate to Strong': 'nwacWeather.wind.moderateToStrong',
  Strong: 'nwacWeather.wind.strong',
  'Strong to Extreme': 'nwacWeather.wind.strongToExtreme',
  Extreme: 'nwacWeather.wind.extreme',
};

const NWAC_WIND_KEY_STEPS: {fill: string; name: string}[] = [
  {fill: 'nwacWeather.wind.light', name: 'Light'},
  {fill: 'nwacWeather.wind.lightToModerate', name: 'Light to Moderate'},
  {fill: 'nwacWeather.wind.moderate', name: 'Moderate'},
  {fill: 'nwacWeather.wind.moderateToStrong', name: 'Moderate to Strong'},
  {fill: 'nwacWeather.wind.strong', name: 'Strong'},
  {fill: 'nwacWeather.wind.strongToExtreme', name: 'Strong to Extreme'},
  {fill: 'nwacWeather.wind.extreme', name: 'Extreme'},
];

const NWAC_WIND_KEY_LABELS: NWACKeyLabel[] = [
  {label: 'Light', span: 2},
  {label: 'Moderate', span: 2},
  {label: 'Strong', span: 2},
  {label: 'Extreme', span: 1},
];

const nwacWindFill = (speed: number | null | undefined): string | undefined => {
  const wording = windWording(speed);
  return wording == null ? undefined : NWAC_WIND_FILL_BY_WORDING[wording];
};

const NWACWeatherZoneForecast: React.FunctionComponent<{
  issuance: NWACWeatherIssuance;
  zone: NWACWeatherZone;
  periodKeys: string[];
  held: boolean;
}> = ({issuance, zone, periodKeys, held}) => {
  const periodViews = nwacWeatherPeriodViews(issuance, zone.id, periodKeys, held);
  const points = zonePoints(issuance, zone.id);
  return (
    <VStack space={12}>
      {periodViews.map(periodView => (
        <Card key={`Card-${periodView.period.key}`} borderRadius={0} borderColor="white" noDivider noInternalSpace>
          <NWACWeatherPeriodCard issuance={issuance} zoneId={zone.id} points={points} view={periodView} />
        </Card>
      ))}
      <Card borderRadius={0} borderColor="white" noDivider>
        <NWACWeatherKeys />
      </Card>
    </VStack>
  );
};

const NWACWeatherLabel: React.FunctionComponent<{label: string; unit?: string; point?: string}> = ({label, unit, point}) => (
  <BodySmSemibold>
    {label}
    {unit && <BodySm color="text.secondary">{` (${unit})`}</BodySm>}
    {point && <BodySm>{`:\n${point}`}</BodySm>}
  </BodySmSemibold>
);

const NWACWeatherLine: React.FunctionComponent<PropsWithChildren<{label: string; unit?: string; point?: string}>> = ({label, unit, point, children}) => (
  <HStack justifyContent="space-between" alignItems="center" borderTopWidth={1} borderColor={colorLookup('light.300')} px={12} py={8} space={12}>
    <View flex={1}>
      <NWACWeatherLabel label={label} unit={unit} point={point} />
    </View>
    {children}
  </HStack>
);

const NoForecastChip: React.FunctionComponent = () => (
  <View bg={colorLookup('light.100')} borderRadius={4} px={6} py={2}>
    <BodyXSm color="text.tertiary" style={{fontStyle: 'italic'}}>
      No forecast
    </BodyXSm>
  </View>
);

const BLOCK_PART_COLUMN_WIDTH = 100;

const NWACWeatherBlocksRow: React.FunctionComponent<{part: ReactNode; level: ReactNode; wind: ReactNode; header?: boolean}> = ({part, level, wind, header = false}) => (
  <HStack alignItems="stretch" borderTopWidth={1} borderColor={colorLookup('light.300')} bg={header ? colorLookup('light.100') : undefined}>
    <View width={BLOCK_PART_COLUMN_WIDTH} px={12} py={8} justifyContent="center" borderRightWidth={1} borderColor={colorLookup('light.300')}>
      {part}
    </View>
    <View flex={1} px={8} py={header ? 8 : 6} justifyContent="center">
      {level}
    </View>
    <View flex={1} px={8} py={header ? 8 : 6} justifyContent="center">
      {wind}
    </View>
  </HStack>
);

const NWACWeatherBlocks: React.FunctionComponent<{blocks: NWACWeatherBlockView[]}> = ({blocks}) => {
  const showWind = blocks.some(blockView => !blockView.windOut);
  return (
    <View>
      <NWACWeatherBlocksRow
        header
        part={null}
        level={
          <BodyXSm color="text.secondary">
            Snow & Freezing Level <BodyXSm color="text.tertiary">(ft)</BodyXSm>
          </BodyXSm>
        }
        wind={
          showWind && (
            <BodyXSm color="text.secondary">
              Ridgeline Winds <BodyXSm color="text.tertiary">(mph)</BodyXSm>
            </BodyXSm>
          )
        }
      />
      {blocks.map(blockView => (
        <NWACWeatherBlocksRow
          key={blockView.block.key}
          part={<BodySm color="text.secondary">{blockView.block.part}</BodySm>}
          level={<NWACSnowLevelValue level={blockView.level} snow={blockView.snow} />}
          wind={!blockView.windOut && <NWACShadedWind cell={blockView.wind} />}
        />
      ))}
    </View>
  );
};

const NWACWeatherPeriodCard: React.FunctionComponent<{issuance: NWACWeatherIssuance; zoneId: string; points: NWACWeatherPoint[]; view: NWACWeatherPeriodView}> = ({
  issuance,
  zoneId,
  points,
  view,
}) => (
  <View borderWidth={1} borderColor={colorLookup('light.300')} borderRadius={8} overflow="hidden">
    <HStack space={6} alignItems="center" px={12} py={8} bg={colorLookup('light.100')}>
      <Ionicons name={view.night ? 'moon-outline' : 'sunny-outline'} size={16} color={colorLookup('text.secondary')} />
      <BodySmBlack>{view.name}</BodySmBlack>
      <BodySm color="text.secondary">{view.label}</BodySm>
    </HStack>
    {points.map(point => (
      <NWACWeatherLine key={point.code} label="Precipitation & Snow" unit="in" point={point.name}>
        <HStack space={6} alignItems="center">
          <BodySm>{fmtQpf(issuance.precip[point.code]?.[view.period.key]?.qpf)}</BodySm>
          <NWACSnowAmount snow={pointSnow(issuance, point.code, view.period.key)} />
          <BodyXSm color="text.secondary">@ 5000&apos;</BodyXSm>
        </HStack>
      </NWACWeatherLine>
    ))}
    <NWACWeatherLine label="5000' Temperatures" unit="Lo / Hi °F">
      {view.tempOut ? <NoForecastChip /> : <NWACTempValue cell={issuance.temp[zoneId]?.[view.period.key]} />}
    </NWACWeatherLine>
    <NWACWeatherBlocks blocks={view.blocks} />
    {view.summary && (
      <View borderTopWidth={1} borderColor={colorLookup('light.300')} px={12} py={8}>
        <BodySm>{view.summary}</BodySm>
      </View>
    )}
  </View>
);

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
    <BodySm>
      <BodySm>{cell.low}°</BodySm>
      <BodySm color="text.secondary"> / </BodySm>
      <BodySmBlack>{cell.high}°</BodySmBlack>
    </BodySm>
  );
};

const NWACSnowLevelValue: React.FunctionComponent<{level: number | null; snow: boolean}> = ({level, snow}) => {
  if (level == null) {
    return (
      <BodySm color="text.secondary" textAlign="center">
        {DASH}
      </BodySm>
    );
  }
  return (
    <HStack
      space={4}
      justifyContent="center"
      alignItems="center"
      bg={colorLookup(nwacLevelFill(level))}
      borderRadius={4}
      px={6}
      py={4}
      accessibilityLabel={`${level.toLocaleString('en-US')} foot ${snow ? 'snow level' : 'freezing level'}`}>
      <View width={14}>{snow && <Ionicons name="snow-outline" size={14} color={colorLookup('nwacWeather.snowflake')} />}</View>
      <BodySmBlack>{`${level.toLocaleString('en-US')}'`}</BodySmBlack>
    </HStack>
  );
};

const NWACShadedWind: React.FunctionComponent<{cell: NWACWeatherWindCell | undefined}> = ({cell}) => {
  const fill = nwacWindFill(cell?.speed);
  return (
    <View bg={fill ? colorLookup(fill) : undefined} borderRadius={4} px={6} py={4} alignItems="center">
      <NWACWindValue cell={cell} />
    </View>
  );
};

const NWACWindValue: React.FunctionComponent<{cell: NWACWeatherWindCell | undefined}> = ({cell}) => {
  if (cell?.speed == null) {
    return <BodySm color="text.secondary">{DASH}</BodySm>;
  }
  if (windWording(cell.speed) === 'Calm') {
    return (
      <BodySm>
        {cell.dir && `${cell.dir} `}
        <BodySmBlack>Calm</BodySmBlack>
      </BodySm>
    );
  }
  const bearing = windBearing(cell.dir);
  return (
    <HStack
      space={4}
      alignItems="center"
      justifyContent="center"
      flexWrap="wrap"
      accessibilityLabel={`${cell.dir ?? ''} ${windRange(cell.speed)} miles per hour, ${windWording(cell.speed)}`}>
      {bearing != null && <Ionicons name="arrow-up" size={14} color={colorLookup('primary')} style={{transform: [{rotate: `${bearing + 180}deg`}]}} />}
      <BodySm>{cell.dir}</BodySm>
      <BodySmBlack>{windRange(cell.speed)}</BodySmBlack>
    </HStack>
  );
};

const NWACSegmentedBar: React.FunctionComponent<{fills: string[]; names: readonly string[]; labels: NWACKeyLabel[]; centered?: boolean}> = ({
  fills,
  names,
  labels,
  centered = false,
}) => (
  <VStack space={2} accessible accessibilityLabel={names.join(', ')}>
    <HStack height={10} borderRadius={2} overflow="hidden">
      {fills.map((fill, fillIndex) => (
        <View key={fillIndex} flex={1} height={10} bg={colorLookup(fill)} />
      ))}
    </HStack>
    <HStack alignItems="flex-start">
      {labels.map(({label, span}, spanIndex) => (
        <View key={spanIndex} flex={span}>
          {label && (
            <BodyXSm color="text.secondary" fontSize={10} lineHeight={12} textAlign={centered ? 'center' : 'left'} numberOfLines={1}>
              {label}
            </BodyXSm>
          )}
        </View>
      ))}
    </HStack>
  </VStack>
);

const NWACWeatherKey: React.FunctionComponent<PropsWithChildren<{title: ReactNode}>> = ({title, children}) => (
  <VStack space={4}>
    {title}
    {children}
  </VStack>
);

const NWACWeatherKeys: React.FunctionComponent = () => (
  <VStack space={12} pt={4}>
    <NWACWeatherKey title={<BodyXSm color="text.secondary">Snow</BodyXSm>}>
      <NWACSegmentedBar fills={NWAC_SNOW_FILLS} names={SNOW_TIER_LABELS} labels={NWAC_SNOW_KEY_LABELS} centered />
    </NWACWeatherKey>
    <NWACWeatherKey
      title={
        <HStack space={4} alignItems="center">
          <Ionicons name="snow-outline" size={14} color={colorLookup('nwacWeather.snowflake')} />
          <BodyXSm color="text.secondary">Snow level; none, freezing level</BodyXSm>
        </HStack>
      }>
      <NWACSegmentedBar fills={NWAC_LEVEL_FILLS.map(levelFill => levelFill.fill)} names={NWAC_LEVEL_FILLS.map(levelFill => levelFill.label)} labels={NWAC_LEVEL_KEY_LABELS} />
    </NWACWeatherKey>
    <NWACWeatherKey title={<BodyXSm color="text.secondary">Ridgeline winds · VAR: variable</BodyXSm>}>
      <NWACSegmentedBar fills={NWAC_WIND_KEY_STEPS.map(step => step.fill)} names={NWAC_WIND_KEY_STEPS.map(step => step.name)} labels={NWAC_WIND_KEY_LABELS} />
    </NWACWeatherKey>
  </VStack>
);
