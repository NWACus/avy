import React, {PropsWithChildren, ReactElement, useState} from 'react';

import {TouchableOpacity} from 'react-native';

import {HStack, VStack, useToken} from 'native-base';
import {Body, BodySemibold} from './text';

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
  const [selectedTextColor] = useToken('colors', ['primary.600']);
  const tabCount = React.Children.count(children);

  const tabStyle = {
    borderBottomColor: backgroundColor,
    borderBottomWidth: 4,
    borderRadius: 0,
    width: `${Math.round(10000.0 / tabCount) / 100}%`,
  } as const;
  const selectedTabStyle = {
    ...tabStyle,
    borderBottomColor: selectedTextColor,
  } as const;
  const textStyle = {
    textAlign: 'center',
    padding: 8,
  } as const;

  return (
    <VStack style={{width: '100%', backgroundColor}}>
      <HStack justifyContent="space-evenly" alignItems="center" style={{width: '100%', backgroundColor, height: 64}}>
        {React.Children.map(children, (child, index) => {
          const selected = selectedIndex === index;
          return (
            <TouchableOpacity onPress={() => setSelectedIndex(index)} style={selected ? selectedTabStyle : tabStyle} key={`tabcontrol-item-${index}`}>
              {selected ? (
                <BodySemibold color={selectedTextColor} style={textStyle}>
                  {child.props.title}
                </BodySemibold>
              ) : (
                <Body style={textStyle}>{child.props.title}</Body>
              )}
            </TouchableOpacity>
          );
        })}
      </HStack>
      {React.Children.map(children, (child, index) => index === selectedIndex && child)}
    </VStack>
  );
};
