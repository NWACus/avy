import {Center, View, VStack} from 'components/core';
import {Body} from 'components/text';
import React from 'react';
import {SafeAreaView} from 'react-native-safe-area-context';
import {AvalancheCenterID} from 'types/nationalAvalancheCenter';
import Topo from 'assets/topo.svg';

export const ObservationsPortal: React.FC<{
  center_id: AvalancheCenterID;
  date: Date;
}> = ({center_id, date}) => {
  return (
    <View width="100%" height="100%" bg="white">
      {/* SafeAreaView shouldn't inset from bottom edge because TabNavigator is sitting there */}
      <SafeAreaView edges={['top', 'left', 'right']} style={{height: '100%', width: '100%'}}>
        <VStack height="100%" width="100%" justifyContent="space-between" alignItems="stretch">
          <View bg="yellow">
            <Body>
              this is the observations portal {center_id} {date.toUTCString()}
            </Body>
          </View>
          <View width="100%" position="relative" height={400}>
            <Topo width={887.0152587890625} height={456.3430480957031} style={{position: 'absolute', left: -306.15625, top: 0}} />
          </View>
        </VStack>
      </SafeAreaView>
    </View>
  );
};
