import Ionicons from '@expo/vector-icons/Ionicons';
import {Card} from 'components/content/Card';
import {HStack, VStack, View} from 'components/core';
import {NWACWeatherKeys, NWAC_LEVEL_FILLS, NWAC_SNOW_FILLS} from 'components/forecast/WeatherTab/NWACWeatherTab/NWACWeatherKeys';
import {BodySm, BodySmBlack, BodySmSemibold, BodyXSm} from 'components/text';
import React, {PropsWithChildren, ReactNode, useCallback, useState} from 'react';
import {LayoutChangeEvent} from 'react-native';
import {colorLookup} from 'theme';
import {NWACWeatherBlock, NWACWeatherIssuance, NWACWeatherPeriod, NWACWeatherPoint, NWACWeatherTempCell, NWACWeatherWindCell, NWACWeatherZone} from 'types/nwacWeather/nwacWeather';
import {
  DASH,
  deriveSnowLevel,
  fmtCalendarDate,
  fmtQpf,
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
} from 'types/nwacWeather/nwacWeatherFormat';

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

const nwacWindFill = (speed: number | null | undefined): string | undefined => {
  const wording = windWording(speed);
  return wording == null ? undefined : NWAC_WIND_FILL_BY_WORDING[wording];
};

export const NWACWeatherZoneForecast: React.FunctionComponent<{
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
}) => {
  const [snowColumnWidth, setSnowColumnWidth] = useState(0);
  const onSnowColumnLayout = useCallback((event: LayoutChangeEvent) => {
    const measuredWidth = event.nativeEvent.layout.width;
    setSnowColumnWidth(currentWidth => Math.max(currentWidth, measuredWidth));
  }, []);

  return (
    <View borderWidth={1} borderColor={colorLookup('light.300')} borderRadius={8} overflow="hidden">
      <HStack space={6} alignItems="center" px={12} py={8} bg={colorLookup('light.100')}>
        <Ionicons name={view.night ? 'moon-outline' : 'sunny-outline'} size={16} color={colorLookup('text.secondary')} />
        <BodySmBlack>{view.name}</BodySmBlack>
        <BodySm color="text.secondary">{view.label}</BodySm>
      </HStack>
      {points.map(point => (
        <NWACWeatherLine key={point.code} label="Precipitation & Snow" unit="in" point={point.name}>
          <HStack space={12} alignItems="center">
            <BodySm>{fmtQpf(issuance.precip[point.code]?.[view.period.key]?.qpf)}</BodySm>
            <HStack minWidth={snowColumnWidth} space={6} justifyContent="flex-end" alignItems="center" onLayout={onSnowColumnLayout}>
              <NWACSnowAmount snow={pointSnow(issuance, point.code, view.period.key)} />
              <BodyXSm color="text.secondary">@ 5000&apos;</BodyXSm>
            </HStack>
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
