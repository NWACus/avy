import {AntDesign, FontAwesome} from '@expo/vector-icons';
import {QueryState, incompleteQueryState} from 'components/content/QueryState';
import {MapViewZone, ZoneMap, defaultMapRegionForGeometries, defaultMapRegionForZones} from 'components/content/ZoneMap';
import {Center, HStack, VStack, View} from 'components/core';
import {KeysMatching} from 'components/form/TextField';
import {LocationPoint, ObservationFormData} from 'components/observations/ObservationFormData';
import {Body, BodySmBlack, BodyXSm, Title3Black, bodySize} from 'components/text';
import {useMapLayer} from 'hooks/useMapLayer';
import React, {useCallback, useEffect, useRef, useState} from 'react';
import {useController} from 'react-hook-form';
import {GestureResponderEvent, Modal, Pressable, View as RNView, TouchableOpacity} from 'react-native';
import MapView, {LatLng, MapMarker, Region} from 'react-native-maps';
import {SafeAreaProvider, SafeAreaView} from 'react-native-safe-area-context';
import {colorLookup} from 'theme';
import {AvalancheCenterID} from 'types/nationalAvalancheCenter';

interface LocationFieldProps {
  name: KeysMatching<ObservationFormData, LocationPoint>;
  label: string;
  center: AvalancheCenterID;
  disabled?: boolean;
}

const latLngToLocationPoint = (latLng: LatLng) => ({lat: latLng.latitude, lng: latLng.longitude});
const locationPointToLatLng = (locationPoint: LocationPoint) => ({latitude: locationPoint.lat, longitude: locationPoint.lng});

export const LocationField = React.forwardRef<RNView, LocationFieldProps>(({name, label, center, disabled}, ref) => {
  const {
    field,
    fieldState: {error},
  } = useController<ObservationFormData>({name: name});
  const [modalVisible, setModalVisible] = useState(false);

  const mapLayerResult = useMapLayer(center);
  const mapLayer = mapLayerResult.data;
  const [initialRegion, setInitialRegion] = useState<Region>(defaultMapRegionForZones([]));
  const [mapReady, setMapReady] = useState<boolean>(false);
  const mapRef = useRef<MapView>(null);

  const [observationLocation, setObservationLocation] = useState<LocationPoint | null>(field.value as LocationPoint);

  const onOpenModal = useCallback(() => {
    setModalVisible(true);
  }, [setModalVisible]);

  const onCloseModal = useCallback(() => {
    setObservationLocation(field.value as LocationPoint);
    setModalVisible(false);
  }, [field, setModalVisible, setObservationLocation]);

  const onSave = useCallback(() => {
    field.onChange(observationLocation);
    setModalVisible(false);
  }, [modalVisible, setModalVisible, field]);

  const onClearLocation = useCallback(() => {
    field.onChange(null);
    // There's something weird where the value is set to null but passing field.value as LocationPoint to this setter doesn't work as intended
    setObservationLocation(null);
  }, [field, setObservationLocation, observationLocation]);

  const value: LocationPoint | undefined = field.value as LocationPoint | undefined;

  useEffect(() => {
    if (mapLayer && !mapReady) {
      const location: LocationPoint = value || {lat: 0, lng: 0};
      const initialRegion = defaultMapRegionForGeometries(mapLayer.features.map(feature => feature.geometry));
      if (location.lat !== 0 && location.lng !== 0) {
        initialRegion.latitude = location.lat;
        initialRegion.longitude = location.lng;
      }
      setInitialRegion(initialRegion);
      setMapReady(true);
    }
  }, [mapLayer, setInitialRegion, value, mapReady, setMapReady]);

  const zones: MapViewZone[] =
    mapLayer?.features.map(feature => ({
      zone_id: feature.id,
      name: feature.properties.name,
      center_id: center,
      geometry: feature.geometry,
      hasWarning: feature.properties.warning?.product !== null,
      start_date: feature.properties.start_date,
      end_date: feature.properties.end_date,
      fillOpacity: feature.properties.fillOpacity,
    })) ?? [];

  const onPress = useCallback(
    (event: GestureResponderEvent) => {
      void (async () => {
        const point = {x: event.nativeEvent.locationX, y: event.nativeEvent.locationY};
        const coordinate = await mapRef.current?.coordinateForPoint(point);
        if (coordinate) {
          setObservationLocation(latLngToLocationPoint(coordinate));
        }
      })();
    },
    [setObservationLocation],
  );
  const emptyHandler = useCallback(() => undefined, []);

  return (
    <VStack width="100%" space={4} ref={ref}>
      <BodySmBlack>{label}</BodySmBlack>
      <TouchableOpacity onPress={onOpenModal} disabled={disabled}>
        <HStack borderWidth={2} borderColor={colorLookup('border.base')} borderRadius={4} justifyContent="space-between" alignItems="stretch">
          <View p={8}>
            <Body>{value ? `${value.lat.toFixed(5)}, ${value.lng.toFixed(5)}` : 'Select a location'}</Body>
          </View>
          <Center px={8} borderLeftWidth={2} borderColor={colorLookup('border.base')}>
            <FontAwesome name="map-marker" color={colorLookup('text')} size={bodySize} />
          </Center>
        </HStack>
      </TouchableOpacity>
      {/* TODO: animate the appearance/disappearance of the error string */}
      {error && <BodyXSm color={colorLookup('error.900')}>{error.message}</BodyXSm>}
      {field.value != null && (
        <TouchableOpacity onPress={onClearLocation} disabled={disabled}>
          <Body color={colorLookup('warning.700')}>Clear Location</Body>
        </TouchableOpacity>
      )}
      {modalVisible && (
        <Modal visible={modalVisible} onRequestClose={onCloseModal} animationType="slide">
          <SafeAreaProvider>
            <SafeAreaView style={{width: '100%', height: '100%'}}>
              <VStack width="100%" height="100%">
                <HStack justifyContent="space-between" alignItems="center" pb={8} px={20}>
                  <View width={80} />
                  <Title3Black>Pick a location</Title3Black>
                  <AntDesign.Button
                    size={24}
                    color={colorLookup('text')}
                    name="check"
                    backgroundColor="white"
                    iconStyle={{marginLeft: 20, marginRight: 0, marginTop: 1}}
                    style={{textAlign: 'center'}}
                    onPress={onSave}
                  />
                  <AntDesign.Button
                    size={24}
                    color={colorLookup('text')}
                    name="close"
                    backgroundColor="white"
                    iconStyle={{marginLeft: 0, marginRight: 0, marginTop: 1}}
                    style={{textAlign: 'center'}}
                    onPress={onCloseModal}
                  />
                </HStack>
                <Center width="100%" height="100%">
                  {incompleteQueryState(mapLayerResult) && <QueryState results={[mapLayerResult]} />}
                  {mapReady && (
                    <Pressable onPress={onPress}>
                      <ZoneMap
                        ref={mapRef}
                        animated={false}
                        style={{minWidth: '100%', minHeight: '100%'}}
                        zones={zones}
                        initialRegion={initialRegion}
                        onPressPolygon={emptyHandler}
                        renderFillColor={false}>
                        {observationLocation != null && <MapMarker coordinate={locationPointToLatLng(observationLocation)} />}
                      </ZoneMap>
                    </Pressable>
                  )}
                </Center>
              </VStack>
            </SafeAreaView>
          </SafeAreaProvider>
        </Modal>
      )}
    </VStack>
  );
});
LocationField.displayName = 'LocationField';
