import React from 'react';

import {DangerLevel} from 'types/nationalAvalancheCenter';
import {Caption1, Caption1Semibold} from '../text';

export const TravelAdvice: React.FunctionComponent<{dangerLevel: DangerLevel}> = ({dangerLevel}) => {
  switch (dangerLevel) {
    case DangerLevel.GeneralInformation:
    case DangerLevel.None:
      return <Caption1>Insufficient data for issuing of danger ratings, but a summary of avalanche conditions exists. Read the summary for more information.</Caption1>;
    case DangerLevel.Low:
      return (
        <Caption1>
          <Caption1Semibold>Generally safe avalanche conditions.</Caption1Semibold> Watch for unstable snow on isolated terrain features.
        </Caption1>
      );
    case DangerLevel.Moderate:
      return (
        <Caption1>
          <Caption1Semibold>Heightened avalanche conditions on specific terrain features.</Caption1Semibold> Evaluate snow and terrain carefully; identify features of concern.
        </Caption1>
      );
    case DangerLevel.Considerable:
      return (
        <Caption1>
          <Caption1Semibold>Dangerous avalanche conditions.</Caption1Semibold> Careful snowpack evaluation, cautious route-finding and conservative decision-making essential.
        </Caption1>
      );
    case DangerLevel.High:
      return (
        <Caption1>
          <Caption1Semibold>Very dangerous avalanche conditions.</Caption1Semibold> Travel in avalanche terrain not recommended.
        </Caption1>
      );
    case DangerLevel.Extreme:
      return (
        <Caption1>
          <Caption1Semibold>Extraordinarily dangerous avalanche conditions.</Caption1Semibold> Avoid all avalanche terrain.
        </Caption1>
      );
  }
  const invalid: never = dangerLevel;
  throw new Error(`Unknown danger level: ${invalid}`);
};
