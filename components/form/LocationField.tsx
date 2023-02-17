import {Center, HStack, View, VStack} from 'components/core';
import {Body, bodySize, BodyXSm, BodyXSmBlack, Title3Black} from 'components/text';
import React, {useCallback, useEffect, useState} from 'react';
import {ActivityIndicator, Image, Modal, TouchableOpacity} from 'react-native';
import {colorLookup} from 'theme';
import {useController} from 'react-hook-form';
import {defaultMapRegionForZones, ZoneMap} from 'components/content/ZoneMap';
import {useMapViewZones} from 'hooks/useMapViewZones';
import {AntDesign, FontAwesome} from '@expo/vector-icons';
import {SafeAreaProvider, SafeAreaView} from 'react-native-safe-area-context';
import {LatLng, Region} from 'react-native-maps';

interface LocationFieldProps {
  name: string;
  label: string;
}

export const LocationField: React.FC<LocationFieldProps> = ({name, label}) => {
  const {
    field: {onChange, value},
    fieldState: {error},
  } = useController({name});
  const [modalVisible, setModalVisible] = useState(false);

  const {isLoading, isError, data: zones} = useMapViewZones('NWAC', new Date());
  const [location, setLocation] = useState<LatLng>(value || {latitude: 0, longitude: 0});
  const [initialRegion, setInitialRegion] = useState<Region>(defaultMapRegionForZones([]));
  const [mapReady, setMapReady] = useState<boolean>(false);

  const toggleModal = useCallback(() => {
    setModalVisible(!modalVisible);
    if (modalVisible) {
      // We're closing the map, so update the form field
      onChange(location);
      console.log('set location to ', location);
    }
  }, [modalVisible, setModalVisible, onChange, location]);

  useEffect(() => {
    if (zones) {
      const initialRegion = defaultMapRegionForZones(zones);
      setInitialRegion(initialRegion);
      setLocation({latitude: initialRegion.latitude, longitude: initialRegion.longitude});
      setMapReady(true);
    }
  }, [zones, setInitialRegion, setLocation, setMapReady]);

  const onRegionChange = useCallback(
    (region: Region) => {
      setLocation({latitude: region.latitude, longitude: region.longitude});
    },
    [setLocation],
  );

  return (
    <VStack width="100%" space={4}>
      <BodyXSmBlack>{label}</BodyXSmBlack>
      <TouchableOpacity onPress={toggleModal}>
        <HStack borderWidth={2} borderColor={colorLookup('border.base')} borderRadius={4} justifyContent="space-between" alignItems="stretch">
          <View p={8}>
            <Body>{value ? `${value.latitude}, ${value.longitude}` : 'Select a location'}</Body>
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
                  {isLoading && <ActivityIndicator size="large" />}
                  {isError && <Body>Error loading map. Please try again.</Body>}
                  {mapReady && (
                    <>
                      <ZoneMap
                        animated={false}
                        style={{width: '100%', height: '100%'}}
                        zones={zones}
                        initialRegion={initialRegion}
                        onRegionChange={onRegionChange}
                        onRegionChangeComplete={onRegionChange}
                        onPressPolygon={() => undefined}
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
};
