import {useEffect} from 'react';
import {AppState, AppStateStatus} from 'react-native';

export const useAppState = (onChange: (status: AppStateStatus) => void) => {
  useEffect(() => {
    AppState.addEventListener('change', onChange);
    return () => {
      AppState.removeEventListener('change', onChange);
    };
  }, [onChange]);
}
