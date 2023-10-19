import {useQueryClient} from '@tanstack/react-query';
import {ObservationFragmentWithStatus, UploaderState, getUploader} from 'components/observations/uploader/ObservationsUploader';
import {useCallback, useEffect, useState} from 'react';

export function usePendingObservations(): ObservationFragmentWithStatus[] {
  const queryClient = useQueryClient();
  const [pendingObservations, setPendingObservations] = useState<ObservationFragmentWithStatus[]>(getUploader().getPendingObservations());
  const refreshStatus = useCallback(
    (_state: UploaderState) => {
      const nextPendingObservations = getUploader().getPendingObservations();
      if (nextPendingObservations.length < pendingObservations.length) {
        // Invalidate the query cache for the obs list query. It's a blunt instrument,
        // but it will force useNACObservations to return the newly uploaded data.
        void queryClient.refetchQueries({
          type: 'all',
          exact: false,
          queryKey: ['nac-observations'],
          refetchPage: (_page, index, _allPages) => {
            return index === 0;
          },
          // refetchPage: (_page, index, _allPages) => {
          //   return index === 0;
          // },
        });
      }
      setPendingObservations(nextPendingObservations);
    },
    [pendingObservations, queryClient, setPendingObservations],
  );

  useEffect(() => {
    getUploader().subscribeToStateUpdates(refreshStatus);
    return () => getUploader().unsubscribeFromStateUpdates(refreshStatus);
  }, [refreshStatus]);

  return pendingObservations;
}
