import React from 'react';

import {StyleSheet, Text, View} from 'react-native';
import MapView, {Region} from 'react-native-maps';

import {AvalancheCenterForecastZonePolygons} from './AvalancheCenterForecastZonePolygons';

const defaultRegion: Region = {
  // TODO(skuznets): add a sane default for the US?
  latitude: 47.454188397509135,
  latitudeDelta: 3,
  longitude: -121.769123046875,
  longitudeDelta: 3,
};

export interface MapProps {
  centers: string[];
  date: string;
}

export const Map: React.FunctionComponent<MapProps> = ({centers, date}: MapProps) => {
  const [isReady, setIsReady] = React.useState<boolean>(false);
  const [region, setRegion] = React.useState<Region>({
    latitude: 0,
    longitude: 0,
    latitudeDelta: 0,
    longitudeDelta: 0,
  });

  function setReady() {
    setIsReady(true);
  }

  const largerRegion: Region = {
    latitude: region.latitude,
    longitude: region.longitude,
    latitudeDelta: 1.05 * region.latitudeDelta,
    longitudeDelta: 1.05 * region.longitudeDelta,
  };

  return (
    <>
      <MapView style={styles.map} initialRegion={defaultRegion} region={largerRegion} onLayout={setReady} zoomEnabled={centers.length > 1} scrollEnabled={centers.length > 1}>
        {isReady && centers.map(center_id => <AvalancheCenterForecastZonePolygons key={center_id} center_id={center_id} setRegion={setRegion} date={date} />)}
      </MapView>
      <View style={styles.legend}>
        <Text>help</Text>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  legend: {
    position: 'absolute',
    bottom: 50,
  },
});
