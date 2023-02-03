import React from 'react';
import {StyleSheet} from 'react-native';

import {View} from 'components/core';
import {Body} from 'components/text';
import {AvalancheCenterID} from 'types/nationalAvalancheCenter';

interface Props {
  center_id: AvalancheCenterID;
}
export const WeatherStationList: React.FC<Props> = ({center_id}) => {
  return (
    <View style={StyleSheet.absoluteFillObject}>
      <Body>Weather station list {center_id}</Body>
    </View>
  );
};
