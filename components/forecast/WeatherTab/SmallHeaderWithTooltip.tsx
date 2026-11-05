import {InfoTooltip} from 'components/content/InfoTooltip';
import {HStack} from 'components/core';
import {BodyXSmBlack} from 'components/text';
import React, {useCallback, useState} from 'react';
import {NativeSyntheticEvent, TextLayoutEventData} from 'react-native';

export const SmallHeaderWithTooltip: React.FunctionComponent<{
  title: string;
  content?: string | null;
  dialogTitle: string;
  tooltipPlacement?: 'adjacent' | 'end';
}> = ({title, content, dialogTitle, tooltipPlacement = 'end'}) => {
  const adjacent = tooltipPlacement === 'adjacent';
  const [wrappedTitleWidth, setWrappedTitleWidth] = useState<number | undefined>(undefined);
  const onTitleTextLayout = useCallback((event: NativeSyntheticEvent<TextLayoutEventData>) => {
    const {lines} = event.nativeEvent;
    setWrappedTitleWidth(lines.length > 1 ? Math.ceil(Math.max(...lines.map(line => line.width))) : undefined);
  }, []);
  return (
    // the icon style is designed to make the circle "i" look natural next to the
    // text - neither `center` nor `baseline` alignment look good on their own
    <HStack space={6} alignItems="center" justifyContent={adjacent ? 'flex-start' : 'space-between'} width="100%">
      <BodyXSmBlack style={adjacent ? {flexShrink: 1, width: wrappedTitleWidth} : {flex: 1}} onTextLayout={adjacent ? onTitleTextLayout : undefined}>
        {title}
      </BodyXSmBlack>
      {content && <InfoTooltip size={16} title={dialogTitle || title} content={content} style={{paddingBottom: 0, paddingTop: 1}} />}
    </HStack>
  );
};
