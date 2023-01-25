import {DOMParser} from '@xmldom/xmldom';
import {merge} from 'lodash';

import axios, {AxiosError} from 'axios';
import {QueryClient, useQuery} from 'react-query';

import Log from 'network/log';

interface SnowLevel {
  subperiod: 'early' | 'late';
  level: string;
}
interface WindSpeed {
  subperiod: 'early' | 'late';
  speed: string;
}

interface ZoneForecast {
  label: string; // TODO: tighten this, it's either a day of the week, or a day with "Night" appended
  forecast?: string; // For some weather stations, all we have is precipitation
  snowLevel?: SnowLevel[];
  temperatures?: string;
  winds?: WindSpeed[];
  precipitation?: string;
}

interface WeatherForecast {
  author: string;
  published_time: string;
  expires_time: string;
  synopsis: string | null;
  zones: Record<string, ZoneForecast[]>;
}

export const useNWACWeatherForecast = () => {
  return useQuery<WeatherForecast, AxiosError | Error>({
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

const str = node => trim(node.firstChild?.toString() || '');

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

const periodInfo = (input: string) => {
  const parts = input.split(' ');
  const day = parts[0];
  switch (parts[1]) {
    case 'Morning':
      return {label: day, day, subperiod: 'early'};
    case 'Afternoon':
    case undefined:
      return {label: day, day, subperiod: 'late'};
    case 'Evening':
      return {label: `${day} Night`, day, subperiod: 'early'};
    case 'Night':
      return {label: input, day, subperiod: 'late'};
  }
};

export const fetchWeather = async () => {
  const url = 'https://nwac.us/mountain-weather-forecast/';
  const {data} = await axios.get(url);

  // hackity hack, the ridgeline winds table is missing </tr> tags on most of its rows
  const fixedData = data.replaceAll(/<\/td>[ \n]*<tr>/gm, '</td></tr><tr>').replaceAll(/<\/td>[ \n]*<\/table>/gm, '</td></tr></table>');

  // Parse the HTML into a Document
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

  const zones: Record<string, ZoneForecast[]> = {};

  // Zone forecasts
  const mwrIdToName = Object.fromEntries(
    toArray(doc.getElementsByClassName('forecast-tabs')[0].getElementsByTagName('div')).map(node => [node.getAttribute('data-mwr-id'), str(node)]),
  );
  toArray(doc.getElementsByClassName('mwr-forecast')).forEach(node => {
    const mwrId = node.getAttribute('data-mwr-id');
    const zoneName = mwrIdToName[mwrId];
    const periods = toArray(node.getElementsByTagName('th'))
      .filter(n => n.getAttribute('class') === 'row-header')
      .map(n => periodInfo(str(n)));
    const forecasts = toArray(node.getElementsByTagName('td'))
      .filter(n => n.getAttribute('class') === 'description')
      .map(n => str(n));
    merge(zones, {[zoneName]: periods.map((p, idx) => ({label: p.label, forecast: forecasts[idx]}))});
  });

  // console.log('step 1', JSON.stringify(zones, null, 2));

  // Zone snow level predictions
  const snowLevel = doc.getElementsByClassName('desktop snow-level')[0];
  const snowLevelRows = toArray(snowLevel.getElementsByTagName('tr'));
  const snowLevelPeriods = toArray(snowLevelRows[0].getElementsByTagName('th'))
    .slice(1)
    .map(n => periodInfo(str(n)));
  snowLevelRows.slice(1).forEach(row => {
    const zoneName = str(row.getElementsByTagName('th')[0]);
    const cells = toArray(row.getElementsByTagName('td')).map(cell => str(cell));
    cells.forEach((cell, idx) => {
      const period = snowLevelPeriods[idx];
      const forecast = zones[zoneName].find(f => f.label === period.label);
      if (forecast) {
        forecast['snowLevel'] ||= [];
        forecast['snowLevel'].push({subperiod: period.subperiod, level: cell});
      } else {
        // console.warn(`Snow level: could not find forecast for ${period.label}`, zones);
      }
    });
  });
  // console.log('step 2', JSON.stringify(zones, null, 2));

  const precip = doc.getElementsByClassName('desktop precipitation')[0];
  const precipRows = toArray(precip.getElementsByTagName('tr'));
  const precipPeriods = toArray(precipRows[0].getElementsByTagName('th'))
    .slice(1)
    .map(n => str(n))
    .filter(x => x.length > 0)
    .map(x => periodInfo(x));
  precipRows.slice(2).forEach(row => {
    const zoneName = str(row.getElementsByTagName('th')[0]);
    const cells = toArray(row.getElementsByTagName('td'))
      .map(cell => str(cell))
      .filter(x => x.length > 0);
    cells.forEach((cell, idx) => {
      const period = precipPeriods[idx];
      // Precipitation zones are not 1:1 with forecast zones, so we get things like "Hurricane Ridge" here
      if (!zones[zoneName]) {
        zones[zoneName] = [];
      }
      // And if we have a precip zone that's not a forecast zone, the forecast object won't exist, either
      const forecast = zones[zoneName].find(f => f.label === period.label) || (zones[zoneName].push({label: period.label}) && zones[zoneName][zones[zoneName].length - 1]);
      if (forecast) {
        forecast['precipitation'] = cell;
      } else {
        // console.warn(`Precipitation: could not find forecast for ${period.label}`, zones);
      }
    });
  });
  // console.log('step 3', JSON.stringify(zones, null, 2));

  const temps = doc.getElementsByClassName('desktop temperatures')[0];
  const tempsRows = toArray(temps.getElementsByTagName('tr'));
  const tempsPeriods = toArray(tempsRows[0].getElementsByTagName('th'))
    .slice(1)
    .map(n => str(n))
    .filter(x => x.length > 0)
    .map(n => periodInfo(n));
  tempsRows.slice(2).forEach(row => {
    const zoneName = str(row.getElementsByTagName('td')[0]);
    const cells = toArray(row.getElementsByTagName('td'))
      .slice(1)
      .map(cell => str(cell));
    cells.forEach((cell, idx) => {
      const period = tempsPeriods[idx];
      const forecast = zones[zoneName].find(f => f.label === period.label);
      if (forecast) {
        forecast['temperatures'] = cell;
      } else {
        // console.warn(`Temps: could not find forecast for ${period.label}`, zones);
      }
    });
  });
  // console.log('step 4', JSON.stringify(zones, null, 2));

  // Ridgeline winds table doesn't have a sensible classname :(
  const windsHeader = doc.getElementById('free-winds-5k');
  const winds = findNextSiblingByTag(windsHeader, 'div').getElementsByTagName('table')[0];
  const windsRows = toArray(winds.getElementsByTagName('tr'));
  const windsPeriods = toArray(windsRows[0].getElementsByTagName('th'))
    .slice(1)
    .map(n => str(n))
    .filter(x => x.length > 0)
    .map(n => periodInfo(n));
  windsRows.slice(1).forEach(row => {
    const zoneName = str(row.getElementsByTagName('th')[0]);
    const cells = toArray(row.getElementsByTagName('td')).map(cell => str(cell));
    cells.forEach((cell, idx) => {
      const period = windsPeriods[idx];
      const forecast = zones[zoneName].find(f => f.label === period.label);
      if (forecast) {
        forecast['winds'] ||= [];
        forecast['winds'].push({subperiod: period.subperiod, speed: cell});
      } else {
        // console.log(`Winds: could not find forecast for ${period.label}`, zones);
      }
    });
  });
  console.log('step 5', JSON.stringify(zones, null, 2));

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
