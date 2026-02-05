import {MarkerView} from '@rnmapbox/maps';
import React from 'react';
import {Image} from 'react-native';
import Animated, {Easing, useAnimatedProps, useSharedValue, withTiming} from 'react-native-reanimated';
import {Position} from 'types/nationalAvalancheCenter';

// Create an animated version of the MarkerView component
const AnimatedMarkerView = Animated.createAnimatedComponent(MarkerView);

export const AnimatedMapMarker: React.FunctionComponent<{id: string; coordinate: Position}> = ({id, coordinate}) => {
  const longitude = useSharedValue(coordinate[0]);
  const latitude = useSharedValue(coordinate[1]);

  React.useEffect(() => {
    longitude.value = withTiming(coordinate[0], {duration: 250, easing: Easing.linear});
    latitude.value = withTiming(coordinate[1], {duration: 250, easing: Easing.linear});
  }, [longitude, latitude, coordinate]);

  // Define animated props for the coordinate
  const animatedProps = useAnimatedProps(() => {
    return {
      coordinate: [longitude.value, latitude.value],
    };
  }, [longitude, latitude]);

  return (
    <AnimatedMarkerView
      id={id}
      animatedProps={animatedProps}
      coordinate={[longitude.value, latitude.value]}
      anchor={{x: 0.5, y: 0.5}}
      isSelected={false}
      allowOverlap={false}
      allowOverlapWithPuck={false}>
      {/* eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-require-imports*/}
      <Image source={require('assets/map-marker.png')} style={{width: 40, height: 40}} />
    </AnimatedMarkerView>
  );
};
