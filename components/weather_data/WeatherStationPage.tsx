import {useFocusEffect} from '@react-navigation/native';
import {incompleteQueryState, NotFound, QueryState} from 'components/content/QueryState';
import {NWACStationList} from 'components/weather_data/NWACWeatherStationList';
import {WeatherStationList} from 'components/weather_data/WeatherStationList';
import {WeatherStationMap} from 'components/weather_data/WeatherStationMap';
import {centerOrPartnerCenter} from 'components/weather_data/WeatherUtils';
import {useAllMapLayers} from 'hooks/useAllMapLayers';
import {useAvalancheCenterMetadata} from 'hooks/useAvalancheCenterMetadata';
import {useToggle} from 'hooks/useToggle';
import {useWeatherStationsMetadata} from 'hooks/useWeatherStationsMetadata';
import {usePostHog} from 'posthog-react-native';
import React, {useCallback, useMemo} from 'react';
import {AvalancheCenterID, mapFeaturesForCenter} from 'types/nationalAvalancheCenter';
import {NotFoundError} from 'types/requests';
import {RequestedTimeString} from 'utils/date';

interface Props {
  center_id: AvalancheCenterID;
  requestedTime: RequestedTimeString;
}

export const WeatherStationPage: React.FC<Props> = ({center_id, requestedTime}) => {
  const avalancheCenterMetadataResult = useAvalancheCenterMetadata(centerOrPartnerCenter(center_id));
  const metadata = avalancheCenterMetadataResult.data;
  const postHog = usePostHog();

  const recordAnalytics = useCallback(() => {
    if (postHog && center_id) {
      postHog.screen('weatherTab', {
        center: center_id,
      });
    }
  }, [postHog, center_id]);
  useFocusEffect(recordAnalytics);

  if (incompleteQueryState(avalancheCenterMetadataResult) || !metadata) {
    return <QueryState results={[avalancheCenterMetadataResult]} />;
  }

  if (!metadata.widget_config.stations?.token) {
    return <NotFound terminal what={[new NotFoundError('no token for stations', 'weather stations')]} />;
  }

  if (center_id === 'NWAC') {
    return <NWACStationList token={metadata.widget_config.stations?.token} requestedTime={requestedTime} />;
  }

  return <WeatherStations center_id={center_id} token={metadata.widget_config.stations?.token} requestedTime={requestedTime} />;
};

export const WeatherStations: React.FunctionComponent<{
  center_id: AvalancheCenterID;
  token: string;
  requestedTime: RequestedTimeString;
}> = ({center_id, token, requestedTime}) => {
  const [list, {toggle: toggleList}] = useToggle(false);
  const mapLayerResult = useAllMapLayers();
  const mapLayer = mapLayerResult.data;
  const weatherStationsResult = useWeatherStationsMetadata(centerOrPartnerCenter(center_id), token);
  const weatherStations = weatherStationsResult.data;

  const mapFeatures = useMemo(() => mapFeaturesForCenter(mapLayer, center_id), [mapLayer, center_id]);

  if (incompleteQueryState(mapLayerResult, weatherStationsResult) || !mapLayer || !weatherStations) {
    return <QueryState results={[mapLayerResult, weatherStationsResult]} />;
  }

  if (list) {
    return <WeatherStationList center_id={center_id} requestedTime={requestedTime} mapLayerFeatures={mapFeatures ?? []} weatherStations={weatherStations} toggleMap={toggleList} />;
  } else {
    return <WeatherStationMap center_id={center_id} requestedTime={requestedTime} mapLayerFeatures={mapFeatures} weatherStations={weatherStations} toggleList={toggleList} />;
  }
};
