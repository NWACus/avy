import React, {useCallback} from 'react';

import {formatDistanceToNow, isAfter} from 'date-fns';

import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {Card} from 'components/content/Card';
import {QueryState, incompleteQueryState} from 'components/content/QueryState';
import {Carousel, images} from 'components/content/carousel';
import {HStack, VStack} from 'components/core';
import {AllCapsSm, AllCapsSmBlack, BodyBlack, Title3Black} from 'components/text';
import {HTML} from 'components/text/HTML';
import {useAvalancheCenterMetadata} from 'hooks/useAvalancheCenterMetadata';
import {useRefresh} from 'hooks/useRefresh';
import {useSynopsis} from 'hooks/useSynopsis';
import {RefreshControl, ScrollView} from 'react-native';
import Toast from 'react-native-toast-message';
import {HomeStackNavigationProps} from 'routes';
import {colorLookup} from 'theme';
import {AvalancheCenterID} from 'types/nationalAvalancheCenter';
import {RequestedTimeString, parseRequestedTimeString, utcDateToLocalTimeString} from 'utils/date';

export const SynopsisTab: React.FunctionComponent<{
  center_id: AvalancheCenterID;
  requestedTime: RequestedTimeString;
  forecast_zone_id: number;
}> = ({center_id, forecast_zone_id, requestedTime: requestedTimeString}) => {
  const requestedTime = parseRequestedTimeString(requestedTimeString);
  const centerResult = useAvalancheCenterMetadata(center_id);
  const center = centerResult.data;
  const synopsisResult = useSynopsis(center_id, forecast_zone_id, requestedTime);
  const synopsis = synopsisResult.data;
  const {isRefreshing, refresh} = useRefresh(synopsisResult.refetch);
  const onRefresh = useCallback(() => void refresh(), [refresh]);

  const navigation = useNavigation<HomeStackNavigationProps>();
  React.useEffect(() => {
    return navigation.addListener('beforeRemove', () => {
      Toast.hide();
    });
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      if (synopsis?.expires_time) {
        const expires_time = new Date(synopsis.expires_time);
        if (isAfter(new Date(), expires_time)) {
          setTimeout(
            // entirely unclear why this needs to be in a setTimeout, but nothing works without it
            () =>
              Toast.show({
                type: 'error',
                text1: `This blog expired ${formatDistanceToNow(expires_time)} ago.`,
                autoHide: false,
                position: 'bottom',
                onPress: () => Toast.hide(),
              }),
            0,
          );
        }
      }
      return () => Toast.hide();
    }, [synopsis]),
  );

  if (incompleteQueryState(centerResult, synopsisResult) || !center || !synopsis) {
    return <QueryState results={[centerResult, synopsisResult]} />;
  }

  const imageItems = images(synopsis.media);

  return (
    <ScrollView refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}>
      <VStack space={8} backgroundColor={colorLookup('primary.background')}>
        <Card borderRadius={0} borderColor="white" header={<Title3Black>{center.config.blog_title ?? 'Conditions Blog'}</Title3Black>}>
          <HStack justifyContent="space-evenly" space={8}>
            <VStack space={8} style={{flex: 1}}>
              <AllCapsSmBlack>Issued</AllCapsSmBlack>
              <AllCapsSm style={{textTransform: 'none'}} color="text.secondary">
                {utcDateToLocalTimeString(synopsis.published_time)}
              </AllCapsSm>
            </VStack>
            {synopsis.expires_time && (
              <VStack space={8} style={{flex: 1}}>
                <AllCapsSmBlack>Expires</AllCapsSmBlack>
                <AllCapsSm style={{textTransform: 'none'}} color="text.secondary">
                  {utcDateToLocalTimeString(synopsis.expires_time)}
                </AllCapsSm>
              </VStack>
            )}
            <VStack space={8} style={{flex: 1}}>
              <AllCapsSmBlack>Author</AllCapsSmBlack>
              <AllCapsSm style={{textTransform: 'none'}} color="text.secondary">
                {synopsis.author || 'Unknown'}
                {'\n'}
              </AllCapsSm>
            </VStack>
          </HStack>
        </Card>
        {synopsis.hazard_discussion && (
          <Card borderRadius={0} borderColor="white" header={<BodyBlack>{synopsis.bottom_line}</BodyBlack>}>
            <HTML source={{html: synopsis.hazard_discussion}} />
            {imageItems && <Carousel thumbnailHeight={160} thumbnailAspectRatio={1.3} media={imageItems} displayCaptions={false} />}
          </Card>
        )}
      </VStack>
    </ScrollView>
  );
};
