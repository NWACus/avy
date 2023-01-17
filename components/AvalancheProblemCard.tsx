import React from 'react';

import {AvalancheProblem, ElevationBandNames, MediaType} from 'types/nationalAvalancheCenter';
import {AnnotatedDangerRose} from './DangerRose';
import {AvalancheProblemIcon} from './AvalancheProblemIcon';
import {AvalancheProblemLikelihoodLine} from './AvalancheProblemLikelihoodLine';
import {AvalancheProblemSizeLine} from './AvalancheProblemSizeLine';
import {HTML} from 'components/text/HTML';
import {Center, HStack, VStack} from 'components/core';
import {AllCapsSm, Caption1Semibold} from 'components/text';
import {Card, CardProps} from 'components/content/Card';
import {colorLookup} from 'theme';
import {Carousel} from 'components/content/Carousel';

export interface AvalancheProblemCardProps {
  problem: AvalancheProblem;
  names: ElevationBandNames;
}

const AspectCard: React.FC<CardProps> = ({...props}) => <Card flex={1} flexBasis={'35%'} flexGrow={1} borderColor={colorLookup('light.200')} borderRadius={8} mb={8} {...props} />;

export const AvalancheProblemCard: React.FunctionComponent<AvalancheProblemCardProps> = ({problem, names}: AvalancheProblemCardProps) => {
  return (
    <VStack space={8}>
      <HTML source={{html: problem.discussion}} />
      <HStack flexWrap="wrap" justifyContent="space-evenly" alignItems="stretch">
        <AspectCard
          mr={16}
          header={
            // Fixed height is required so that the Image knows what space it has to flex into
            <VStack space={8} alignItems="center" style={{height: 150}}>
              <AvalancheProblemIcon problem={problem.avalanche_problem_id} />
              <Caption1Semibold textAlign="center">{problem.name}</Caption1Semibold>
            </VStack>
          }>
          <AllCapsSm textAlign="center">Problem Type</AllCapsSm>
        </AspectCard>
        <AspectCard
          header={
            // The height is repeated here so that the first two items have the same height
            <Center style={{height: 150}}>
              <AnnotatedDangerRose rose={{style: {}, locations: problem.location}} elevationBandNames={names} />
            </Center>
          }>
          <AllCapsSm textAlign="center">Aspect/Elevation</AllCapsSm>
        </AspectCard>
        <AspectCard
          mr={16}
          header={
            <Center>
              <AvalancheProblemLikelihoodLine likelihood={problem.likelihood} />
            </Center>
          }>
          <AllCapsSm textAlign="center">Likelihood</AllCapsSm>
        </AspectCard>
        <AspectCard
          header={
            <Center>
              <AvalancheProblemSizeLine size={problem.size} />
            </Center>
          }>
          <AllCapsSm textAlign="center">Size</AllCapsSm>
        </AspectCard>
      </HStack>
      {problem.media.type === MediaType.Image && problem.media.url !== null && <Carousel media={[problem.media]} thumbnailHeight={200} />}
    </VStack>
  );
};
