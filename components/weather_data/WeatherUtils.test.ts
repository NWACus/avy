import {centerOrPartnerCenter} from 'components/weather_data/WeatherUtils';
import {AvalancheCenterID, avalancheCenterIDSchema} from 'types/nationalAvalancheCenter';

describe('centerOrPartnerCenter', () => {
  it('correctly updates the center id when needed', () => {
    for (const center_id in avalancheCenterIDSchema) {
      const centerIdValue = center_id as AvalancheCenterID;
      const partnerCenterId = centerOrPartnerCenter(centerIdValue);

      if (centerIdValue == 'HPAC') {
        expect(partnerCenterId).toStrictEqual('CNFAIC' as AvalancheCenterID);
      } else {
        expect(partnerCenterId).toStrictEqual(centerIdValue);
      }
    }
  });
});
