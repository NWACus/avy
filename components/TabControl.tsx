import React, {useState} from 'react';

import {TouchableOpacity} from 'react-native';

import {HStack, Text, VStack, useToken} from 'native-base';

export interface TabProps {
  title: string;
  render: () => JSX.Element | null;
}

export interface TabControlProps {
  tabs: TabProps[];
  backgroundColor: string;
}

export const TabControl: React.FunctionComponent<TabControlProps> = ({tabs, backgroundColor}: TabControlProps) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedTextColor, textColor] = useToken('colors', ['primary.600', 'darkText']);
  const [fontSizeMd] = useToken('fontSizes', ['md']);
  console.log(selectedTextColor, textColor);

  const tabStyle = {
    borderBottomColor: backgroundColor,
    borderBottomWidth: 4,
    borderRadius: 0,
    width: '33%',
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
        {tabs.map(({title}, index) => (
          <TouchableOpacity onPress={() => setSelectedIndex(index)} style={selectedIndex === index ? selectedTabStyle : tabStyle} key={`tabcontrol-item-${index}`}>
            <Text style={selectedIndex === index ? selectedTextStyle : textStyle}>{title}</Text>
          </TouchableOpacity>
        ))}
      </HStack>
      {tabs[selectedIndex]?.render()}
    </VStack>
  );
};
