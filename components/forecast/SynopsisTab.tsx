import React, {useCallback} from 'react';

import {formatDistanceToNow, isAfter} from 'date-fns';

import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {Card} from 'components/content/Card';
import {QueryState, incompleteQueryState} from 'components/content/QueryState';
import Toast from 'components/content/ToastRoot';
import {MediaCarousel} from 'components/content/carousel/MediaCarousel';
import {HStack, VStack} from 'components/core';
import {AllCapsSm, AllCapsSmBlack, BodyBlack, Title3Black} from 'components/text';
import {HTML} from 'components/text/HTML';
import {useAvalancheCenterMetadata} from 'hooks/useAvalancheCenterMetadata';
import {useRefresh} from 'hooks/useRefresh';
import {useSynopsis} from 'hooks/useSynopsis';
import {RefreshControl, ScrollView} from 'react-native';
import {MainStackNavigationProps} from 'routes';
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

  const navigation = useNavigation<MainStackNavigationProps>();
  React.useEffect(() => {
    return navigation.addListener('beforeRemove', () => {
      Toast.hide();
    });
  }, [navigation]);

  // Key the effect on the expiry string, not the synopsis object: React Query refetches can produce a new
  // object identity for identical data, and re-running this effect hides the toast (cleanup) out from under
  // the user even though it is set to never auto-hide.
  const expiresTimeString = synopsis?.expires_time;
  useFocusEffect(
    useCallback(() => {
      let shown = false;
      let timer: ReturnType<typeof setTimeout> | undefined;
      let removeListener: (() => void) | undefined;
      if (expiresTimeString && isAfter(new Date(), new Date(expiresTimeString))) {
        const expires_time = new Date(expiresTimeString);
        const showToast = () => {
          if (shown) {
            return;
          }
          shown = true;
          Toast.show({
            type: 'error',
            text1: `This blog expired ${formatDistanceToNow(expires_time)} ago.`,
            autoHide: false,
            position: 'bottom',
            onPress: () => Toast.hide(),
          });
        };
        // Show once the screen-push transition ends — touches are blocked while it runs. Fall back to a
        // short delay when there's no transition (e.g. a tab re-focus, where transitionEnd never fires).
        const stackNavigation: MainStackNavigationProps | undefined = navigation.getParent();
        removeListener = stackNavigation?.addListener('transitionEnd', showToast);
        timer = setTimeout(showToast, 600);
      }
      return () => {
        removeListener?.();
        if (timer) {
          clearTimeout(timer);
        }
        Toast.hide();
      };
    }, [expiresTimeString, navigation]),
  );

  if (incompleteQueryState(centerResult, synopsisResult) || !center || !synopsis) {
    return <QueryState results={[centerResult, synopsisResult]} />;
  }

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
            {synopsis.media && <MediaCarousel thumbnailHeight={160} thumbnailAspectRatio={1.3} mediaItems={synopsis.media} />}
          </Card>
        )}
      </VStack>
    </ScrollView>
  );
};
