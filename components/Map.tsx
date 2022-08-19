import React from 'react';

import {StyleSheet, Text, View} from 'react-native';
import MapView, {Region} from 'react-native-maps';

import Color from 'color';

import {DangerLevel, dangerText} from '../types/nationalAvalancheCenter';
import {AvalancheCenterForecastZonePolygons} from './AvalancheCenterForecastZonePolygons';
import {colorFor} from './AvalancheDangerPyramid';

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
        <Text style={styles.legendTitle}>Avalanche Danger Scale</Text>
        <View style={styles.legendItems}>
          {Object.keys(DangerLevel)
            .filter(key => Number.isNaN(+key))
            .filter(key => DangerLevel[key] != DangerLevel.None)
            .map(key => {
              const level: DangerLevel = DangerLevel[key];
              const backgroundColor: Color = colorFor(level).alpha(0.85);
              const textColor: Color = backgroundColor.isLight() ? Color('black') : Color('white');
              return (
                <View key={key} style={{...styles.legendMarker, backgroundColor: backgroundColor.string()}}>
                  <Text style={{color: textColor.string()}}>{dangerText(DangerLevel[key])}</Text>
                </View>
              );
            })}
        </View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  legend: {
    backgroundColor: 'white',
    padding: 2,
    margin: 2,
    borderStyle: 'solid',
    borderWidth: 1.2,
    borderColor: 'rgb(200,202,206)',
    shadowOffset: {width: 1, height: 2},
    shadowOpacity: 0.8,
    shadowColor: 'rgb(157,162,165)',
    borderRadius: 5,
    position: 'absolute',
    width: '100%',
    bottom: 5,
    display: 'flex',
    flex: 1,
    flexDirection: 'column',
  },
  legendTitle: {
    padding: 2,
    fontWeight: 'bold',
  },
  legendItems: {
    width: '100%',
    display: 'flex',
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
  },
  legendMarker: {
    padding: 2,
    marginLeft: 2,
    marginRight: 2,
    borderStyle: 'solid',
    borderWidth: 1.2,
    borderColor: 'rgb(200,202,206)',
    shadowOffset: {width: 1, height: 2},
    shadowOpacity: 0.8,
    shadowColor: 'rgb(157,162,165)',
    borderRadius: 5,
  },
});
