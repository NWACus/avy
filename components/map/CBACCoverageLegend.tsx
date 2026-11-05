import React, {useCallback} from 'react';
import Svg, {Line} from 'react-native-svg';

import {Legend, LegendProps} from 'components/content/Legend';
import {HStack} from 'components/core';
import {BodyXSm} from 'components/text';
import helpStrings from 'content/helpStrings';
import {useAnalytics} from 'hooks/useAnalytics';
import {colorLookup} from 'theme';
import {AvalancheCenterID} from 'types/nationalAvalancheCenter';

type CBACCoverageLegendProps = Omit<LegendProps, 'children' | 'infoTitle' | 'infoContent' | 'onInfoOpen'> & {centerId: AvalancheCenterID};

const SWATCH_WIDTH = 84;
const SWATCH_HEIGHT = 12;

const DashedLineSwatch: React.FunctionComponent = () => (
  <Svg width={SWATCH_WIDTH} height={SWATCH_HEIGHT}>
    <Line x1={0} y1={SWATCH_HEIGHT / 2} x2={SWATCH_WIDTH} y2={SWATCH_HEIGHT / 2} stroke="white" strokeWidth={SWATCH_HEIGHT} strokeLinecap="round" />
    <Line
      x1={0}
      y1={SWATCH_HEIGHT / 2}
      x2={SWATCH_WIDTH}
      y2={SWATCH_HEIGHT / 2}
      stroke={colorLookup('gray.900').toString()}
      strokeWidth={SWATCH_HEIGHT}
      strokeDasharray={[SWATCH_HEIGHT, SWATCH_HEIGHT]}
    />
  </Svg>
);

export const CBACCoverageLegend: React.FunctionComponent<CBACCoverageLegendProps> = ({centerId, ...props}) => {
  const analytics = useAnalytics();
  const onInfoOpen = useCallback(() => analytics.capture('coverage_legend_info_tapped', {center: centerId}), [analytics, centerId]);

  return (
    <Legend {...props} infoTitle="CBAC Coverage" infoContent={helpStrings.cbacCoverageEdge} onInfoOpen={onInfoOpen}>
      <HStack space={8} alignItems="center">
        <DashedLineSwatch />
        <BodyXSm color="white">dashed = CBAC coverage edge</BodyXSm>
      </HStack>
    </Legend>
  );
};
