import Ionicons from '@expo/vector-icons/Ionicons';
import {AvalancheDangerIcon} from 'components/AvalancheDangerIcon';
import {Dropdown, DropdownFooterLink, DropdownRow, DropdownSection} from 'components/content/Dropdown';
import {VStack} from 'components/core';
import {DangerLevelTitle} from 'components/helpers/DangerLevelTitle';
import {MapViewZone} from 'components/map/ZoneMap';
import {Body, BodySmSemibold} from 'components/text';
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

  const onReadCAICForecast = useCallback(() => openAvalancheCenterWebsite('CAIC'), [openAvalancheCenterWebsite]);

  return (
    <Dropdown label={zone.center_id}>
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
          onPress={onSeeAreaOnMap}
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
      <DropdownFooterLink label={EXPLANATION_LABEL} onPress={onShowExplanation} />
    </Dropdown>
  );
};
