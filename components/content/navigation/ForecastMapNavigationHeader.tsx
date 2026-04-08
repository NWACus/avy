import Ionicons from '@expo/vector-icons/Ionicons';
import {DrawerActions, useNavigation} from '@react-navigation/native';
import {AvalancheCenterLogo} from 'components/AvalancheCenterLogo';
import {HStack, View} from 'components/core';
import {Title3Black} from 'components/text';
import {LinearGradient} from 'expo-linear-gradient';
import React, {useCallback, useEffect} from 'react';
import {Image, StyleSheet} from 'react-native';
import Animated, {useAnimatedStyle, useSharedValue, withTiming} from 'react-native-reanimated';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {colorLookup} from 'theme';
import {AvalancheCenterID} from 'types/nationalAvalancheCenter';

interface ForecastNavigaitonHeaderProps {
  centerId: AvalancheCenterID;
  isInNoCenterExperience: boolean;
  onFetchUserLocation: () => void;
}

export const ForecastNavigationHeader: React.FunctionComponent<ForecastNavigaitonHeaderProps> = ({centerId, isInNoCenterExperience, onFetchUserLocation}) => {
  const navigation = useNavigation();

  const title = centerId as string;
  const TextComponent = Title3Black;
  const insets = useSafeAreaInsets();

  const openDrawer = useCallback(() => {
    navigation.dispatch(DrawerActions.openDrawer());
  }, [navigation]);

  const gradientOpacity = useSharedValue(isInNoCenterExperience ? 1 : 0);

  useEffect(() => {
    gradientOpacity.value = withTiming(isInNoCenterExperience ? 1 : 0, {duration: 300});
  }, [isInNoCenterExperience, gradientOpacity]);

  const whiteOverlayStyle = useAnimatedStyle(() => ({
    opacity: 1 - gradientOpacity.value,
  }));

  const iconColor = isInNoCenterExperience ? 'white' : (colorLookup('primary') as string);

  return (
    <View style={{width: '100%', paddingTop: insets.top}}>
      <LinearGradient colors={['rgba(0,0,0,0.9)', 'rgba(0,0,0,0.0)']} style={[StyleSheet.absoluteFillObject]} pointerEvents="none" />
      <Animated.View style={[StyleSheet.absoluteFillObject, styles.whiteBackground, whiteOverlayStyle]} pointerEvents="none" />
      <HStack justifyContent="space-between" space={8} pl={3} pr={16}>
        <Ionicons.Button
          size={24}
          color={iconColor}
          name="menu"
          backgroundColor="transparent"
          underlayColor="rgba(0,0,0,0.1)"
          iconStyle={{marginLeft: 0, marginRight: 0}}
          style={{textAlign: 'center', borderColor: 'transparent', borderWidth: 1}}
          onPress={openDrawer}
        />

        <HStack space={4}>
          {isInNoCenterExperience ? (
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-require-imports
            <Image source={require('assets/icon.png')} style={styles.appLogo} />
          ) : (
            <>
              <AvalancheCenterLogo style={{height: 32, width: 32, resizeMode: 'contain'}} avalancheCenterId={centerId} />
              <TextComponent textAlign="center" style={{borderColor: 'transparent', borderWidth: 1, color: colorLookup('text')}}>
                {title}
              </TextComponent>
            </>
          )}
        </HStack>

        {isInNoCenterExperience ? (
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
        ) : (
          <View width={24} />
        )}
      </HStack>
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
