import {AntDesign} from '@expo/vector-icons';
import {getHeaderTitle} from '@react-navigation/elements';
import {NativeStackHeaderProps} from '@react-navigation/native-stack/lib/typescript/src/types';
import {HStack} from 'components/core';
import {Title3Black} from 'components/text';
import React from 'react';
import {SafeAreaView} from 'react-native';
import {colorLookup} from 'theme';

export const NavigationHeader: React.FunctionComponent<NativeStackHeaderProps> = ({navigation, route, options, back}) => {
  const title = getHeaderTitle(options, route.name);

  return (
    <SafeAreaView style={{width: '100%', backgroundColor: 'white'}}>
      <HStack justifyContent="flex-start" pb={8} style={options.headerStyle}>
        {back && (
          <AntDesign.Button
            size={24}
            color={colorLookup('text')}
            name="arrowleft"
            backgroundColor="white"
            iconStyle={{marginLeft: 0, marginRight: 8}}
            style={{textAlign: 'center'}}
            onPress={() => navigation.goBack()}
          />
        )}
        <Title3Black>{title}</Title3Black>
      </HStack>
    </SafeAreaView>
  );
};
