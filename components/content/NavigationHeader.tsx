import {AntDesign} from '@expo/vector-icons';
import {getHeaderTitle} from '@react-navigation/elements';
import {NativeStackHeaderProps} from '@react-navigation/native-stack/lib/typescript/src/types';
import {AvalancheCenterLogo} from 'components/AvalancheCenterLogo';
import {HStack, View} from 'components/core';
import {Title1Black, Title3Black} from 'components/text';
import React from 'react';
import {SafeAreaView} from 'react-native';
import {colorLookup} from 'theme';
import {AvalancheCenterID} from 'types/nationalAvalancheCenter';

export const NavigationHeader: React.FunctionComponent<
  NativeStackHeaderProps & {
    center_id: AvalancheCenterID;
    large?: boolean;
  }
> = ({navigation, route, options, back, center_id, large}) => {
  const title = getHeaderTitle(options, route.name);
  const TextComponent = large ? Title1Black : Title3Black;

  return (
    <SafeAreaView style={{width: '100%', backgroundColor: 'white'}}>
      <HStack justifyContent="space-between" pb={8} style={options.headerStyle} space={8} pl={3} pr={16}>
        {back ? (
          <AntDesign.Button
            size={24}
            color={colorLookup('text')}
            name="arrowleft"
            backgroundColor="white"
            iconStyle={{marginLeft: 0, marginRight: 0}}
            style={{textAlign: 'center', borderColor: 'transparent', borderWidth: 1}}
            onPress={() => navigation.goBack()}
          />
        ) : (
          <View width={42} />
        )}
        <TextComponent textAlign="center" style={{flex: 1, borderColor: 'transparent', borderWidth: 1}}>
          {title}
        </TextComponent>
        <AvalancheCenterLogo style={{height: 32, width: 32, resizeMode: 'contain', flex: 0, flexGrow: 0}} avalancheCenterId={center_id} />
      </HStack>
    </SafeAreaView>
  );
};
