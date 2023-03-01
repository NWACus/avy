import Constants from 'expo-constants';
import log from 'logger';

const log_network = Constants.expoConfig.extra ? Constants.expoConfig.extra.log_network : '';
export const logQueryKey = key => {
  if (log_network === 'all' || log_network.includes('queries')) {
    log.info(`QUERY: ${JSON.stringify(key)}`);
  }
  return key;
};
