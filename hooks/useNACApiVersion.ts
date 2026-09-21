import {useOneFeatureFlag} from 'FeatureFlags';
import {NAC_V3_KILL_SWITCH, NACApiVersion, nacApiVersion} from 'utils/nationalAvalancheCenterApi';

export const useNACApiVersion = (): NACApiVersion => nacApiVersion(!!useOneFeatureFlag(NAC_V3_KILL_SWITCH));
