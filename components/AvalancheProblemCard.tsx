import React, {useCallback, useState} from 'react';

import {AvalancheProblemIcon} from 'components/AvalancheProblemIcon';
import {AvalancheProblemLikelihoodLine} from 'components/AvalancheProblemLikelihoodLine';
import {AvalancheProblemSizeLine} from 'components/AvalancheProblemSizeLine';
import {AnnotatedDangerRose} from 'components/DangerRose';
import {Card, CardProps} from 'components/content/Card';
import {MediaPreview} from 'components/content/carousel/MediaPreview';
import {Center, HStack, VStack} from 'components/core';
import {AllCapsSm, Caption1Semibold, allCapsSmLineHeight} from 'components/text';
import {HTML} from 'components/text/HTML';
import {LayoutChangeEvent} from 'react-native';
import {colorLookup} from 'theme';
import {AvalancheProblem, ElevationBandNames} from 'types/nationalAvalancheCenter';

export interface AvalancheProblemCardProps {
  problem: AvalancheProblem;
  names: ElevationBandNames;
}

interface AspectCardProps extends Omit<CardProps, 'children'> {
  caption: string;
}
const AspectCard: React.FC<AspectCardProps> = ({caption, ...props}) => (
  <Card flex={1} flexBasis={'35%'} flexGrow={1} borderColor={colorLookup('light.300')} borderRadius={8} mb={8} {...props}>
    {/* Always force the caption to take the space of two lines - this makes things line up on narrow screens,
        where "Aspect/Elevation" doesn't fit on a single line */}
    <Center height={2 * allCapsSmLineHeight}>
      <AllCapsSm textAlign="center">{caption}</AllCapsSm>
    </Center>
  </Card>
);

export const AvalancheProblemCard: React.FunctionComponent<AvalancheProblemCardProps> = ({problem, names}: AvalancheProblemCardProps) => {
  const [cardWidth, setCardWidth] = useState<number>(0);
  const onLayout = useCallback((event: LayoutChangeEvent) => setCardWidth(event.nativeEvent.layout.width), [setCardWidth]);
  return (
    <VStack space={8} onLayout={onLayout}>
      <HStack flexWrap="wrap" justifyContent="space-evenly" alignItems="stretch">
        <AspectCard
          mr={16}
          header={
            // Fixed height is required so that the Image knows what space it has to flex into
            <VStack space={8} alignItems="center" style={{height: 150}}>
              <AvalancheProblemIcon problem={problem.avalanche_problem_id} />
              <Caption1Semibold textAlign="center">{problem.name}</Caption1Semibold>
            </VStack>
          }
          caption="Problem Type"
        />
        <AspectCard
          header={
            // The height is repeated here so that the first two items have the same height
            <Center style={{height: 150}}>
              <AnnotatedDangerRose rose={{style: {}, locations: problem.location}} elevationBandNames={names} />
            </Center>
          }
          caption="Aspect/Elevation"
        />
        <AspectCard
          mr={16}
          header={
            <Center>
              <AvalancheProblemLikelihoodLine likelihood={problem.likelihood} />
            </Center>
          }
          caption="Likelihood"
        />
        <AspectCard
          header={
            <Center>
              <AvalancheProblemSizeLine size={problem.size} />
            </Center>
          }
          caption="Size"
        />
      </HStack>
      {problem.discussion && <HTML source={{html: problem.discussion}} />}
      {problem.media && cardWidth > 0 && <MediaPreview mediaItem={problem.media} thumbnailAspectRatio={1.3} thumbnailHeight={cardWidth / 1.3} />}
    </VStack>
  );
};
