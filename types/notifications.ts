import {AvalancheForecastZone} from 'types/nationalAvalancheCenter';

export type NotificationPermissionStatus = 'undetermined' | 'granted' | 'denied';

export type NotificationZone = Pick<AvalancheForecastZone, 'id' | 'name'>;
