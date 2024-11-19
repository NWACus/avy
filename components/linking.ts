import {NavigationState, PartialState} from '@react-navigation/native';
import {Logger} from 'browser-bunyan';
import {TabNavigatorParamList} from 'routes';
import {AvalancheCenterID, AvalancheCenterWebsites, reverseLookup} from 'types/nationalAvalancheCenter';

export const getStateFromUrl = (logger: Logger, rawUrl: string): undefined | PartialState<NavigationState<TabNavigatorParamList>> => {
  let thisLogger = logger.child({url: rawUrl});
  thisLogger.info('handling URL');
  const url = new URL(rawUrl);
  const center: string | undefined = reverseLookup(AvalancheCenterWebsites, url.protocol + '//' + url.hostname + '/');
  if (!center) {
    thisLogger.info('unknown hostname');
    return undefined;
  }
  const avalancheCenter = center as AvalancheCenterID;
  const prefixes = prefixesForCenter(avalancheCenter);
  thisLogger = thisLogger.child({center: avalancheCenter});

  if (prefixes.avalanche) {
    const forecast = forecastState(avalancheCenter, url.pathname, prefixes.avalanche);
    if (forecast) {
      thisLogger.info('avalanche forecast');
      return forecast;
    }
  }

  if (prefixes.weatherStation) {
    const weatherTab = weatherTabState(avalancheCenter, url.pathname, prefixes.weatherStation);
    if (weatherTab) {
      thisLogger.info('weather data');
      return weatherTab;
    }

    const weatherStation = weatherStationState(avalancheCenter, url.pathname, prefixes.weatherStation);
    if (weatherStation) {
      thisLogger.info('weather station');
      return weatherStation;
    }
  }

  if (prefixes.nwacWeatherStation) {
    const weatherTab = nwacWeatherTabState(avalancheCenter, url.pathname, prefixes.nwacWeatherStation);
    if (weatherTab) {
      thisLogger.info('nwac weather data');
      return weatherTab;
    }

    const weatherStation = nwacWeatherStationState(avalancheCenter, url.pathname, prefixes.nwacWeatherStation);
    if (weatherStation) {
      thisLogger.info('nwac weather station');
      return weatherStation;
    }
  }

  if (prefixes.observations) {
    // https://nwac.us/observations
    // https://nwac.us/observations/#/view/observations
    const observationsTab = observationsTabState(avalancheCenter, url.pathname, prefixes.observations);
    if (observationsTab) {
      thisLogger.info('observations list');
      return observationsTab;
    }

    // https://nwac.us/observations/#/view/observations/e97eb763-61a6-4188-abc0-a115f5660fe4
    // https://nwac.us/observations/#/observation/e97eb763-61a6-4188-abc0-a115f5660fe4
    const observation = observationState(avalancheCenter, url.pathname, prefixes.observations);
    if (observation) {
      thisLogger.info('observation');
      return observation;
    }

    // https://nwac.us/observations/#/form
    const observationSubmission = observationSubmissionState(avalancheCenter, url.pathname, prefixes.observations);
    if (observationSubmission) {
      thisLogger.info('observationSubmission');
      return observationSubmission;
    }
  }

  thisLogger.info('unknown URL');
  return undefined;
};

type prefixes = {
  avalanche?: string;
  weatherStation?: string;
  nwacWeatherStation?: string;
  observations?: string;
};

