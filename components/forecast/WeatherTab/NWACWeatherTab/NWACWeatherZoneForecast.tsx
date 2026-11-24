import Ionicons from '@expo/vector-icons/Ionicons';
import {Card} from 'components/content/Card';
import {Collapsible} from 'components/content/Collapsible';
import {HStack, VStack, View} from 'components/core';
import {NWACWeatherKey, NWACWeatherKeyType, NWAC_LEVEL_FILLS, NWAC_SNOW_FILLS} from 'components/forecast/WeatherTab/NWACWeatherTab/NWACWeatherKeys';
import {BodySm, BodySmBlack, BodySmSemibold, BodyXSm} from 'components/text';
import React, {PropsWithChildren, ReactNode, useCallback, useState} from 'react';
import {Pressable, ViewStyle} from 'react-native';
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
  const [openKeyId, setOpenKeyId] = useState<string | null>(null);
  const onToggleKey = useCallback((keyId: string) => setOpenKeyId(currentKeyId => (currentKeyId === keyId ? null : keyId)), []);
  return (
    <VStack space={12}>
      {periodViews.map(periodView => (
        <Card key={`Card-${periodView.period.key}`} borderRadius={0} borderColor="white" noDivider noInternalSpace>
          <NWACWeatherPeriodCard issuance={issuance} zoneId={zone.id} points={points} view={periodView} openKeyId={openKeyId} onToggleKey={onToggleKey} />
        </Card>
      ))}
    </VStack>
  );
};

interface NWACWeatherKeyToggle {
  keyId: string;
  expanded: boolean;
  onToggleKey: (keyId: string) => void;
}

const nwacWeatherKeyToggle = (periodKey: string, type: NWACWeatherKeyType, openKeyId: string | null, onToggleKey: (keyId: string) => void): NWACWeatherKeyToggle => {
  const keyId = `${periodKey}-${type}`;
  return {keyId, expanded: keyId === openKeyId, onToggleKey};
};

const NWACWeatherKeyPressable: React.FunctionComponent<PropsWithChildren<{toggle: NWACWeatherKeyToggle; style: ViewStyle}>> = ({toggle, style, children}) => {
  const {keyId, expanded, onToggleKey} = toggle;
  const onPress = useCallback(() => onToggleKey(keyId), [onToggleKey, keyId]);
  return (
    <Pressable style={style} onPress={onPress} accessibilityRole="button" accessibilityState={{expanded}} accessibilityHint={expanded ? 'Hides the key' : 'Shows the key'}>
      {children}
    </Pressable>
  );
};

const NWACWeatherKeyRow: React.FunctionComponent<{type: NWACWeatherKeyType; expanded: boolean}> = ({type, expanded}) => (
  <Collapsible collapsed={!expanded} duration={250}>
    <View
      borderTopWidth={1}
      borderColor={colorLookup('light.300')}
      bg={colorLookup('light.100')}
      px={12}
      py={12}
      accessibilityElementsHidden={!expanded}
      importantForAccessibility={expanded ? 'auto' : 'no-hide-descendants'}>
      <NWACWeatherKey type={type} />
    </View>
  </Collapsible>
);

const NWACWeatherInfoGlyph: React.FunctionComponent = () => (
  <>
    {' '}
    <Ionicons name="information-circle-outline" size={16} color={colorLookup('text')} />
  </>
);

const NWACWeatherLabel: React.FunctionComponent<{label: string; unit?: string; info?: boolean}> = ({label, unit, info}) => (
  <BodySmSemibold>
    {label}
    {unit && <BodySm color="text.secondary">{` (${unit})`}</BodySm>}
    {info && <NWACWeatherInfoGlyph />}
  </BodySmSemibold>
);

const LABEL_COLUMN_WIDTH = '38%';

const LABEL_CELL_STYLE: ViewStyle = {width: LABEL_COLUMN_WIDTH};

const FLEX_CELL_STYLE: ViewStyle = {flex: 1};

