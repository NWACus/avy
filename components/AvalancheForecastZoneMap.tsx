import React from 'react';

import {ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View, ViewStyle} from 'react-native';
import MapView, {Region} from 'react-native-maps';
import {useNavigation} from '@react-navigation/native';
import {FontAwesome5} from '@expo/vector-icons';

import Color from 'color';
import {parseISO} from 'date-fns';

import {AvalancheDangerForecast, DangerLevel, Feature, ForecastPeriod} from '../types/nationalAvalancheCenter';
import {AvalancheCenterForecastZonePolygons} from './AvalancheCenterForecastZonePolygons';
import {colorFor} from './AvalancheDangerPyramid';
import {AvalancheDangerIcon} from './AvalancheDangerIcon';
import {dangerText} from './helpers/dangerText';
import {useMapLayer} from 'hooks/useMapLayer';
import {useAvalancheForecastFragment} from 'hooks/useAvalancheForecastFragment';
import {HomeStackNavigationProps} from '../routes';

export const defaultRegion: Region = {
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

export const AvalancheForecastZoneMap: React.FunctionComponent<MapProps> = ({centers, date}: MapProps) => {
  const [isReady, setIsReady] = React.useState<boolean>(false);
  const [region, setRegion] = React.useState<Region>({
    latitude: 0,
    longitude: 0,
    latitudeDelta: 0,
    longitudeDelta: 0,
  });
  const [isList, setIsList] = React.useState<boolean>(false);

  function toggleList() {
    setIsList(v => !v);
  }

  function setReady() {
    setIsReady(true);
  }

  const largerRegion: Region = {
    latitude: region.latitude,
    longitude: region.longitude,
    latitudeDelta: 1.05 * region.latitudeDelta,
    longitudeDelta: 1.05 * region.longitudeDelta,
  };

  if (isList) {
    return (
      <>
        {centers.map(center_id => (
          <AvalancheForecastZoneCards key={center_id} center_id={center_id} date={date} cardStyle={styles.verticalCard} horizontal={false} />
        ))}
        <TouchableOpacity onPress={toggleList}>
          <View style={styles.toggle}>
            <FontAwesome5 name={'map'} size={32} />
          </View>
        </TouchableOpacity>
      </>
    );
  } else {
    return (
      <>
        <MapView
          style={styles.map}
          initialRegion={defaultRegion}
          region={largerRegion}
          onLayout={setReady}
          zoomEnabled={centers.length > 1}
          scrollEnabled={centers.length > 1}
          provider={'google'}>
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
        <View style={styles.footer}>
          {centers.map(center_id => (
            <AvalancheForecastZoneCards key={center_id} center_id={center_id} date={date} cardStyle={styles.horizontalCard} horizontal={true} />
          ))}
          <TouchableOpacity onPress={toggleList}>
            <View style={styles.toggle}>
              <FontAwesome5 name={'list-ul'} size={32} />
            </View>
          </TouchableOpacity>
        </View>
      </>
    );
  }
};

export const CARD_WIDTH = 0.9; // proportion of overall width that one card takes up
export const CARD_WHITESPACE = (1 - CARD_WIDTH) / 2; // proportion of overall width that the spacing between cards takes up on the screen
export const CARD_SPACING = CARD_WHITESPACE / 2; // proportion of overall width that the spacing between two cards takes up
export const CARD_MARGIN = CARD_SPACING / 2; // proportion of overall width that each card needs as a margin

export const AvalancheForecastZoneCards: React.FunctionComponent<{
  center_id: string;
  date: string;
  cardStyle: ViewStyle;
  horizontal: boolean;
}> = ({center_id, date, cardStyle, horizontal}) => {
  const {width} = useWindowDimensions();
  const {isLoading, isError, data: mapLayer, error} = useMapLayer(center_id);
  if (isLoading) {
    return (
      <FlatList
        horizontal={true}
        data={[{id: center_id, title: center_id}]}
        renderItem={({item}) => (
          <View style={cardStyle}>
            <Text>{item.title}</Text>
            <ActivityIndicator />
          </View>
        )}
      />
    );
  }
  if (isError) {
    return (
      <FlatList
        horizontal={true}
        data={[{id: center_id, title: center_id}]}
        renderItem={({item}) => (
          <View style={cardStyle}>
            <Text>{item.title}</Text>
            <Text>{`Could not fetch forecast zones for ${center_id}: ${error?.message}.`}</Text>
            <ActivityIndicator />
          </View>
        )}
      />
    );
  }

  let props = {};
  if (horizontal) {
    props = {
      horizontal: true,
      snapToAlignment: 'start',
      decelerationRate: 'fast',
      snapToOffsets: mapLayer?.features.filter(feature => feature.type === 'Feature').map((feature, index) => index * CARD_WIDTH * width + (index - 1) * CARD_SPACING * width),
      contentInset: {
        left: CARD_MARGIN * width,
        right: CARD_MARGIN * width,
      },
      contentContainerStyle: {paddingHorizontal: CARD_MARGIN * width},
    };
  }

  return (
    <FlatList
      {...props}
      data={mapLayer?.features
        .filter(feature => feature.type === 'Feature')
        .map(feature => ({
          id: center_id + feature.id,
          feature: feature,
          date: date,
        }))}
      renderItem={({item}) => <AvalancheForecastZoneCard key={item.id} feature={item.feature} date={item.date} style={cardStyle} />}></FlatList>
  );
};

export const AvalancheForecastZoneCard: React.FunctionComponent<{
  feature: Feature;
  date: string;
  style: ViewStyle;
}> = ({feature, date, style}) => {
  const forecastDate: Date = parseISO(date);
  const {width} = useWindowDimensions();
  const navigation = useNavigation<HomeStackNavigationProps>();
  const {isLoading, isError, data: forecast, error} = useAvalancheForecastFragment(feature.properties.center_id, feature.id, forecastDate);
  if (isLoading) {
    return (
      <View style={style}>
        <ActivityIndicator />
      </View>
    );
  }
  if (isError) {
    return (
      <View style={style}>
        <Text>{`Could not fetch forecast for ${feature.properties.name}: ${error?.message}.`}</Text>
      </View>
    );
  }

  let dangerLevel: DangerLevel = DangerLevel.None;
  if (forecast) {
    const currentDanger: AvalancheDangerForecast | undefined = forecast.danger.find(item => item.valid_day === ForecastPeriod.Current);
    if (currentDanger) {
      dangerLevel = Math.max(currentDanger.lower, currentDanger.middle, currentDanger.upper);
    }
  }
  return (
    <TouchableOpacity
      onPress={() => {
        navigation.navigate('forecast', {
          center_id: feature.properties.center_id,
          forecast_zone_id: feature.id,
          date: date,
        });
      }}
      style={{
        width: width * CARD_WIDTH,
        marginRight: CARD_MARGIN * width,
        marginLeft: CARD_MARGIN * width,
        ...style,
      }}>
      <View style={styles.header}>
        <AvalancheDangerIcon style={styles.icon} level={dangerLevel} />
        <Text style={styles.title}>{feature.properties.name}</Text>
      </View>
    </TouchableOpacity>
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
    top: 0,
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
  footer: {
    position: 'absolute',
    width: '100%',
    height: '30%',
    bottom: 2,
    justifyContent: 'flex-start',
    flexDirection: 'column-reverse',
    alignItems: 'flex-start',
  },
  horizontalCard: {
    padding: 2,
    borderStyle: 'solid',
    backgroundColor: 'white',
    borderWidth: 1.2,
    borderColor: 'rgb(200,202,206)',
    shadowOffset: {width: 1, height: 2},
    shadowOpacity: 0.8,
    shadowColor: 'rgb(157,162,165)',
    borderRadius: 5,
  },
  verticalCard: {
    width: '100%',
    padding: 2,
    borderStyle: 'solid',
    borderWidth: 1.2,
    borderColor: 'rgb(200,202,206)',
    shadowOffset: {width: 1, height: 2},
    shadowOpacity: 0.8,
    shadowColor: 'rgb(157,162,165)',
    borderRadius: 5,
  },
  header: {
    width: '100%',
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  icon: {
    height: 50,
  },
  title: {
    fontWeight: 'bold',
  },
  toggle: {
    backgroundColor: 'white',
    padding: 2,
    margin: 5,
    borderStyle: 'solid',
    borderWidth: 1.2,
    borderColor: 'rgb(200,202,206)',
    shadowOffset: {width: 1, height: 2},
    shadowOpacity: 0.8,
    shadowColor: 'rgb(157,162,165)',
    borderRadius: 5,
  },
});
