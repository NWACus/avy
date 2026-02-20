import {InfoTooltip} from 'components/content/InfoTooltip';
import {HStack, View} from 'components/core';
import {BodySm, BodySmBlack} from 'components/text';
import React from 'react';
import {colorLookup} from 'theme';

export interface HelpText {
  title: string;
  contentHtml: string;
}

interface FieldLabelProps {
  label: string;
  required?: boolean;
  helpText?: HelpText;
}

export function FieldLabel({label, required = false, helpText}: FieldLabelProps) {
  return (
    <HStack>
      <BodySmBlack>{label}</BodySmBlack>
      {required && <RequiredLabel />}
      {helpText && <InfoTooltip title={helpText.title} content={helpText.contentHtml} size={18} htmlStyle={{textAlign: 'left'}} />}
    </HStack>
  );
}

FieldLabel.displayName = 'FieldLabel';

function RequiredLabel() {
  return (
    <View borderRadius={20} backgroundColor={colorLookup('error.background')} paddingHorizontal={5} marginLeft={5}>
      <BodySm color={colorLookup('error')}>Required</BodySm>
    </View>
  );
}
