import React from 'react';

import {StyleSheet, Text, useWindowDimensions, View} from 'react-native';
import RenderHTML from 'react-native-render-html';

import {AvalancheProblem, ElevationBandNames, MediaType} from '../types/nationalAvalancheCenter';
import {AnnotatedDangerRose} from './DangerRose';
import {AvalancheProblemIcon} from './AvalancheProblemIcon';
import {AvalancheProblemLikelihoodLine} from './AvalancheProblemLikelihoodLine';
import {AvalancheProblemSizeLine} from './AvalancheProblemSizeLine';
import {TitledPanel} from './TitledPanel';
import {AvalancheProblemImage} from './AvalancheProblemImage';

export interface AvalancheProblemCardProps {
  problem: AvalancheProblem;
  names: ElevationBandNames;
}

export const AvalancheProblemCard: React.FunctionComponent<AvalancheProblemCardProps> = ({problem, names}: AvalancheProblemCardProps) => {
  const {width} = useWindowDimensions();

  return (
    <View style={styles.horizontalCard}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-end',
          flexWrap: 'wrap',
          justifyContent: 'space-evenly',
        }}>
        <TitledPanel title={'Problem Type'} style={styles.panel}>
          <AvalancheProblemIcon style={styles.largeIcon} problem={problem.avalanche_problem_id} />
          <Text style={{fontWeight: 'bold', textAlignVertical: 'center'}}>{problem.name}</Text>
        </TitledPanel>
        <TitledPanel title={'Aspect/Elevation'} style={styles.panel}>
          <AnnotatedDangerRose rose={{style: {width: '100%'}, locations: problem.location}} elevationBandNames={names} />
        </TitledPanel>
        <TitledPanel title={'Likelihood'} style={styles.panel}>
          <AvalancheProblemLikelihoodLine likelihood={problem.likelihood} />
        </TitledPanel>
        <TitledPanel title={'Size'} style={styles.panel}>
          <AvalancheProblemSizeLine size={problem.size} />
        </TitledPanel>
      </View>
      {problem.media.type === MediaType.Image && problem.media.url !== null && <AvalancheProblemImage media={problem.media} />}
      <View style={styles.content}>
        <RenderHTML source={{html: problem.discussion}} contentWidth={width} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  horizontalCard: {
    marginRight: 10,
    marginLeft: 10,
    margin: 5,
    borderStyle: 'solid',
    borderWidth: 1.2,
    borderColor: 'rgb(200,202,206)',
    shadowOffset: {width: 1, height: 2},
    shadowOpacity: 0.8,
    shadowColor: 'rgb(157,162,165)',
  },
  text: {
    flex: 2,
    fontWeight: 'bold',
    textAlignVertical: 'center',
  },
  icon: {
    flex: 1,
    height: '100%',
    textAlignVertical: 'center',
    margin: 1,
  },
  panel: {
    width: '35%',
  },
  largeIcon: {
    width: '80%',
  },
  content: {
    flexDirection: 'column',
    paddingTop: 5,
    paddingLeft: 10,
    paddingBottom: 0,
    paddingRight: 10,
  },
});