// centers use the widgets, and the widgets manage state after some prefix in the URL; not ever center has the same prefix for every widget
const prefixesForCenter = (avalancheCenter: AvalancheCenterID): prefixes => {
  switch (avalancheCenter) {
    case 'BAC': {
      return {
        // TODO: do they use zone_id (bwra) to index? what is 'all' ?
        // https://bridgeportavalanchecenter.org/avalanche-forecast/#/all
        avalanche: 'avalanche-forecast',
        // https://bridgeportavalanchecenter.org/observations
        // https://bridgeportavalanchecenter.org/observations/#/view/observations
        // https://bridgeportavalanchecenter.org/observations/#/view/observations/14d286ef-d659-45fb-b8d6-0957230e3b84
        // https://bridgeportavalanchecenter.org/observations/#/observation/14d286ef-d659-45fb-b8d6-0957230e3b84
        observations: 'observations',
      };
    }
    case 'BTAC': {
      return {
        // https://bridgertetonavalanchecenter.org/forecasts/#/tetons
        avalanche: 'forecasts',
        // https://bridgertetonavalanchecenter.org/weather-stations/#/
        weatherStation: 'weather-stations',
        // // https://bridgertetonavalanchecenter.org/observations/#/view/observations
        observations: 'observations',
      };
    }
    case 'CBAC': {
      return {
        // https://cbavalanchecenter.org/forecasts/#/southeast-mountains
        avalanche: 'forecasts',
        // https://cbavalanchecenter.org/weather/weather-station/#/
        weatherStation: 'weather-station',
        // https://cbavalanchecenter.org/view-observations/#/view/observations
        observations: 'view-observations',
      };
    }
    case 'CNFAIC': {
      return {
        // TODO: doesn't seem like they use the NAC to drive forecasts?
        // https://www.cnfaic.org/forecast/turnagain/
        // avalanche: 'forecast',
        // https://www.cnfaic.org/wx/wxmap.php#/
        weatherStation: 'wxmap.php',
        // https://www.cnfaic.org/observations/#/view/observations
        observations: 'observations',
      };
    }
    case 'COAA': {
      return {
        // https://www.coavalanche.org/forecasts/#/central-cascades
        avalanche: 'forecasts',
        // https://www.coavalanche.org/map/#/
        weatherStation: 'map',
        // https://www.coavalanche.org/observations/#/view/observations
        observations: 'observations',
      };
    }
    case 'ESAC': {
      return {
        // https://www.esavalanche.org/forecasts/#/eastside-region
        avalanche: 'forecasts',
        // https://www.esavalanche.org/weather-maps/#/
        weatherStation: 'weather-maps',
        // https://www.esavalanche.org/observations/#/view/observations
        observations: 'observations',
      };
    }
    case 'FAC': {
      return {
        // https://flatheadavalanche.com/avalanche-forecast/#/whitefish-range
        avalanche: 'avalanche-forecast',
        // https://flatheadavalanche.com/weather/#/
        weatherStation: 'weather',
        // https://flatheadavalanche.com/observations/view-observations/#/view/observations
        observations: 'view-observations',
      };
    }
    case 'HPAC': {
      return {
        // https://hpavalanche.org/forecast/#/hatcher-pass/
        avalanche: 'forecast',
        // https://hpavalanche.org/observations/#/view/observations
        observations: 'observations',
      };
    }
    case 'IPAC': {
      return {
        // https://www.idahopanhandleavalanche.org/forecasts/#/selkirk-mountains/
        avalanche: 'forecasts',
        // https://www.idahopanhandleavalanche.org/weather/#/
        weatherStation: 'weather',
        // https://www.idahopanhandleavalanche.org/observations/#/view/observations
        observations: 'observations',
      };
    }
    case 'KPAC': {
      return {
        // https://kachinapeaks.org/Forecast/#/san-francisco-peaks-%2F-kachina-peaks-wilderness
        avalanche: 'Forecast',
        // https://kachinapeaks.org/Observations/#/view/observations
        observations: 'Observations',
      };
    }
    case 'MSAC': {
      return {
        // https://www.shastaavalanche.org/advisories/avalanche-advisory/#/mount-shasta
        avalanche: 'advisories/avalanche-advisory',
        // https://www.shastaavalanche.org/page/weather-stations#/
        weatherStation: 'page/weather-stations',
        // https://www.shastaavalanche.org/node/7867/#/view/observations
        observations: 'node/7867',
      };
    }
    case 'MWAC': {
      return {
        // https://www.mountwashingtonavalanchecenter.org/forecasts/#/presidential-range
        avalanche: 'forecasts',
        // https://www.mountwashingtonavalanchecenter.org/observations/#/view/observations
        observations: 'observations',
      };
    }
    case 'NWAC': {
      return {
        // https://nwac.us/avalanche-forecast/#/olympics/
        // https://nwac.us/avalanche-forecast/#/olympics/weather-forecast
        avalanche: 'avalanche-forecast',
        // https://nwac.us/weatherdata/
        // https://nwac.us/weatherdata/hurricaneridge/now/
        nwacWeatherStation: 'weatherdata',
        // https://nwac.us/observations
        // https://nwac.us/observations/#/view/observations
        // https://nwac.us/observations/#/view/observations/e97eb763-61a6-4188-abc0-a115f5660fe4
        // https://nwac.us/observations/#/observation/e97eb763-61a6-4188-abc0-a115f5660fe4
        observations: 'observations',
      };
    }
    case 'PAC': {
      return {
        // https://payetteavalanche.org/forecasts/#/pac-advisory-area
        avalanche: 'forecasts',
        // https://payetteavalanche.org/observations/#/view/observations
        observations: 'observations',
      };
    }
    case 'SAC': {
      return {
        // https://www.sierraavalanchecenter.org/forecasts/#/central-sierra-nevada
        avalanche: 'forecasts',
        // https://www.sierraavalanchecenter.org/weather-station-map#/
        // https://www.sierraavalanchecenter.org/weather-station-map#/428
        weatherStation: 'weather-station-map',
        // https://www.sierraavalanchecenter.org/observations
        // https://www.sierraavalanchecenter.org/observations#/view/observations
        // https://www.sierraavalanchecenter.org/observations#/view/observations/5665ba6e-eb19-48d6-806f-86b5cd63c889
        // https://www.sierraavalanchecenter.org/observations#/observation/5665ba6e-eb19-48d6-806f-86b5cd63c889
        observations: 'observations',
      };
    }
    case 'SNFAC': {
      return {
        // https://www.sawtoothavalanche.com/forecasts/#/sawtooth-&-western-smoky-mtns
        avalanche: 'forecasts',
        // https://www.sawtoothavalanche.com/weather-station-map/#/
        weatherStation: 'weather-station-map',
        // https://www.sawtoothavalanche.com/observations/#/view/observations
        observations: 'observations',
      };
    }
    case 'TAC': {
      return {
        // https://taosavalanchecenter.org/forecasts/#/northern-new-mexico
        avalanche: 'forecasts',
        // https://taosavalanchecenter.org/weather-station-map/#/
        weatherStation: 'weather-station-map',
        // TODO: looks like this uses the NAC backend but doesn't use the widget?
        // https://taosavalanchecenter.org/observations/
        // https://taosavalanchecenter.org/public-obs/20241023_williams-lake/
        // observations: 'observations',
      };
    }
    case 'WAC': {
      return {
        // https://wallowaavalanchecenter.org/forecasts/#/northern-wallowas
        avalanche: 'forecasts',
        // https://wallowaavalanchecenter.org/weather-station-map/#/
        weatherStation: 'weather-station-map',
        // https://wallowaavalanchecenter.org/observations-list/#/view/observations
        observations: 'observations-list',
      };
    }
    case 'WCMAC': {
      return {
        // https://missoulaavalanche.org/forecasts/#/Bitterroot
        avalanche: 'forecasts',
        // https://missoulaavalanche.org/observations/#/view/observations
        observations: 'observations',
      };
    }
  }

  const invalid: never = avalancheCenter;
  throw new Error(`Unable parse linking URL, unknown avalanche center: ${JSON.stringify(invalid)}`);
};

