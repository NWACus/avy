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
    <View pt={16}>
      <ObservationsListView center_id={center_id} requestedTime={requestedTime} initialFilterConfig={{zone: zone_name}} />
    </View>
  );
};
