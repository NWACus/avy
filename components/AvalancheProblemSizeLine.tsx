import React from 'react';

import {AvalancheProblemSize} from 'types/nationalAvalancheCenter';
import {SeverityNumberLine} from './SeverityNumberLine';

export interface AvalancheProblemSizeLineProps {
  size: number[];
}

export const sizeText = (input: AvalancheProblemSize): string => {
  switch (input) {
    case AvalancheProblemSize.Historic:
      return 'Historic (D4-5)';
    case AvalancheProblemSize.VeryLarge:
      return 'Very Large (D3)';
    case AvalancheProblemSize.Large:
      return 'Large (D2)';
    case AvalancheProblemSize.Small:
      return 'Small (D1)';
  }
};

export const AvalancheProblemSizeLine: React.FunctionComponent<AvalancheProblemSizeLineProps> = ({size}: AvalancheProblemSizeLineProps) => {
  return (
    <SeverityNumberLine
      labels={[sizeText(AvalancheProblemSize.Historic), sizeText(AvalancheProblemSize.VeryLarge), sizeText(AvalancheProblemSize.Large), sizeText(AvalancheProblemSize.Small)]}
      range={{from: size[0], to: size[1]}}
    />
  );
};
