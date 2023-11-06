import React, {PropsWithChildren, ReactElement, useState} from 'react';

import {TextStyle, TouchableOpacity} from 'react-native';

import {Center, HStack, View, VStack} from 'components/core';
import {Body, BodySemibold} from 'components/text';
import Toast from 'react-native-toast-message';
import {colorLookup} from 'theme';

export interface TabProps {
  title: string;
}

export const Tab: React.FunctionComponent<PropsWithChildren<TabProps>> = ({children}) => <>{children}</>;

type TabElement = ReactElement<TabProps> | undefined | string | boolean | number;

export interface TabControlProps {
  backgroundColor: string;
  children: TabElement | Array<TabElement>;
}

export const TabControl: React.FunctionComponent<TabControlProps> = ({children, backgroundColor}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selectedTextColor = colorLookup('primary');
  const tabCount = React.Children.count(children);

  React.useEffect(() => {
    Toast.hide();
  }, [selectedIndex]);

  const tabStyle = {
    width: `${Math.round(10000.0 / tabCount) / 100}%`,
  } as const;
  const textStyle: TextStyle = {
    textAlign: 'center',
    paddingVertical: 8,
    width: `${100 / React.Children.count(children)}%`,
  } as const;

  const onPressHandlers = React.useMemo(
    () =>
      React.Children.map(children, (child, index) => {
        if (!child || typeof child === 'number' || typeof child === 'string' || typeof child === 'boolean') {
          return;
        }
        return () => setSelectedIndex(index);
      }) || [],
    [children, setSelectedIndex],
  );

  return (
    // overflow: hidden prevents the drop shadow on the HStack from rendering at the top edge of that component
    <VStack style={{width: '100%', flex: 1, flexGrow: 1, justifyContent: 'space-between', backgroundColor, overflow: 'hidden'}}>
      <HStack
        justifyContent="space-evenly"
        alignItems="center"
        width="100%"
        backgroundColor={backgroundColor}
        style={{
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: 1,
          },
          shadowOpacity: 0.22,
          shadowRadius: 2.22,

          elevation: 3,
          // setting zIndex allows the shadow to render over the top of the component next to this one
          zIndex: 1,
        }}>
        {React.Children.map(children, (child, index) => {
          if (!child || typeof child === 'number' || typeof child === 'string' || typeof child === 'boolean') {
            return;
          }
          const selected = selectedIndex === index;
          return (
            <TouchableOpacity onPress={onPressHandlers[index]} style={tabStyle} key={`tabcontrol-item-${index}`}>
              <Center>
                <View borderColor={selected ? selectedTextColor : backgroundColor} borderBottomWidth={4} borderRadius={0}>
                  {selected ? (
                    <BodySemibold color={selectedTextColor} style={textStyle} numberOfLines={1}>
                      {child.props.title}
                    </BodySemibold>
                  ) : (
                    <Body style={textStyle} numberOfLines={1}>
                      {child.props.title}
                    </Body>
                  )}
                </View>
              </Center>
            </TouchableOpacity>
          );
        })}
      </HStack>
      {React.Children.map(children, (child, index) => index === selectedIndex && child)}
    </VStack>
  );
};
