import React from 'react';

import {ActivityIndicator, Text, View} from 'react-native';
import {Region} from 'react-native-maps';
import {useNavigation} from '@react-navigation/native';

import {useMapLayer} from '../hooks/useMapLayer';
import {AvalancheForecastZonePolygon} from './AvalancheForecastZonePolygon';

export interface AvalancheCenterForecastZonePolygonsProps {
  center_id: string;
  date: string;
  setRegion: React.Dispatch<React.SetStateAction<Region>>;
}

export const AvalancheCenterForecastZonePolygons: React.FunctionComponent<AvalancheCenterForecastZonePolygonsProps> = ({center_id, date, setRegion}) => {
  const navigation = useNavigation();
  const {isLoading, isError, data: mapLayer, error} = useMapLayer(center_id);
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
          <AvalancheForecastZonePolygon key={center_id + feature.id} feature={feature} setRegion={setRegion} date={date} navigation={navigation} />
        ))}
    </>
  );
};
