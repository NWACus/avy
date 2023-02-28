import {AntDesign, FontAwesome} from '@expo/vector-icons';
import {incompleteQueryState, QueryState} from 'components/content/QueryState';
import {defaultMapRegionForGeometries, defaultMapRegionForZones, MapViewZone, ZoneMap} from 'components/content/ZoneMap';
import {Center, HStack, View, VStack} from 'components/core';
import {Body, bodySize, BodyXSm, BodyXSmBlack, Title3Black} from 'components/text';
import {useMapLayer} from 'hooks/useMapLayer';
import React, {useCallback, useEffect, useState} from 'react';
import {useController} from 'react-hook-form';
import {Image, Modal, TouchableOpacity, View as RNView} from 'react-native';
import {Region} from 'react-native-maps';
import {SafeAreaProvider, SafeAreaView} from 'react-native-safe-area-context';
import {colorLookup} from 'theme';
import {AvalancheCenterID} from 'types/nationalAvalancheCenter';

interface LocationFieldProps {
  name: string;
  label: string;
  center: AvalancheCenterID;
}

export const LocationField = React.forwardRef<RNView, LocationFieldProps>(({name, label, center}, ref) => {
  const {
    field: {onChange, value},
    fieldState: {error},
  } = useController({name});
  const [modalVisible, setModalVisible] = useState(false);

  const mapLayerResult = useMapLayer(center);
  const mapLayer = mapLayerResult.data;
  const [initialRegion, setInitialRegion] = useState<Region>(defaultMapRegionForZones([]));
  const [mapReady, setMapReady] = useState<boolean>(false);

  const toggleModal = useCallback(() => {
    setModalVisible(!modalVisible);
  }, [modalVisible, setModalVisible]);

  const onChangeRegion = useCallback(
    (region: Region) => {
      onChange({lat: region.latitude, lng: region.longitude});
    },
    [onChange],
  );

  useEffect(() => {
    if (mapLayer && !mapReady) {
      const location = value || {lat: 0, lng: 0};
      const initialRegion = defaultMapRegionForGeometries(mapLayer.features.map(feature => feature.geometry));
      if (location.lat !== 0 && location.lng !== 0) {
        initialRegion.latitude = location.lat;
        initialRegion.longitude = location.lng;
      }
      setInitialRegion(initialRegion);
      setMapReady(true);
    }
  }, [mapLayer, setInitialRegion, onChangeRegion, value, mapReady, setMapReady]);

  const zones: MapViewZone[] = mapLayer.features.map(feature => ({
    zone_id: feature.id,
    center_id: center,
    geometry: feature.geometry,
    hasWarning: feature.properties.warning?.product === 'warning',
    start_date: feature.properties.start_date,
    end_date: feature.properties.end_date,
    fillOpacity: feature.properties.fillOpacity,
  }));

  return (
    <VStack width="100%" space={4} ref={ref}>
      <BodyXSmBlack>{label}</BodyXSmBlack>
      <TouchableOpacity onPress={toggleModal}>
        <HStack borderWidth={2} borderColor={colorLookup('border.base')} borderRadius={4} justifyContent="space-between" alignItems="stretch">
          <View p={8}>
            <Body>{value ? `${value.lat}, ${value.lng}` : 'Select a location'}</Body>
          </View>
          <Center px={8} borderLeftWidth={2} borderColor={colorLookup('border.base')}>
            <FontAwesome name="map-marker" color={colorLookup('text')} size={bodySize} />
          </Center>
        </HStack>
      </TouchableOpacity>
      {/* TODO: animate the appearance/disappearance of the error string */}
      {error && <BodyXSm color={colorLookup('error.900')}>{error.message}</BodyXSm>}

      {modalVisible && (
        <Modal visible={modalVisible} onRequestClose={toggleModal} animationType="slide">
          <SafeAreaProvider>
            <SafeAreaView style={{width: '100%', height: '100%'}}>
              <VStack width="100%" height="100%">
                <HStack justifyContent="space-between" alignItems="center" pb={8} px={16}>
                  <View width={48} />
                  <Title3Black>Pick a location</Title3Black>
                  <AntDesign.Button
                    size={24}
                    color={colorLookup('text')}
                    name="close"
                    backgroundColor="white"
                    iconStyle={{marginLeft: 0, marginRight: 0, marginTop: 1}}
                    style={{textAlign: 'center'}}
                    onPress={toggleModal}
                  />
                </HStack>
                <Center width="100%" height="100%">
                  {incompleteQueryState(mapLayerResult) && <QueryState results={[mapLayerResult]} />}
                  {mapReady && (
                    <>
                      <ZoneMap
                        animated={false}
                        style={{width: '100%', height: '100%'}}
                        zones={zones}
                        initialRegion={initialRegion}
                        onRegionChange={onChangeRegion}
                        onRegionChangeComplete={onChangeRegion}
                        onPressPolygon={() => undefined}
                        renderFillColor={false}
                      />
                      <Center width="100%" height="100%" position="absolute" backgroundColor={undefined} pointerEvents="none">
                        <Image source={require('assets/map-marker.png')} style={{width: 40, height: 40, transform: [{translateY: -20}]}} />
                      </Center>
                    </>
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
