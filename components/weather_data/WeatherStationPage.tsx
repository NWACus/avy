import {incompleteQueryState, NotFound, QueryState} from 'components/content/QueryState';
import {NWACStationList} from 'components/weather_data/NWACWeatherStationList';
import {WeatherStationList} from 'components/weather_data/WeatherStationList';
import {WeatherStationMap} from 'components/weather_data/WeatherStationMap';
import {useAvalancheCenterMetadata} from 'hooks/useAvalancheCenterMetadata';
import {useMapLayer} from 'hooks/useMapLayer';
import {useWeatherStationsMetadata} from 'hooks/useWeatherStationsMetadata';
import React from 'react';
import {AvalancheCenterID} from 'types/nationalAvalancheCenter';
import {NotFoundError} from 'types/requests';
import {RequestedTimeString} from 'utils/date';

interface Props {
  center_id: AvalancheCenterID;
  requestedTime: RequestedTimeString;
}

export const WeatherStationPage: React.FC<Props> = ({center_id, requestedTime}) => {
  const avalancheCenterMetadataResult = useAvalancheCenterMetadata(center_id);
  const metadata = avalancheCenterMetadataResult.data;
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
  const [list, setList] = React.useState<boolean>(false);
  const mapLayerResult = useMapLayer(center_id);
  const mapLayer = mapLayerResult.data;
  const weatherStationsResult = useWeatherStationsMetadata(center_id, token);
  const weatherStations = weatherStationsResult.data;

  if (incompleteQueryState(mapLayerResult, weatherStationsResult) || !mapLayer || !weatherStations) {
    return <QueryState results={[mapLayerResult, weatherStationsResult]} />;
  }

  if (list) {
    return <WeatherStationList center_id={center_id} requestedTime={requestedTime} mapLayer={mapLayer} weatherStations={weatherStations} toggleMap={() => setList(false)} />;
  } else {
    return <WeatherStationMap center_id={center_id} requestedTime={requestedTime} mapLayer={mapLayer} weatherStations={weatherStations} toggleList={() => setList(true)} />;
  }
};
