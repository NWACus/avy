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
  const index =
    {
      [AvalancheProblemLikelihood.AlmostCertain]: 0,
      [AvalancheProblemLikelihood.VeryLikely]: 1,
      [AvalancheProblemLikelihood.Likely]: 2,
      [AvalancheProblemLikelihood.Possible]: 3,
      [AvalancheProblemLikelihood.Unlikely]: 4,
    }[likelihood] ?? 4;
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
