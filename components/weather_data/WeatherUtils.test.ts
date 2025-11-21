import {usePartnerCenterIdForStationFetch} from 'components/weather_data/WeatherUtils';
import {AvalancheCenterID, avalancheCenterIDSchema} from 'types/nationalAvalancheCenter';

describe('usePartnerCenterIdForStationFetch', () => {
  it('correctly updates the center id when needed', () => {
    for (const center_id in avalancheCenterIDSchema) {
      const centerIdValue = center_id as AvalancheCenterID;
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const partnerCenterId = usePartnerCenterIdForStationFetch(centerIdValue);

      if (centerIdValue == 'HPAC') {
        expect(partnerCenterId).toStrictEqual('CNFAIC' as AvalancheCenterID);
      } else {
        expect(partnerCenterId).toStrictEqual(centerIdValue);
      }
    }
  });
});
