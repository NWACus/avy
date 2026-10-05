import {useSessionNACApiVersion} from 'FeatureFlags';
import {NACApiVersion} from 'utils/nationalAvalancheCenterApi';

export const useNACApiVersion = (): NACApiVersion => useSessionNACApiVersion();
