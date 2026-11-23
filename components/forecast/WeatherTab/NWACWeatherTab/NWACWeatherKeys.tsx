import Ionicons from '@expo/vector-icons/Ionicons';
import {HStack, VStack, View} from 'components/core';
import {BodyXSm} from 'components/text';
import React, {PropsWithChildren, ReactNode} from 'react';
import {colorLookup} from 'theme';
import {SNOW_TIER_LABELS} from 'types/nwacWeather/nwacWeatherFormat';

export const NWAC_SNOW_FILLS = ['nwacWeather.snow.0', 'nwacWeather.snow.1', 'nwacWeather.snow.2', 'nwacWeather.snow.3'];

export const NWAC_LEVEL_FILLS: {below: number; fill: string; label: string}[] = [
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

export const NWACWeatherKeys: React.FunctionComponent = () => (
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

const NWACWeatherKey: React.FunctionComponent<PropsWithChildren<{title: ReactNode}>> = ({title, children}) => (
  <VStack space={4}>
    {title}
    {children}
  </VStack>
);

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
