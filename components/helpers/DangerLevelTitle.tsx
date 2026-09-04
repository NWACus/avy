import {BodySmSemibold, TextWrapperProps} from 'components/text';
import React from 'react';
import {Text} from 'react-native';
import {DangerLevel} from 'types/nationalAvalancheCenter';

const capitalize = {textTransform: 'capitalize'} as const;

export const DangerLevelTitle: React.FunctionComponent<{
  dangerLevel: DangerLevel;
  LabelText?: React.FunctionComponent<TextWrapperProps>;
  color?: TextWrapperProps['color'];
}> = ({dangerLevel, LabelText = BodySmSemibold, color}) => {
  switch (dangerLevel) {
    case DangerLevel.GeneralInformation:
    case DangerLevel.None:
      return (
        <LabelText color={color}>
          <Text style={capitalize}>No Rating</Text>
        </LabelText>
      );
    case DangerLevel.Low:
    case DangerLevel.Moderate:
    case DangerLevel.Considerable:
    case DangerLevel.High:
    case DangerLevel.Extreme:
      return (
        <LabelText color={color}>
          {dangerLevel} - <Text style={capitalize}>{DangerLevel[dangerLevel]}</Text>
        </LabelText>
      );
  }
  const invalid: never = dangerLevel;
  // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
  throw new Error(`Unknown danger level: ${invalid}`);
};
