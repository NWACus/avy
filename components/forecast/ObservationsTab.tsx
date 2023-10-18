import {View} from 'components/core';
import {ObservationsListView} from 'components/observations/ObservationsListView';
import React from 'react';
import {AvalancheCenterID} from 'types/nationalAvalancheCenter';
import {RequestedTime} from 'utils/date';

interface ObservationsTabProps {
  zone_name: string;
  center_id: AvalancheCenterID;
  requestedTime: RequestedTime;
}

export const ObservationsTab: React.FunctionComponent<ObservationsTabProps> = ({zone_name, center_id, requestedTime}) => {
  return (
    // the top padding helps push the filter bar down in this view - a better solution may exist
    <View flex={1} pt={16}>
      <ObservationsListView center_id={center_id} requestedTime={requestedTime} additionalFilters={{zones: [zone_name]}} />
    </View>
  );
};
