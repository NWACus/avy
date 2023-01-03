import React, { PropsWithChildren, ReactNode, useCallback } from 'react';
import { compareDesc, format, parseISO, sub } from 'date-fns';
import { ActivityIndicator, View, Text, FlatList, TouchableOpacity, useWindowDimensions } from 'react-native';
import { HomeStackNavigationProps } from 'routes';
import { useNavigation } from '@react-navigation/native';
import { Box, Divider, VStack, HStack, Text as NBText, Heading } from 'native-base';
import { useMapLayer } from 'hooks/useMapLayer';
import { geoContains } from 'd3-geo';
import RenderHTML from 'react-native-render-html';

export interface CardProps {
  header?: ReactNode;
  onPress?: () => void;
}

export const Card: React.FunctionComponent<PropsWithChildren<CardProps>> = ({ header, onPress, children }) => {
  const pressHandler = useCallback(() => (
    onPress?.()
    ), [onPress]);

  return (
    <Box px="2" pt="2">
      <TouchableOpacity
        onPress={pressHandler}>
        <Box bg="white" borderWidth="2" borderRadius="8" borderColor="light.200" p="4">
          <VStack space="2">
            {header}
            <Divider orientation="horizontal" bg="light.200" />
            <>{children}</>
          </VStack>
        </Box>
      </TouchableOpacity>
    </Box>
  );
};