const NWACWeatherGridRow: React.FunctionComponent<PropsWithChildren<{label?: ReactNode; header?: boolean; keyToggle?: NWACWeatherKeyToggle}>> = ({
  label,
  header = false,
  keyToggle,
  children,
}) => {
  const labelCell = (
    <View flex={1} px={12} py={8} justifyContent="center">
      {label}
    </View>
  );
  return (
    <HStack alignItems="stretch" borderTopWidth={1} borderColor={colorLookup('light.300')} bg={header ? colorLookup('light.100') : undefined}>
      {keyToggle ? (
        <NWACWeatherKeyPressable toggle={keyToggle} style={LABEL_CELL_STYLE}>
          {labelCell}
        </NWACWeatherKeyPressable>
      ) : (
        <View width={LABEL_COLUMN_WIDTH}>{labelCell}</View>
      )}
      {children}
    </HStack>
  );
};

const NWACWeatherGridCell: React.FunctionComponent<PropsWithChildren<{fill?: string; divided?: boolean}>> = ({fill, divided = false, children}) => (
  <View
    flex={1}
    px={6}
    py={8}
    alignItems="center"
    justifyContent="center"
    bg={fill ? colorLookup(fill) : undefined}
    borderLeftWidth={divided ? 1 : 0}
    borderColor={colorLookup('light.300')}>
    {children}
  </View>
);

const NWACWeatherColumnHeader: React.FunctionComponent<{label: string; unit?: string; info?: boolean}> = ({label, unit, info}) => (
  <BodyXSm color="text.secondary" textAlign="center">
    {label}
    {unit && <BodyXSm color="text.tertiary">{` (${unit})`}</BodyXSm>}
    {info && <NWACWeatherInfoGlyph />}
  </BodyXSm>
);

const NWACWeatherStationLabel: React.FunctionComponent<{name: string}> = ({name}) => (
  <HStack space={4} alignItems="center">
    <Ionicons name="location-outline" size={16} color={colorLookup('text.secondary')} />
    <BodySm style={{flex: 1}}>{name}</BodySm>
  </HStack>
);

const NoForecastChip: React.FunctionComponent = () => (
  <View bg={colorLookup('light.100')} borderRadius={4} px={6} py={2}>
    <BodyXSm color="text.tertiary" style={{fontStyle: 'italic'}}>
      No forecast
    </BodyXSm>
  </View>
);

const NWACWeatherBlocks: React.FunctionComponent<{blocks: NWACWeatherBlockView[]; levelKeyToggle: NWACWeatherKeyToggle; windKeyToggle: NWACWeatherKeyToggle}> = ({
  blocks,
  levelKeyToggle,
  windKeyToggle,
}) => {
  return (
    <View>
      <NWACWeatherGridRow header>
        {blocks.map(blockView => (
          <NWACWeatherGridCell key={blockView.block.key}>
            <NWACWeatherColumnHeader label={blockView.block.part} />
          </NWACWeatherGridCell>
        ))}
      </NWACWeatherGridRow>
      <NWACWeatherGridRow label={<NWACWeatherLabel label="Snow Level" unit="ft" info />} keyToggle={levelKeyToggle}>
        {blocks.map(blockView => (
          <NWACWeatherGridCell key={blockView.block.key} fill={blockView.level == null ? undefined : nwacLevelFill(blockView.level)} divided>
            <NWACSnowLevelValue level={blockView.level} snow={blockView.snow} />
          </NWACWeatherGridCell>
        ))}
      </NWACWeatherGridRow>
      <NWACWeatherKeyRow type="freezeLevel" expanded={levelKeyToggle.expanded} />
      <NWACWeatherGridRow label={<NWACWeatherLabel label="Ridge Wind" unit="mph" info />} keyToggle={windKeyToggle}>
        {blocks.map(blockView => (
          <NWACWeatherGridCell key={blockView.block.key} fill={blockView.windOut ? undefined : nwacWindFill(blockView.wind?.speed)} divided>
            <NWACWindValue cell={blockView.windOut ? undefined : blockView.wind} />
          </NWACWeatherGridCell>
        ))}
      </NWACWeatherGridRow>
      <NWACWeatherKeyRow type="wind" expanded={windKeyToggle.expanded} />
    </View>
  );
};

