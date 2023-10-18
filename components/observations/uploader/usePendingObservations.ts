import {ObservationFragmentWithStatus, getUploader} from 'components/observations/uploader/ObservationsUploader';
import {useCallback, useEffect, useState} from 'react';

export function usePendingObservations(): ObservationFragmentWithStatus[] {
  const [observations, setObservations] = useState<ObservationFragmentWithStatus[]>(getUploader().getPendingObservations());
  const refreshStatus = useCallback(() => {
    setObservations(getUploader().getPendingObservations());
  }, [setObservations]);

  useEffect(() => {
    const listener = () => refreshStatus();
    getUploader().subscribeToTaskInvocations(listener);
    return () => getUploader().unsubscribeFromTaskInvocations(listener);
  }, [refreshStatus]);

  return observations;
}
