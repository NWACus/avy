import React from 'react';

import {AvalancheProblemLikelihood} from '../types/nationalAvalancheCenter';
import {SeverityNumberLine, SeverityNumberLineRange} from './SeverityNumberLine';

export interface AvalancheProblemLikelihoodLineProps {
  likelihood: AvalancheProblemLikelihood;
}

export const likelihoodText = (input: AvalancheProblemLikelihood): string => {
  return String(input)
    .toLowerCase()
    .split(' ')
    .map(s => s.charAt(0).toUpperCase() + s.substring(1))
    .join(' ');
};

const likelihoodToRange = (likelihood: AvalancheProblemLikelihood): SeverityNumberLineRange => {
  let index = 4;
  switch (likelihood) {
    case AvalancheProblemLikelihood.AlmostCertain:
      index -= 1;
    case AvalancheProblemLikelihood.VeryLikely:
      index -= 1;
    case AvalancheProblemLikelihood.Likely:
      index -= 1;
    case AvalancheProblemLikelihood.Possible:
      index -= 1;
    case AvalancheProblemLikelihood.Unlikely:
    default:
  }
  return {from: index, to: index};
};

export const AvalancheProblemLikelihoodLine: React.FunctionComponent<AvalancheProblemLikelihoodLineProps> = ({likelihood}: AvalancheProblemLikelihoodLineProps) => {
  return (
    <SeverityNumberLine
      labels={[
        likelihoodText(AvalancheProblemLikelihood.AlmostCertain),
        likelihoodText(AvalancheProblemLikelihood.VeryLikely),
        likelihoodText(AvalancheProblemLikelihood.Likely),
        likelihoodText(AvalancheProblemLikelihood.Possible),
        likelihoodText(AvalancheProblemLikelihood.Unlikely),
      ]}
      range={likelihoodToRange(likelihood)}
    />
  );
};
