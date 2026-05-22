import Ionicons from '@expo/vector-icons/Ionicons';
import {DrawerActions, useNavigation} from '@react-navigation/native';
import {AvalancheCenterLogo} from 'components/AvalancheCenterLogo';
import {HStack, View} from 'components/core';
import {Title3Black} from 'components/text';
import {LinearGradient} from 'expo-linear-gradient';
import {useAvalancheCenterCapabilities} from 'hooks/useAvalancheCenterCapabilities';
import React, {useCallback, useEffect, useMemo} from 'react';
import {Image, StyleSheet} from 'react-native';
import Animated, {useAnimatedStyle, useSharedValue, withTiming} from 'react-native-reanimated';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {colorLookup} from 'theme';
import {AvalancheCenterID, userFacingCenterId} from 'types/nationalAvalancheCenter';

interface ForecastNavigationHeaderProps {
  centerId: AvalancheCenterID;
  isInNoCenterExperience: boolean;
  onFetchUserLocation: () => void;
}

const HEADER_HEIGHT = 44;

export const ForecastNavigationHeader: React.FunctionComponent<ForecastNavigationHeaderProps> = ({centerId, isInNoCenterExperience, onFetchUserLocation}) => {
  const navigation = useNavigation();

  const insets = useSafeAreaInsets();
  const totalHeight = insets.top + HEADER_HEIGHT;

  const capabilitiesResult = useAvalancheCenterCapabilities();
  const capabilities = capabilitiesResult.data;

  const title = useMemo(() => {
    if (capabilities) {
      return userFacingCenterId(centerId, capabilities);
    }
    return centerId as string;
  }, [centerId, capabilities]);

  const openDrawer = useCallback(() => {
    navigation.dispatch(DrawerActions.openDrawer());
  }, [navigation]);

  // centerOffset=0: center header visible (slides down in); centerOffset=-totalHeight: center header hidden above
  const centerHeaderOffset = useSharedValue(isInNoCenterExperience ? -totalHeight : 0);

  useEffect(() => {
    centerHeaderOffset.value = withTiming(isInNoCenterExperience ? -totalHeight : 0, {duration: 300});
  }, [isInNoCenterExperience, centerHeaderOffset, totalHeight]);

  const centerHeaderStyle = useAnimatedStyle(() => ({
    transform: [{translateY: centerHeaderOffset.value}],
  }));

  return (
    <View style={{width: '100%', height: totalHeight, overflow: 'hidden'}}>
      {/* No-center header: dark gradient background, static */}
      <View style={StyleSheet.absoluteFillObject}>
        <LinearGradient colors={['rgba(0,0,0,0.9)', 'rgba(0,0,0,0.0)']} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
        <View style={{height: insets.top}} />
        <HStack justifyContent="space-between" alignItems="center" height={HEADER_HEIGHT} space={8} pl={3} pr={16}>
          <Ionicons.Button
            size={24}
            color="white"
            name="menu"
            backgroundColor="transparent"
            underlayColor="rgba(0,0,0,0.1)"
            iconStyle={{marginLeft: 0, marginRight: 0}}
            style={{textAlign: 'center', borderColor: 'transparent', borderWidth: 1}}
            onPress={openDrawer}
          />
          <HStack space={4}>
            {/* eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-require-imports */}
            <Image source={require('assets/white-avy-logo.png')} style={styles.appLogo} />
          </HStack>
          <Ionicons.Button
            size={24}
            color="white"
            name="locate"
            backgroundColor="transparent"
            underlayColor="rgba(0,0,0,0.1)"
            iconStyle={{marginLeft: 0, marginRight: 0}}
            style={{textAlign: 'center', borderColor: 'transparent', borderWidth: 1}}
            onPress={onFetchUserLocation}
          />
        </HStack>
      </View>

      {/* Center header: white background, slides in/out from top */}
      <Animated.View style={[StyleSheet.absoluteFillObject, styles.whiteBackground, centerHeaderStyle]}>
        <View style={{height: insets.top}} />
        <HStack justifyContent="space-between" alignItems="center" height={HEADER_HEIGHT} space={8} pl={3} pr={16}>
          <Ionicons.Button
            size={24}
            color={colorLookup('primary') as string}
            name="menu"
            backgroundColor="transparent"
            underlayColor="rgba(0,0,0,0.1)"
            iconStyle={{marginLeft: 0, marginRight: 0}}
            style={{textAlign: 'center', borderColor: 'transparent', borderWidth: 1}}
            onPress={openDrawer}
          />
          <HStack space={4}>
            <AvalancheCenterLogo style={{height: 32, width: 32, resizeMode: 'contain'}} avalancheCenterId={centerId} />
            <Title3Black textAlign="center" style={{borderColor: 'transparent', borderWidth: 1, color: colorLookup('text')}}>
              {title}
            </Title3Black>
          </HStack>
          <View width={24} />
        </HStack>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  whiteBackground: {
    backgroundColor: colorLookup('white') as string,
  },
  appLogo: {
    height: 32,
    width: 32,
    resizeMode: 'contain',
  },
});
