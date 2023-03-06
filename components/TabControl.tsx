import React, {PropsWithChildren, ReactElement, useState} from 'react';

import {TouchableOpacity} from 'react-native';

import {Center, HStack, View, VStack} from 'components/core';
import {Body, BodySemibold} from 'components/text';
import {colorLookup} from 'theme';

export interface TabProps {
  title: string;
}

export const Tab: React.FunctionComponent<PropsWithChildren<TabProps>> = ({children}) => <>{children}</>;

export interface TabControlProps {
  backgroundColor: string;
  children: ReactElement<TabProps> | Array<ReactElement<TabProps>>;
}

export const TabControl: React.FunctionComponent<TabControlProps> = ({children, backgroundColor}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selectedTextColor = colorLookup('primary');
  const tabCount = React.Children.count(children);

  const tabStyle = {
    width: `${Math.round(10000.0 / tabCount) / 100}%`,
  } as const;
  const textStyle = {
    textAlign: 'center',
    paddingVertical: 8,
  } as const;

  return (
    <VStack style={{width: '100%', flex: 1, flexGrow: 1, justifyContent: 'space-between', backgroundColor}}>
      <HStack
        justifyContent="space-evenly"
        alignItems="center"
        width="100%"
        backgroundColor={backgroundColor}
        paddingTop={8}
        style={{
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: 2,
          },
          shadowOpacity: 0.23,
          shadowRadius: 2.62,

          elevation: 4,
          marginBottom: 8,
        }}>
        {React.Children.map(children, (child, index) => {
          const selected = selectedIndex === index;
          return (
            <TouchableOpacity onPress={() => setSelectedIndex(index)} style={tabStyle} key={`tabcontrol-item-${index}`}>
              <Center>
                <View borderColor={selected ? selectedTextColor : backgroundColor} borderBottomWidth={4} borderRadius={0}>
                  {selected ? (
                    <BodySemibold color={selectedTextColor} style={textStyle}>
                      {child.props.title}
                    </BodySemibold>
                  ) : (
                    <Body style={textStyle}>{child.props.title}</Body>
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