const NWACWeatherPeriodCard: React.FunctionComponent<{
  issuance: NWACWeatherIssuance;
  zoneId: string;
  points: NWACWeatherPoint[];
  view: NWACWeatherPeriodView;
  openKeyId: string | null;
  onToggleKey: (keyId: string) => void;
}> = ({issuance, zoneId, points, view, openKeyId, onToggleKey}) => {
  const snowKeyToggle = nwacWeatherKeyToggle(view.period.key, 'snow', openKeyId, onToggleKey);
  const temperatureKeyToggle = nwacWeatherKeyToggle(view.period.key, 'temperature', openKeyId, onToggleKey);
  const levelKeyToggle = nwacWeatherKeyToggle(view.period.key, 'freezeLevel', openKeyId, onToggleKey);
  const windKeyToggle = nwacWeatherKeyToggle(view.period.key, 'wind', openKeyId, onToggleKey);
  return (
    <View borderWidth={1} borderColor={colorLookup('light.300')} borderRadius={8} overflow="hidden">
      <HStack space={6} alignItems="center" px={12} py={8} bg={colorLookup('light.100')}>
        <Ionicons name={view.night ? 'moon-outline' : 'sunny-outline'} size={16} color={colorLookup('text.secondary')} />
        <BodySmBlack>{view.name}</BodySmBlack>
        <BodySm color="text.secondary">{view.label}</BodySm>
      </HStack>
      <NWACWeatherGridRow header label={<BodyXSm color="text.secondary">Station</BodyXSm>}>
        <NWACWeatherGridCell>
          <NWACWeatherColumnHeader label="Precip" unit="in" />
        </NWACWeatherGridCell>
        <NWACWeatherKeyPressable toggle={snowKeyToggle} style={FLEX_CELL_STYLE}>
          <NWACWeatherGridCell>
            <NWACWeatherColumnHeader label="Snow @ 5000'" unit="in" info />
          </NWACWeatherGridCell>
        </NWACWeatherKeyPressable>
      </NWACWeatherGridRow>
      <NWACWeatherKeyRow type="snow" expanded={snowKeyToggle.expanded} />
      {points.map(point => (
        <NWACWeatherStationRow key={point.code} issuance={issuance} point={point} periodKey={view.period.key} />
      ))}
      <NWACWeatherGridRow label={<NWACWeatherLabel label="Temperatures @ 5000'" unit="°F" info />} keyToggle={temperatureKeyToggle}>
        <NWACWeatherGridCell>{view.tempOut ? <NoForecastChip /> : <NWACTempValue cell={issuance.temp[zoneId]?.[view.period.key]} />}</NWACWeatherGridCell>
      </NWACWeatherGridRow>
      <NWACWeatherKeyRow type="temperature" expanded={temperatureKeyToggle.expanded} />
      <NWACWeatherBlocks blocks={view.blocks} levelKeyToggle={levelKeyToggle} windKeyToggle={windKeyToggle} />
      {view.summary && (
        <View borderTopWidth={1} borderColor={colorLookup('light.300')} px={12} py={8}>
          <BodySm>{view.summary}</BodySm>
        </View>
      )}
    </View>
  );
};

const NWACWeatherStationRow: React.FunctionComponent<{issuance: NWACWeatherIssuance; point: NWACWeatherPoint; periodKey: string}> = ({issuance, point, periodKey}) => {
  const snow = pointSnow(issuance, point.code, periodKey);
  const tier = snowTier(snow);
  const text = snowRange(snow);
  return (
    <NWACWeatherGridRow label={<NWACWeatherStationLabel name={point.name} />}>
      <NWACWeatherGridCell>
        <BodySm>{fmtQpf(issuance.precip[point.code]?.[periodKey]?.qpf)}</BodySm>
      </NWACWeatherGridCell>
      <NWACWeatherGridCell fill={tier == null ? undefined : NWAC_SNOW_FILLS[tier]}>
        {snow != null && snow > 0 ? <BodySmBlack>{text}</BodySmBlack> : <BodySm color="text.secondary">{text}</BodySm>}
      </NWACWeatherGridCell>
    </NWACWeatherGridRow>
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
    <HStack space={4} justifyContent="center" alignItems="center" accessibilityLabel={`${level.toLocaleString('en-US')} foot ${snow ? 'snow level' : 'freezing level'}`}>
      <BodySmBlack>{`${level.toLocaleString('en-US')}'`}</BodySmBlack>
      <View width={14}>{snow && <Ionicons name="snow-outline" size={14} color={colorLookup('nwacWeather.snowflake')} />}</View>
    </HStack>
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
