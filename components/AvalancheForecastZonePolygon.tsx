import React, {PropsWithChildren} from 'react';
import {ActivityIndicator, Text, View} from 'react-native';
import {LatLng, Marker, Polygon, Region} from 'react-native-maps';
import {useNavigation} from '@react-navigation/native';

import {parseISO} from 'date-fns';
import polylabel from 'polylabel';

import {AvalancheDangerForecast, DangerLevel, Feature, FeatureComponent, ForecastPeriod} from '../types/nationalAvalancheCenter';
import {useAvalancheForecastFragment} from '../hooks/useAvalancheForecastFragment';
import {colorFor} from './AvalancheDangerPyramid';

const coordinateList = (geometry: FeatureComponent): number[][] => {
  let items: number[][] = [];
  if (geometry.type === 'Polygon') {
    items = geometry.coordinates[0];
  } else if (geometry.type === 'MultiPolygon') {
    items = geometry.coordinates[0][0];
  }
  return items;
};

const toLatLng = (item: number[]): LatLng => {
  return {longitude: item[0], latitude: item[1]};
};

interface NotificationMarkerProps {
  geometry: FeatureComponent;
}

const NotificationMarker: React.FunctionComponent<PropsWithChildren<NotificationMarkerProps>> = ({geometry, children}: PropsWithChildren<NotificationMarkerProps>) => {
  const coordinates: number[][] = coordinateList(geometry);
  return (
    <>
      <Polygon coordinates={coordinates.map(toLatLng)} fillColor={colorFor(DangerLevel.None).alpha(0.5).string()} />
      <Marker coordinate={toLatLng(polylabel([coordinates], 1.0))}>{children}</Marker>
    </>
  );
};

const updateRegionToContain = (previous: Region, coordinates: LatLng[]): Region => {
  // for the US, the "top left" corner of a map will have the largest latitude and smallest longitude
  let topLeft: LatLng = {
    longitude: previous.longitude - previous.longitudeDelta / 2,
    latitude: previous.latitude + previous.longitudeDelta / 2,
  };
  // similarly, the "bottom right" will have the smallest latitude and largest longitude
  let bottomRight: LatLng = {
    longitude: previous.longitude + previous.longitudeDelta / 2,
    latitude: previous.latitude - previous.longitudeDelta / 2,
  };
  for (const coordinate of coordinates) {
    // initialize our points to something on the polygons, so we always
    // end up centered around the polygons we're bounding
    if (topLeft.longitude === 0) {
      topLeft.longitude = coordinate.longitude;
      topLeft.latitude = coordinate.latitude;
      bottomRight.longitude = coordinate.longitude;
      bottomRight.latitude = coordinate.latitude;
    }
    if (coordinate.longitude < topLeft.longitude) {
      topLeft.longitude = coordinate.longitude;
    }
    if (coordinate.longitude > bottomRight.longitude) {
      bottomRight.longitude = coordinate.longitude;
    }

    if (coordinate.latitude > topLeft.latitude) {
      topLeft.latitude = coordinate.latitude;
    }
    if (coordinate.latitude < bottomRight.latitude) {
      bottomRight.latitude = coordinate.latitude;
    }
  }
  return {
    latitude: (topLeft.latitude + bottomRight.latitude) / 2,
    latitudeDelta: topLeft.latitude - bottomRight.latitude,
    longitude: (topLeft.longitude + bottomRight.longitude) / 2,
    longitudeDelta: bottomRight.longitude - topLeft.longitude,
  };
};

export interface AvalancheForecastZonePolygonProps {
  feature: Feature;
  date: string;
  setRegion: React.Dispatch<React.SetStateAction<Region>>;
}

export const AvalancheForecastZonePolygon: React.FunctionComponent<AvalancheForecastZonePolygonProps> = ({feature, date, setRegion}: AvalancheForecastZonePolygonProps) => {
  const coordinates: LatLng[] = coordinateList(feature.geometry).map(toLatLng);
  React.useEffect(() => {
    setRegion((previous: Region) => updateRegionToContain(previous, coordinates));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const forecastDate: Date = parseISO(date);
  const navigation = useNavigation();
  const {isLoading, isError, data: forecast, error} = useAvalancheForecastFragment(feature.properties.center_id, feature.id, forecastDate);
  if (isLoading) {
    return (
      <NotificationMarker geometry={feature.geometry}>
        <ActivityIndicator />
      </NotificationMarker>
    );
  }
  if (isError) {
    return (
      <NotificationMarker geometry={feature.geometry}>
        <View>
          <Text>{`Could not fetch forecast for ${feature.properties.name}: ${error?.message}.`}</Text>
        </View>
      </NotificationMarker>
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
    <Polygon
      coordinates={coordinates}
      fillColor={colorFor(dangerLevel).alpha(feature.properties.fillOpacity).string()}
      strokeColor={colorFor(dangerLevel).string()}
      tappable={true}
      onPress={() => {
        navigation.navigate('forecast', {
          center_id: feature.properties.center_id,
          forecast_zone_id: feature.id,
          date: date,
        });
      }}
    />
  );
};
