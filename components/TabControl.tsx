import React, {PropsWithChildren, ReactElement, useState} from 'react';

import {TouchableOpacity} from 'react-native';

import {HStack, Text, VStack, useToken} from 'native-base';

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
  const [selectedTextColor, textColor] = useToken('colors', ['primary.600', 'darkText']);
  const [fontSizeMd] = useToken('fontSizes', ['md']);
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
    color: textColor,
    fontSize: fontSizeMd,
  } as const;
  const selectedTextStyle = {
    ...textStyle,
    color: selectedTextColor,
    fontWeight: 'bold',
  } as const;

  return (
    <VStack style={{width: '100%', backgroundColor}}>
      <HStack justifyContent="space-evenly" alignItems="center" style={{width: '100%', backgroundColor, height: 64}}>
        {React.Children.map(children, (child, index) => (
          <TouchableOpacity onPress={() => setSelectedIndex(index)} style={selectedIndex === index ? selectedTabStyle : tabStyle} key={`tabcontrol-item-${index}`}>
            <Text style={selectedIndex === index ? selectedTextStyle : textStyle}>{child.props.title}</Text>
          </TouchableOpacity>
        ))}
      </HStack>
      {React.Children.map(children, (child, index) => index === selectedIndex && child)}
    </VStack>
  );
};
