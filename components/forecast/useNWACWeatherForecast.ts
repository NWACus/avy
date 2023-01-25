import {DOMParser} from '@xmldom/xmldom';
import {merge, zipObject} from 'lodash';

import axios, {AxiosError} from 'axios';
import {QueryClient, useQuery} from 'react-query';

import * as Sentry from 'sentry-expo';

import Log from 'network/log';

import {ClientContext, ClientProps} from 'clientContext';
import {AvalancheCenterID, AvalancheForecastZone, MapLayer, mapLayerSchema} from 'types/nationalAvalancheCenter';
import {ZodError} from 'zod';

// interface ZoneForecast {
//   period: {};
// }

interface WeatherForecast {
  author: string;
  published_time: string;
  expires_time: string;
  synopsis: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  zones: any; // tbd Record<string, ZoneForecast> | null;
}

export const useNWACWeatherForecast = () => {
  return useQuery<WeatherForecast, AxiosError | ZodError>({
    queryKey: queryKey(),
    queryFn: async () => fetchWeather(),
  });
};

function queryKey() {
  return ['nwac-weather'];
}

export const prefetchWeather = async (queryClient: QueryClient) => {
  await queryClient.prefetchQuery({
    queryKey: queryKey(),
    queryFn: async () => {
      Log.prefetch('starting weather prefetch');
      const result = await fetchWeather();
      Log.prefetch('weather request finished');
      return result;
    },
  });
  Log.prefetch('avalanche center map layer is cached with react-query');
};

const toArray = (elements: HTMLCollection) => Array.prototype.slice.call(elements);

const trim = (str: string) => str.replaceAll(/[ \n]+/gm, ' ').trim();

const str = node => trim(node.firstChild.toString());

const findNextSiblingByTag = (node, tag: string) => {
  const nextSibling = node.nextSibling;
  if (!nextSibling) {
    return null;
  } else if (nextSibling.tagName === tag) {
    return nextSibling;
  } else {
    return findNextSiblingByTag(nextSibling, tag);
  }
};

export const fetchWeather = async () => {
  const url = 'https://nwac.us/mountain-weather-forecast/';
  const {data} = await axios.get(url);

  // hackity hack, the ridgeline winds table is missing </tr> tags on most of its rows
  const fixedData = data.replaceAll(/<\/td>[ \n]*<tr>/gm, '</td></tr><tr>').replaceAll(/<\/td>[ \n]*<\/table>/gm, '</td></tr></table>');

  const doc = new DOMParser({
    // Really don't care about warnings/errors, this is placeholder
    errorHandler: {
      warning: () => undefined,
      error: e => {
        throw e;
      },
      fatalError: e => {
        throw e;
      },
    },
  }).parseFromString(fixedData, 'text/html');

  const mwrIdToName = Object.fromEntries(
    toArray(doc.getElementsByClassName('forecast-tabs')[0].getElementsByTagName('div')).map(node => [node.getAttribute('data-mwr-id'), str(node)]),
  );

  const zones = {};

  const zoneForecasts = toArray(doc.getElementsByClassName('mwr-forecast')).forEach(node => {
    const mwrId = node.getAttribute('data-mwr-id');
    const zoneName = mwrIdToName[mwrId];
    const periods = toArray(node.getElementsByTagName('th'))
      .filter(n => n.getAttribute('class') === 'row-header')
      .map(n => str(n));
    const forecasts = toArray(node.getElementsByTagName('td'))
      .filter(n => n.getAttribute('class') === 'description')
      .map(n => str(n));
    merge(zones, {[zoneName]: {forecasts: zipObject(periods, forecasts)}});
  });

  console.log('step 1', zones);

  const snowLevel = doc.getElementsByClassName('desktop snow-level')[0];
  const snowLevelRows = toArray(snowLevel.getElementsByTagName('tr'));
  const snowLevelPeriods = toArray(snowLevelRows[0].getElementsByTagName('th'))
    .slice(1)
    .map(n => str(n));
  snowLevelRows.slice(1).forEach(row => {
    const zoneName = str(row.getElementsByTagName('th')[0]);
    const cells = toArray(row.getElementsByTagName('td')).map(cell => str(cell));
    merge(zones, {[zoneName]: {snowLevel: zipObject(snowLevelPeriods, cells)}});
  });
  console.log('step 2', zones);

  const precip = doc.getElementsByClassName('desktop precipitation')[0];
  const precipRows = toArray(precip.getElementsByTagName('tr'));
  const precipPeriods = toArray(precipRows[0].getElementsByTagName('th'))
    .slice(1)
    .map(n => str(n))
    .filter(x => x.length > 0);
  precipRows.slice(2).forEach(row => {
    const zoneName = str(row.getElementsByTagName('th')[0]);
    const cells = toArray(row.getElementsByTagName('td'))
      .map(cell => str(cell))
      .filter(x => x.length > 0);
    merge(zones, {[zoneName]: {precipitation: zipObject(precipPeriods, cells)}});
  });
  console.log('step 3', zones);

  const temps = doc.getElementsByClassName('desktop temperatures')[0];
  const tempsRows = toArray(temps.getElementsByTagName('tr'));
  const tempsPeriods = toArray(tempsRows[0].getElementsByTagName('th'))
    .slice(1)
    .map(n => str(n))
    .filter(x => x.length > 0);
  tempsRows.slice(2).forEach(row => {
    const zoneName = str(row.getElementsByTagName('td')[0]);
    const cells = toArray(row.getElementsByTagName('td'))
      .slice(1)
      .map(cell => str(cell));
    merge(zones, {[zoneName]: {temperatures: zipObject(tempsPeriods, cells)}});
  });
  console.log('step 4', zones);

  // Ridgeline winds table doesn't have a sensible classname :(
  const windsHeader = doc.getElementById('free-winds-5k');
  const winds = findNextSiblingByTag(windsHeader, 'div').getElementsByTagName('table')[0];
  const windsRows = toArray(winds.getElementsByTagName('tr'));
  const windsPeriods = toArray(windsRows[0].getElementsByTagName('th'))
    .slice(1)
    .map(n => str(n))
    .filter(x => x.length > 0);
  windsRows.slice(1).forEach(row => {
    const zoneName = str(row.getElementsByTagName('th')[0]);
    const cells = toArray(row.getElementsByTagName('td')).map(cell => str(cell));
    merge(zones, {[zoneName]: {winds: zipObject(windsPeriods, cells)}});
  });
  console.log('step 5', zones);

  console.log(JSON.stringify(zoneForecasts, null, 2));

  return {
    author: str(doc.getElementsByClassName('forecaster')[0]),
    published_time: str(doc.getElementsByClassName('forecast-date')[0]),
    expires_time: 'never',
    synopsis: trim(doc.getElementsByClassName('synopsis')[0].getElementsByTagName('p').toString()),
    zones,
  };
};

export default {
  queryKey,
  fetch: fetchWeather,
  prefetch: prefetchWeather,
};
