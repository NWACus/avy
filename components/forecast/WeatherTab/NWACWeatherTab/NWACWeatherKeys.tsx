import Ionicons from '@expo/vector-icons/Ionicons';
import {HStack, VStack, View} from 'components/core';
import {BodySm, BodySmBlack, BodyXSm} from 'components/text';
import {LinearGradient} from 'expo-linear-gradient';
import React, {PropsWithChildren, ReactNode} from 'react';
import {ColorValue, StyleSheet} from 'react-native';
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

const NWAC_LEVEL_KEY_LABELS = ["2k'", "4k'", "6k'", "8k'", "10k'+"];

const NWAC_WIND_KEY_STEPS: {fill: string; name: string}[] = [
  {fill: 'nwacWeather.wind.light', name: 'Light'},
  {fill: 'nwacWeather.wind.lightToModerate', name: 'Light to Moderate'},
  {fill: 'nwacWeather.wind.moderate', name: 'Moderate'},
  {fill: 'nwacWeather.wind.moderateToStrong', name: 'Moderate to Strong'},
  {fill: 'nwacWeather.wind.strong', name: 'Strong'},
  {fill: 'nwacWeather.wind.strongToExtreme', name: 'Strong to Extreme'},
  {fill: 'nwacWeather.wind.extreme', name: 'Extreme'},
];

const NWAC_WIND_KEY_LABELS = ['Light', 'Moderate', 'Strong', 'Extreme'];

const GRADIENT_START = {x: 0, y: 0.5};
const GRADIENT_END = {x: 1, y: 0.5};

export type NWACWeatherKeyType = 'snow' | 'temperature' | 'freezeLevel' | 'wind';

export const NWACWeatherKey: React.FunctionComponent<{type: NWACWeatherKeyType}> = ({type}) => {
  switch (type) {
    case 'snow':
      return <NWACSnowKey />;
    case 'temperature':
      return <NWACTemperatureKey />;
    case 'freezeLevel':
      return <NWACFreezeLevelKey />;
    case 'wind':
      return <NWACWindKey />;
  }
};

const NWACSnowKey: React.FunctionComponent = () => (
  <NWACWeatherKeyLayout title={<BodyXSm color="text.secondary">Inches of snow at 5000&apos;</BodyXSm>}>
    <NWACGradientBar fills={NWAC_SNOW_FILLS} names={SNOW_TIER_LABELS} labels={SNOW_TIER_LABELS} />
  </NWACWeatherKeyLayout>
);

const NWACTemperatureKey: React.FunctionComponent = () => (
  <BodySm color="text.secondary">
    {'Lo / '}
    <BodySmBlack>Hi</BodySmBlack>
  </BodySm>
);

const NWACFreezeLevelKey: React.FunctionComponent = () => (
  <NWACWeatherKeyLayout
    title={
      <HStack space={12} flexWrap="wrap" alignItems="center">
        <HStack space={4} alignItems="center">
          <Ionicons name="snow-outline" size={14} color={colorLookup('nwacWeather.snowflake')} />
          <BodyXSm color="text.secondary">Snow level</BodyXSm>
        </HStack>
        <HStack space={4} alignItems="center">
          <View width={12} height={12} borderRadius={6} borderWidth={1} borderColor={colorLookup('text.secondary')} style={{borderStyle: 'dashed'}} />
          <BodyXSm color="text.secondary">No icon: freezing level (no precipitation expected)</BodyXSm>
        </HStack>
      </HStack>
    }>
    <NWACGradientBar fills={NWAC_LEVEL_FILLS.map(levelFill => levelFill.fill)} names={NWAC_LEVEL_FILLS.map(levelFill => levelFill.label)} labels={NWAC_LEVEL_KEY_LABELS} />
  </NWACWeatherKeyLayout>
);

const NWACWindKey: React.FunctionComponent = () => (
  <NWACWeatherKeyLayout title={<BodyXSm color="text.secondary">mph · VAR: variable</BodyXSm>}>
    <NWACGradientBar fills={NWAC_WIND_KEY_STEPS.map(step => step.fill)} names={NWAC_WIND_KEY_STEPS.map(step => step.name)} labels={NWAC_WIND_KEY_LABELS} />
  </NWACWeatherKeyLayout>
);

const NWACWeatherKeyLayout: React.FunctionComponent<PropsWithChildren<{title: ReactNode}>> = ({title, children}) => (
  <VStack space={8}>
    {title}
    {children}
  </VStack>
);

const NWACGradientBar: React.FunctionComponent<{fills: string[]; names: readonly string[]; labels: readonly string[]}> = ({fills, names, labels}) => (
  <View borderRadius={6} overflow="hidden" accessible accessibilityLabel={names.join(', ')}>
    <LinearGradient
      colors={fills.map(fill => colorLookup(fill)) as [ColorValue, ColorValue, ...ColorValue[]]}
      start={GRADIENT_START}
      end={GRADIENT_END}
      style={StyleSheet.absoluteFill}
    />
    <HStack py={8}>
      {labels.map(label => (
        <View key={label} flex={1} alignItems="center">
          <BodySm numberOfLines={1}>{label}</BodySm>
        </View>
      ))}
    </HStack>
  </View>
);
