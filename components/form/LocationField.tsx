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
import {Modal, PanResponder, View as RNView, TouchableOpacity} from 'react-native';
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
const locationPointToLatLng = (locationPoint: LocationPoint) => ({
  latitude: locationPoint.lat,
  longitude: locationPoint.lng,
});

export const LocationField = React.forwardRef<RNView, LocationFieldProps>(({name, label, center, disabled}, ref) => {
  const {
    field,
    fieldState: {error},
  } = useController<ObservationFormData>({name: name});
  const [modalVisible, setModalVisible] = useState(false);

  const toggleModal = useCallback(() => {
    setModalVisible(!modalVisible);
  }, [modalVisible, setModalVisible]);

  const value: LocationPoint | undefined = field.value as LocationPoint | undefined;

  const onLocationSave = useCallback(
    (newLocation: LocationPoint) => {
      field.onChange(newLocation);
      setModalVisible(!modalVisible);
    },
    [field, setModalVisible, modalVisible],
  );

  return (
    <>
      <VStack width="100%" space={4} ref={ref}>
        <BodySmBlack>{label}</BodySmBlack>
        <TouchableOpacity onPress={toggleModal} disabled={disabled}>
          <HStack borderWidth={2} borderColor={colorLookup('border.base')} borderRadius={4} justifyContent="space-between" alignItems="stretch">
            <View p={8}>
              <Body>{value ? `${value.lat.toFixed(5)}, ${value.lng.toFixed(5)}` : 'Tap to select a location on the map'}</Body>
            </View>
            <Center px={8} borderLeftWidth={2} borderColor={colorLookup('border.base')}>
              <FontAwesome name="map-marker" color={colorLookup('text')} size={bodySize} />
            </Center>
          </HStack>
        </TouchableOpacity>
        {/* TODO: animate the appearance/disappearance of the error string */}
        {error && <BodyXSm color={colorLookup('error.900')}>{error.message}</BodyXSm>}
      </VStack>
      {modalVisible && <LocationMap center={center} modalVisible={modalVisible} initialLocation={value} onClose={toggleModal} onSave={onLocationSave} />}
    </>
  );
});

interface LocationMapProps {
  center: AvalancheCenterID;
  modalVisible: boolean;
  initialLocation: LocationPoint | undefined;
  onClose: () => void;
  onSave: (location: LocationPoint) => void;
}

const LocationMap: React.FunctionComponent<LocationMapProps> = ({center, modalVisible, initialLocation, onClose, onSave}) => {
  const mapLayerResult = useMapLayer(center);
  const mapLayer = mapLayerResult.data;
  const [initialRegion, setInitialRegion] = useState<Region>(defaultMapRegionForZones([]));
  const [selectedLocation, setSelectedLocation] = useState<LocationPoint | undefined>(initialLocation);
  const [mapReady, setMapReady] = useState<boolean>(false);
  const mapRef = useRef<MapView>(null);

  const mapPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderRelease: (event, gestureState) => {
        if (gestureState.dx != 0 && gestureState.dy != 0) {
          return;
        }

        void (async () => {
          const point = {x: event.nativeEvent.locationX, y: event.nativeEvent.locationY};
          const coordinate = await mapRef.current?.coordinateForPoint(point);
          if (coordinate) {
            setSelectedLocation(latLngToLocationPoint(coordinate));
          }
        })();
      },
    }),
  ).current;

  useEffect(() => {
    if (mapLayer && !mapReady) {
      const location: LocationPoint = initialLocation || {lat: 0, lng: 0};
      const initialRegion = defaultMapRegionForGeometries(mapLayer.features.map(feature => feature.geometry));
      if (location.lat !== 0 && location.lng !== 0) {
        initialRegion.latitude = location.lat;
        initialRegion.longitude = location.lng;
      }

      setInitialRegion(initialRegion);
      setMapReady(true);
    }
  }, [initialLocation, mapLayer, setInitialRegion, mapReady, setMapReady]);

  const zones: MapViewZone[] =
    mapLayer?.features.map(
      (feature): MapViewZone => ({
        zone_id: feature.id,
        name: feature.properties.name,
        center_id: center,
        feature: feature,
        hasWarning: feature.properties.warning?.product !== null,
        start_date: feature.properties.start_date,
        end_date: feature.properties.end_date,
        fillOpacity: feature.properties.fillOpacity,
      }),
    ) ?? [];

  const emptyHandler = useCallback(() => undefined, []);

  const onSaveLocation = useCallback(() => {
    if (selectedLocation != null) {
      onSave(selectedLocation);
    }
  }, [selectedLocation, onSave]);

  return (
    <Modal visible={modalVisible} onRequestClose={onClose} animationType="slide">
      <SafeAreaProvider>
        <SafeAreaView style={{width: '100%', height: '100%'}}>
          <VStack width="100%" height="100%">
            <HStack justifyContent="space-between" alignItems="center" pb={8} px={20}>
              <AntDesign.Button
                size={24}
                color={colorLookup('text')}
                name="close"
                backgroundColor="white"
                iconStyle={{marginLeft: 0, marginRight: 0, marginTop: 1}}
                style={{textAlign: 'center'}}
                onPress={onClose}
              />
              <Title3Black>Pick a location</Title3Black>
              <AntDesign.Button
                size={24}
                color={colorLookup('text')}
                name="check"
                backgroundColor="white"
                disabled={selectedLocation == null}
                iconStyle={{marginLeft: 20, marginRight: 0, marginTop: 1}}
                style={{textAlign: 'center'}}
                onPress={onSaveLocation}
              />
            </HStack>
            <Center width="100%" height="100%">
              {incompleteQueryState(mapLayerResult) && <QueryState results={[mapLayerResult]} />}
              {mapReady && (
                <View {...mapPanResponder.panHandlers}>
                  <ZoneMap
                    ref={mapRef}
                    animated={false}
                    style={{minWidth: '100%', minHeight: '100%'}}
                    zones={zones}
                    initialRegion={initialRegion}
                    onPressPolygon={emptyHandler}
                    renderFillColor={false}>
                    {selectedLocation != null && <MapMarker coordinate={locationPointToLatLng(selectedLocation)} />}
                  </ZoneMap>
                </View>
              )}
            </Center>
          </VStack>
        </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
};
LocationField.displayName = 'LocationField';
