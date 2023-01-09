import React from 'react';

import {Region} from 'react-native-maps';

import {useMapLayer} from 'hooks/useMapLayer';
import {AvalancheForecastZonePolygon} from './AvalancheForecastZonePolygon';
import {AvalancheCenterID} from '../types/nationalAvalancheCenter';

export interface AvalancheCenterForecastZonePolygonsProps {
  center_id: AvalancheCenterID;
  date: string;
  setRegion: React.Dispatch<React.SetStateAction<Region>>;
}

export const AvalancheCenterForecastZonePolygons: React.FunctionComponent<AvalancheCenterForecastZonePolygonsProps> = ({center_id, date, setRegion}) => {
  const {isLoading, isError, data: mapLayer /*, error */} = useMapLayer(center_id);
  if (isLoading) {
    // TODO(skuznets): without the zones, we don't know where on the map to put these loading/error elements ... ?
    return <></>;
    // return <ActivityIndicator />;
  }
  if (isError) {
    return (
      <></>
      // <View>
      //   <Text>{`Could not fetch forecast zones for ${center_id}: ${error?.message}.`}</Text>
      // </View>
    );
  }

  return (
    <>
      {mapLayer?.features
        .filter(feature => feature.type === 'Feature')
        .map(feature => (
          <AvalancheForecastZonePolygon key={center_id + feature.id} feature={feature} setRegion={setRegion} date={date} />
        ))}
    </>
  );
};
