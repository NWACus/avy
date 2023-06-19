import React from 'react';

import {Caption1, Caption1Semibold, TextWrapperProps} from 'components/text';
import {DangerLevel} from 'types/nationalAvalancheCenter';

export const TravelAdvice: React.FunctionComponent<{dangerLevel: DangerLevel; HeadingText?: React.FC<TextWrapperProps>; BodyText?: React.FC<TextWrapperProps>}> = ({
  dangerLevel,
  HeadingText = Caption1Semibold,
  BodyText = Caption1,
}) => {
  switch (dangerLevel) {
    case DangerLevel.GeneralInformation:
    case DangerLevel.None:
      return <BodyText>Insufficient data for issuing of danger ratings, but a summary of avalanche conditions exists. Read the summary for more information.</BodyText>;
    case DangerLevel.Low:
      return (
        <BodyText>
          <HeadingText>Generally safe avalanche conditions.</HeadingText> Watch for unstable snow on isolated terrain features.
        </BodyText>
      );
    case DangerLevel.Moderate:
      return (
        <BodyText>
          <HeadingText>Heightened avalanche conditions on specific terrain features.</HeadingText> Evaluate snow and terrain carefully; identify features of concern.
        </BodyText>
      );
    case DangerLevel.Considerable:
      return (
        <BodyText>
          <HeadingText>Dangerous avalanche conditions.</HeadingText> Careful snowpack evaluation, cautious route-finding and conservative decision-making essential.
        </BodyText>
      );
    case DangerLevel.High:
      return (
        <BodyText>
          <HeadingText>Very dangerous avalanche conditions.</HeadingText> Travel in avalanche terrain not recommended.
        </BodyText>
      );
    case DangerLevel.Extreme:
      return (
        <BodyText>
          <HeadingText>Extraordinarily dangerous avalanche conditions.</HeadingText> Avoid all avalanche terrain.
        </BodyText>
      );
  }
  const invalid: never = dangerLevel;
  // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
  throw new Error(`Unknown danger level: ${invalid}`);
};
