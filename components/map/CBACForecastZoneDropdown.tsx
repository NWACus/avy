import Ionicons from '@expo/vector-icons/Ionicons';
import {AvalancheDangerIcon} from 'components/AvalancheDangerIcon';
import {Dropdown, DropdownFooterLink, DropdownRow, DropdownSection} from 'components/content/Dropdown';
import {VStack} from 'components/core';
import {DangerLevelTitle} from 'components/helpers/DangerLevelTitle';
import {MapViewZone} from 'components/map/ZoneMap';
import {Body, BodySmSemibold} from 'components/text';
import {CBACAnalyticsSource, useAnalytics} from 'hooks/useAnalytics';
import {useOpenAvalancheCenterWebsite} from 'hooks/useOpenAvalancheCenterWebsite';
import React, {useCallback} from 'react';
import {colorLookup} from 'theme';
import {DangerLevel} from 'types/nationalAvalancheCenter';

const LOCAL_SECTION_TITLE = 'CBAC · Local';
const STATEWIDE_SECTION_TITLE = 'CAIC · Statewide';
const SEE_ON_MAP_LABEL = 'See this area on the map';
const READ_FORECAST_LABEL = 'Read the forecast at caic.org';
const EXPLANATION_LABEL = 'Why are there 2 forecasts here?';

const ICON_SIZE = 20;
const DANGER_ICON_STYLE = {height: 28} as const;

const linkColor = colorLookup('primary');

interface CBACForecastZoneDropdownProps {
  zone: MapViewZone;
  onSeeAreaOnMap: () => void;
  onShowExplanation: () => void;
}

export const CBACForecastZoneDropdown: React.FunctionComponent<CBACForecastZoneDropdownProps> = ({zone, onSeeAreaOnMap, onShowExplanation}) => {
  const dangerLevel = zone.danger_level ?? DangerLevel.None;
  const openAvalancheCenterWebsite = useOpenAvalancheCenterWebsite();
  const analytics = useAnalytics();

  const onOpen = useCallback(() => analytics.capture('zone_dropdown_opened', {center: zone.center_id, zone_id: zone.zone_id}), [analytics, zone.center_id, zone.zone_id]);

  const onPressSeeAreaOnMap = useCallback(() => {
    analytics.capture('explore_both_forecasts_tapped', {center: zone.center_id});
    onSeeAreaOnMap();
  }, [analytics, zone.center_id, onSeeAreaOnMap]);

  const onReadCAICForecast = useCallback(() => {
    analytics.capture('caic_website_tapped', {center: zone.center_id});
    openAvalancheCenterWebsite('CAIC');
  }, [analytics, zone.center_id, openAvalancheCenterWebsite]);

  const onPressExplanation = useCallback(() => {
    analytics.capture('cbac_explanation_tapped', {center: zone.center_id, displayed_from: CBACAnalyticsSource.ZoneDropdown});
    onShowExplanation();
  }, [analytics, zone.center_id, onShowExplanation]);

  return (
    <Dropdown label={zone.center_id} onOpen={onOpen}>
      <DropdownSection title={LOCAL_SECTION_TITLE}>
        <DropdownRow selected leading={<AvalancheDangerIcon style={DANGER_ICON_STYLE} level={dangerLevel} />}>
          <VStack space={2}>
            <BodySmSemibold>{zone.name}</BodySmSemibold>
            <DangerLevelTitle dangerLevel={dangerLevel} color="text.secondary" />
          </VStack>
        </DropdownRow>
      </DropdownSection>
      <DropdownSection title={STATEWIDE_SECTION_TITLE}>
        <DropdownRow
          onPress={onPressSeeAreaOnMap}
          accessibilityLabel={SEE_ON_MAP_LABEL}
          leading={<Ionicons name="map-outline" size={ICON_SIZE} color={linkColor} />}
          trailing={<Ionicons name="chevron-forward" size={ICON_SIZE} color={linkColor} />}>
          <Body color={linkColor}>{SEE_ON_MAP_LABEL}</Body>
        </DropdownRow>
        <DropdownRow
          onPress={onReadCAICForecast}
          accessibilityLabel={READ_FORECAST_LABEL}
          leading={<Ionicons name="globe-outline" size={ICON_SIZE} color={linkColor} />}
          trailing={<Ionicons name="open-outline" size={ICON_SIZE} color={linkColor} />}>
          <Body color={linkColor}>{READ_FORECAST_LABEL}</Body>
        </DropdownRow>
      </DropdownSection>
      <DropdownFooterLink label={EXPLANATION_LABEL} onPress={onPressExplanation} />
    </Dropdown>
  );
};
