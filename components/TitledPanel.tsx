import React, {PropsWithChildren} from 'react';
import {StyleSheet, Text, View, ViewStyle} from 'react-native';

export interface TitledPanelProps {
  title: string;
  style: ViewStyle;
}

export const TitledPanel: React.FunctionComponent<PropsWithChildren<TitledPanelProps>> = ({children, title, style}) => {
  return (
    <View style={{...style, ...styles.container}}>
      {children}
      <Text style={styles.title}>{title}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  title: {
    width: '100%',
    textTransform: 'uppercase',
    fontWeight: 'bold',
    textAlign: 'center',
    paddingBottom: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgb(200,202,206)',
  },
});
