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
        // Invalidate the query cache for the obs list query - if the list view is open,
        // it will fetch the observation into the list and enable the user to click into it.
        void queryClient.invalidateQueries({
          exact: false,
          queryKey: ['nac-observations'],
          refetchPage: (_page, index) => {
            // We only need to refetch page 0, that's where the newest data is
            return index === 0;
          },
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
