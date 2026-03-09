import {AntDesign, FontAwesome} from '@expo/vector-icons';
import {Camera} from '@rnmapbox/maps';
import {QueryState, incompleteQueryState} from 'components/content/QueryState';
import {MapViewZone, ZoneMap} from 'components/content/ZoneMap';
import {Center, HStack, VStack, View} from 'components/core';
import {FieldLabel} from 'components/form/FieldLabel';
import {KeysMatching} from 'components/form/TextField';
import {AvalancheCenterRegion, defaultMapRegionForGeometries, defaultMapRegionForZones} from 'components/helpers/geographicCoordinates';
import {AnimatedMapMarker} from 'components/map/AnimatedMapMarker';
import {LocationPoint, ObservationFormData} from 'components/observations/ObservationFormData';
import {Body, BodyXSm, Title3Black, bodySize} from 'components/text';
import {useMapLayer} from 'hooks/useMapLayer';
import React, {useCallback, useEffect, useRef, useState} from 'react';
import {useController} from 'react-hook-form';
import {Modal, View as RNView, TouchableOpacity} from 'react-native';
import {SafeAreaProvider, SafeAreaView} from 'react-native-safe-area-context';
import {colorLookup} from 'theme';
import {AvalancheCenterID, Position} from 'types/nationalAvalancheCenter';

interface LocationFieldProps {
  name: KeysMatching<ObservationFormData, LocationPoint>;
  label: string;
  center: AvalancheCenterID;
  disabled?: boolean;
  required?: boolean;
}
const positionToLocationPoint = (position: Position) => ({lat: position[1], lng: position[0]});
const locationPointToPosition = (locationPoint: LocationPoint) => [locationPoint.lng, locationPoint.lat];

export const LocationField = React.forwardRef<RNView, LocationFieldProps>(({name, label, center, disabled, required = false}, ref) => {
  const {
    field,
    fieldState: {error},
  } = useController<ObservationFormData>({name: name});
  const [modalVisible, setModalVisible] = useState(false);

  const toggleModal = useCallback(() => {
    setModalVisible(!modalVisible);
  }, [modalVisible, setModalVisible]);

  const toggleModalandClearLocation = useCallback(() => {
    field.onChange(null);
    setModalVisible(!modalVisible);
  }, [modalVisible, setModalVisible, field]);

  const value: LocationPoint | undefined = field.value as LocationPoint | undefined;

  const onLocationSelect = useCallback(
    (newLocation: LocationPoint) => {
      field.onChange(newLocation);
      setModalVisible(!modalVisible);
    },
    [field, setModalVisible, modalVisible],
  );

  return (
    <>
      <VStack width="100%" space={4} ref={ref}>
        <FieldLabel label={label} required={required} />
        <TouchableOpacity onPress={toggleModal} disabled={disabled}>
          <HStack
            borderWidth={2}
            borderColor={colorLookup('border.base')}
            borderRadius={4}
            justifyContent="space-between"
            alignItems="stretch"
            backgroundColor={error && colorLookup('error.outline')}>
            <View p={8}>
              <Body>{value ? `${value.lat.toFixed(5)}, ${value.lng.toFixed(5)}` : 'Tap to select a location on the map'}</Body>
            </View>
            <Center px={8} borderLeftWidth={2} borderColor={colorLookup('border.base')}>
              <FontAwesome name="map-marker" color={colorLookup('text')} size={bodySize} />
            </Center>
          </HStack>
        </TouchableOpacity>
        {/* TODO: animate the appearance/disappearance of the error string */}
        {error && <BodyXSm color={colorLookup('error.active')}>{error.message}</BodyXSm>}
      </VStack>
      {modalVisible && <LocationMap center={center} modalVisible={modalVisible} initialLocation={value} onClose={toggleModalandClearLocation} onSelect={onLocationSelect} />}
    </>
  );
});

interface LocationMapProps {
  center: AvalancheCenterID;
  modalVisible: boolean;
  initialLocation: LocationPoint | undefined;
  onClose: () => void;
  onSelect: (location: LocationPoint) => void;
}

const LocationMap: React.FunctionComponent<LocationMapProps> = ({center, modalVisible, initialLocation, onClose, onSelect}) => {
  const mapLayerResult = useMapLayer(center);
  const mapLayer = mapLayerResult.data;
  const [initialRegion, setInitialRegion] = useState<AvalancheCenterRegion>(defaultMapRegionForZones([]));
  const [selectedLocation, setSelectedLocation] = useState<LocationPoint | undefined>(initialLocation);
  const [mapReady, setMapReady] = useState<boolean>(false);
  const mapCameraRef = useRef<Camera>(null);

  const onMapPress = useCallback(
    (feature: GeoJSON.Feature) => {
      if (feature.geometry.type === 'Point') {
        setSelectedLocation(positionToLocationPoint(feature.geometry.coordinates));
      }
    },
    [setSelectedLocation],
  );

  useEffect(() => {
    if (mapLayer && !mapReady) {
      const location: LocationPoint = initialLocation || {lat: 0, lng: 0};
      const initialRegion = defaultMapRegionForGeometries(mapLayer.features.map(feature => feature.geometry));
      if (location.lat !== 0 && location.lng !== 0) {
        initialRegion.centerCoordinate.latitude = location.lat;
        initialRegion.centerCoordinate.longitude = location.lng;
      }

      setInitialRegion(initialRegion);
      setMapReady(true);
    }
  }, [initialLocation, mapLayer, mapCameraRef, setInitialRegion, mapReady, setMapReady]);

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

  const onSelectPressed = useCallback(() => {
    if (selectedLocation != null) {
      onSelect(selectedLocation);
    }
  }, [selectedLocation, onSelect]);

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
                onPress={onSelectPressed}
              />
            </HStack>
            <Center width="100%" height="100%">
              {incompleteQueryState(mapLayerResult) && <QueryState results={[mapLayerResult]} />}
              {mapReady && (
                <ZoneMap
                  ref={mapCameraRef}
                  style={{minWidth: '100%', minHeight: '100%'}}
                  zones={zones}
                  initialCameraBounds={initialRegion.cameraBounds}
                  onPolygonPress={emptyHandler}
                  onMapPress={onMapPress}
                  renderFillColor={false}>
                  {selectedLocation && <AnimatedMapMarker id="obs-location-marker" coordinate={locationPointToPosition(selectedLocation)} />}
                </ZoneMap>
              )}
            </Center>
          </VStack>
        </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
};

LocationField.displayName = 'LocationField';
