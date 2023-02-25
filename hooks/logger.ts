import Constants from 'expo-constants';

const log_network = Constants.expoConfig.extra ? Constants.expoConfig.extra.log_network : '';
export const logQueryKey = key => {
  if (log_network === 'all' || log_network.includes('queries')) {
    console.log(`QUERY: ${JSON.stringify(key)}`);
  }
  return key;
};
