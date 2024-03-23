import {AntDesign} from '@expo/vector-icons';
import {getHeaderTitle} from '@react-navigation/elements';
import {NativeStackHeaderProps} from '@react-navigation/native-stack/lib/typescript/src/types';
import {AvalancheCenterLogo} from 'components/AvalancheCenterLogo';
import {HStack, View} from 'components/core';
import {Title1Black, Title3Black} from 'components/text';
import React, {useCallback} from 'react';
import {EdgeInsets, SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import {colorLookup} from 'theme';
import {AvalancheCenterID} from 'types/nationalAvalancheCenter';

interface HeaderProps extends NativeStackHeaderProps {
  large?: boolean;
}

type IconOption = React.ComponentProps<typeof AntDesign.Button>['name'];

const EDGE_MODES = {top: 'off', bottom: 'off', right: 'additive', left: 'additive'} as const;

const Layout: React.FC<
  HeaderProps & {
    children?: React.ReactNode;
    backIcon: IconOption;
    insets?: EdgeInsets;
  }
> = ({options, children, back, backIcon, navigation, insets}) => {
  const goBack = useCallback(() => navigation.goBack(), [navigation]);

  return (
    // On phones with notches, the insets.top value will be non-zero and we don't need additional padding on top.
    // On phones without notches, the insets.top value will be 0 and we don't want the header to be flush with the top of the screen.
    <View style={{width: '100%', backgroundColor: 'white', paddingTop: Math.max(8, insets?.top ?? 0)}}>
      <SafeAreaView edges={EDGE_MODES}>
        <HStack justifyContent="space-between" pb={8} style={options.headerStyle} space={8} pl={3} pr={16}>
          {back ? (
            <AntDesign.Button
              size={24}
              color={colorLookup('text')}
              name={backIcon}
              backgroundColor="white"
              iconStyle={{marginLeft: 0, marginRight: 0}}
              style={{textAlign: 'center', borderColor: 'transparent', borderWidth: 1}}
              onPress={goBack}
            />
          ) : (
            <View width={42} />
          )}

          {children}
        </HStack>
      </SafeAreaView>
    </View>
  );
};

export const NavigationHeader: React.FunctionComponent<
  HeaderProps & {
    center_id: AvalancheCenterID;
  }
> = props => {
  const title = getHeaderTitle(props.options, props.route.name);
  const TextComponent = props.large ? Title1Black : Title3Black;
  const insets = useSafeAreaInsets();
  return (
    <Layout {...props} backIcon="arrowleft" insets={insets}>
      <TextComponent textAlign="center" style={{flex: 1, borderColor: 'transparent', borderWidth: 1}}>
        {title}
      </TextComponent>
      <AvalancheCenterLogo style={{height: 32, width: 32, resizeMode: 'contain', flex: 0, flexGrow: 0}} avalancheCenterId={props.center_id} />
    </Layout>
  );
};

export const NavigationModalHeader: React.FC<HeaderProps> = props => {
  return <Layout {...props} backIcon="close"></Layout>;
};