const forecastState = (center_id: AvalancheCenterID, path: string, prefix: string): false | PartialState<NavigationState<TabNavigatorParamList>> => {
  const match = path.match(new RegExp(`^/${prefix}/#/(?<zone>[^/]+)(/(?<tab>[^/]+))?$`));
  if (match && match.groups && match.groups.zone) {
    const tabMapping: Record<string, string> = {
      '': 'avalanche', // the avalanche tab is implicit on the web
      'weather-forecast': 'weather',
      observations: 'observations',
      avalanches: 'avalanche', // we do not (yet) support viewing avalanches on the app
    };

    // TODO: support zone slug
    return {
      routes: [
        {
          name: 'Home',
          params: {center_id: center_id, requestedTime: 'latest'},
          state: {
            routes: [
              {
                name: 'forecast',
                params: {center_id: center_id, forecast_zone_id: match.groups.zone, requestedTime: 'latest'},
                state: {
                  routes: [
                    {
                      name: tabMapping[match.groups.tab || ''],
                      params: {center_id: center_id, forecast_zone_id: match.groups.zone, requestedTime: 'latest'},
                    },
                  ],
                },
              },
            ],
          },
        },
      ],
    };
  }

  return false;
};

const weatherTabState = (center_id: AvalancheCenterID, path: string, prefix: string): false | PartialState<NavigationState<TabNavigatorParamList>> => {
  const match = path.match(new RegExp(`^/${prefix}/?#?/?$`));
  if (match) {
    return {
      routes: [
        {
          name: 'Weather Data',
          params: {center_id: center_id, requestedTime: 'latest'},
          state: {
            routes: [
              {
                name: 'stationList',
                params: {center_id: center_id, requestedTime: 'latest'},
              },
            ],
          },
        },
      ],
    };
  }
  return false;
};

