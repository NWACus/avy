import * as Sentry from '@sentry/react-native';
import {incompleteQueryState, NotFound, QueryState} from 'components/content/QueryState';
import {View} from 'components/core';
import {ObservationsListView} from 'components/observations/ObservationsListView';
import {useAvalancheCenterMetadata} from 'hooks/useAvalancheCenterMetadata';
import React from 'react';
import {AvalancheCenterID, AvalancheForecastZone, AvalancheForecastZoneStatus} from 'types/nationalAvalancheCenter';
import {NotFoundError} from 'types/requests';
import {RequestedTime} from 'utils/date';

interface ObservationsTabProps {
  forecast_zone_id: number;
  center_id: AvalancheCenterID;
  requestedTime: RequestedTime;
}

export const ObservationsTab: React.FunctionComponent<ObservationsTabProps> = ({forecast_zone_id, center_id, requestedTime}) => {
  const centerResult = useAvalancheCenterMetadata(center_id);
  const center = centerResult.data;

  if (incompleteQueryState(centerResult) || !center) {
    return <QueryState results={[centerResult]} />;
  }

  const zone: AvalancheForecastZone | undefined = center.zones.find(item => item.id === forecast_zone_id);
  if (!zone || zone.status === AvalancheForecastZoneStatus.Disabled) {
    const message = `Avalanche center ${center_id} had no zone with id ${forecast_zone_id}`;
    if (!zone) {
      // If the zone is intentionally disabled, don't log to Sentry
      Sentry.captureException(new Error(message));
    }
    return <NotFound what={[new NotFoundError(message, 'avalanche forecast zone')]} />;
  }

  return (
    // the top padding helps push the filter bar down in this view - a better solution may exist
    <View flex={1} pt={16}>
      <ObservationsListView center_id={center_id} requestedTime={requestedTime} additionalFilters={{zones: [zone.name]}} />
    </View>
  );
};