const weatherStationState = (center_id: AvalancheCenterID, path: string, prefix: string): false | PartialState<NavigationState<TabNavigatorParamList>> => {
  const match = path.match(new RegExp(`^/${prefix}/?#?/?(?<station>[^/]+)/?$`));
  if (match && match.groups && match.groups.station) {
    // TODO: why is source even required?
    return {
      routes: [
        {
          name: 'Weather Data',
          params: {center_id: center_id, requestedTime: 'latest'},
          state: {
            routes: [
              {
                name: 'stationList',
                params: {center_id: center_id, requestedTime: 'latest'},
              },
              {
                name: 'stationsDetail',
                params: {center_id: center_id, stationId: match.groups.station, source: '?', requestedTime: 'latest'},
              },
            ],
          },
        },
      ],
    };
  }
  return false;
};

const nwacWeatherTabState = (center_id: AvalancheCenterID, path: string, prefix: string): false | PartialState<NavigationState<TabNavigatorParamList>> => {
  const match = path.match(new RegExp(`^/${prefix}/?$`));
  if (match) {
    return {
      routes: [
        {
          name: 'Weather Data',
          params: {center_id: center_id, requestedTime: 'latest'},
          state: {
            routes: [
              {
                name: 'stationList',
                params: {center_id: center_id, requestedTime: 'latest'},
              },
            ],
          },
        },
      ],
    };
  }
  return false;
};

const nwacWeatherStationState = (center_id: AvalancheCenterID, path: string, prefix: string): false | PartialState<NavigationState<TabNavigatorParamList>> => {
  const match = path.match(new RegExp(`^/${prefix}/(?<station>[^/]+)/now/?$`));
  if (match && match.groups && match.groups.station) {
    // TODO: how do we figure out stations list, zone name?
    return {
      routes: [
        {
          name: 'Weather Data',
          params: {center_id: center_id, requestedTime: 'latest'},
          state: {
            routes: [
              {
                name: 'stationList',
                params: {center_id: center_id, requestedTime: 'latest'},
              },
              {
                name: 'stationsDetail',
                params: {center_id: center_id, name: match.groups.station, stations: '?', zoneName: '?', requestedTime: 'latest'},
              },
            ],
          },
        },
      ],
    };
  }
  return false;
};

const observationsTabState = (center_id: AvalancheCenterID, path: string, prefix: string): false | PartialState<NavigationState<TabNavigatorParamList>> => {
  const match = path.match(new RegExp(`^/${prefix}(/?#/view/observations)?$`));
  if (match) {
    return {
      routes: [
        {
          name: 'Observations',
          params: {center_id: center_id, requestedTime: 'latest'},
          state: {
            routes: [
              {
                name: 'observationsList',
                params: {center_id: center_id, requestedTime: 'latest'},
              },
            ],
          },
        },
      ],
    };
  }
  return false;
};

const observationState = (center_id: AvalancheCenterID, path: string, prefix: string): false | PartialState<NavigationState<TabNavigatorParamList>> => {
  const match = path.match(new RegExp(`^/${prefix}/?#/(view/observations/|observation/)(?<id>[^/]+)$`));
  if (match && match.groups && match.groups.id) {
    return {
      routes: [
        {
          name: 'Observations',
          params: {center_id: center_id, requestedTime: 'latest'},
          state: {
            routes: [
              {
                name: 'observationsList',
                params: {center_id: center_id, requestedTime: 'latest'},
              },
              {
                name: 'observation',
                params: {id: match.groups.id},
              },
            ],
          },
        },
      ],
    };
  }
  return false;
};

const observationSubmissionState = (center_id: AvalancheCenterID, path: string, prefix: string): false | PartialState<NavigationState<TabNavigatorParamList>> => {
  const match = path.match(new RegExp(`^/${prefix}/?#/form/?$`));
  if (match) {
    return {
      routes: [
        {
          name: 'Observations',
          params: {center_id: center_id, requestedTime: 'latest'},
          state: {
            routes: [
              {
                name: 'observationSubmit',
                params: {center_id: center_id},
              },
            ],
          },
        },
      ],
    };
  }
  return false;
};

export const observationLink = (avalancheCenter: AvalancheCenterID, id: string): string | undefined => {
  const prefix = prefixesForCenter(avalancheCenter);
  if (!prefix.observations) {
    return undefined;
  }

  return AvalancheCenterWebsites[avalancheCenter] + prefix.observations + '/#/view/observations/' + id;
};
