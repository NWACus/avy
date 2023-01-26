import {DOMParser} from '@xmldom/xmldom';
import {merge} from 'lodash';

import axios, {AxiosError} from 'axios';
import {QueryClient, useQuery} from 'react-query';

import Log from 'network/log';

const precipZoneToForecastZone = {
  'Hurricane Ridge': 'Olympics',
  'Mt Baker Ski Area': 'West Slopes North',
  'Mt. Loop - Barlow Pass': 'West Slopes Central',
  'Crystal Mt': 'West Slopes South',
  Paradise: 'West Slopes South',
  'White Pass': 'West Slopes South',
  'Washington Pass': 'East Slopes North',
  'Mission Ridge': 'East Slopes Central',
  'Salmon la Sac - Gallagher Head': 'East Slopes Central',
  'Tieton River - Darland Mt.': 'East Slopes South',
  Timberline: 'Mt Hood',
  'Mt Hood Meadows': 'Mt Hood',
  'Snoqualmie Pass': 'Snoqualmie Pass',
  'Stevens Pass': 'Stevens Pass',
};

type PrecipitationZone = keyof typeof precipZoneToForecastZone;

// TODO: use ts-to-zod to generate Zod schemas that can be applied to a future API
interface SnowLevel {
  period: 'day' | 'night';
  subperiod: 'early' | 'late';
  level: number;
}

interface WindSpeed {
  period: 'day' | 'night';
  subperiod: 'early' | 'late';
  speed: string;
}

interface ZoneForecast {
  label: string; // TODO: tighten this, it's either a day of the week, or a day with "Night" appended
  forecast: string;
  snowLevel: SnowLevel[];
  temperatures: {low: number; high: number};
  winds: WindSpeed[];
  precipitation: Record<PrecipitationZone, string>;
}

interface WeatherForecast {
  author: string;
  published_time: string;
  expires_time: string;
  synopsis: string | null;
  // TODO: NAC zone id would be less fragile than using zone name here
  zones: Record<string, ZoneForecast[]>;
}

export const useNWACWeatherForecast = () => {
  // TODO: add caching parameters
  // TODO: add to preload sequence
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
      return {label: day, day, period: 'day', subperiod: 'early'};
    case 'Afternoon':
    case undefined:
      return {label: day, day, period: 'day', subperiod: 'late'};
    case 'Evening':
      return {label: `${day} Night`, day, period: 'night', subperiod: 'early'};
    case 'Night':
      return {label: input, day, period: 'night', subperiod: 'late'};
  }
};

const zoneNameMap = {
  'East Central': 'East Slopes Central',
  'East North': 'East Slopes North',
  'East South': 'East Slopes South',
  'West Central': 'West Slopes Central',
  'West North': 'West Slopes North',
  'West South': 'West Slopes South',
  'Mt. Hood': 'Mt Hood',
};

const canonicalZoneName = (input: string) => {
  const trimmed = str(input);
  return zoneNameMap[trimmed] || trimmed;
};

export const fetchWeather = async () => {
  const url = 'https://nwac.us/mountain-weather-forecast/';
  const {data} = await axios.get(url);

  // hackity hack, the ridgeline winds table is missing </tr> tags on most of its rows! <sigh>
  const fixedData = data.replaceAll(/<\/td>[ \n]*<tr>/gm, '</td></tr><tr>').replaceAll(/<\/td>[ \n]*<\/table>/gm, '</td></tr></table>');

  // Parse the HTML into a Document
  const doc = new DOMParser({
    // Really don't care about warnings/errors, this data source is placeholder
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
    toArray(doc.getElementsByClassName('forecast-tabs')[0].getElementsByTagName('div')).map(node => [node.getAttribute('data-mwr-id'), canonicalZoneName(node)]),
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
    merge(zones, {[zoneName]: periods.map((p, idx) => ({label: p.label, forecast: forecasts[idx], precipitation: {}}))});
  });

  // console.log('step 1', JSON.stringify(zones, null, 2));

  // Zone snow level predictions
  const snowLevel = doc.getElementsByClassName('desktop snow-level')[0];
  const snowLevelRows = toArray(snowLevel.getElementsByTagName('tr'));
  const snowLevelPeriods = toArray(snowLevelRows[0].getElementsByTagName('th'))
    .slice(1)
    .map(n => periodInfo(str(n)));
  snowLevelRows.slice(1).forEach(row => {
    const zoneName = canonicalZoneName(row.getElementsByTagName('th')[0]);
    const cells = toArray(row.getElementsByTagName('td')).map(cell => str(cell));
    cells.forEach((cell, idx) => {
      const period = snowLevelPeriods[idx];
      const forecast = zones[zoneName].find(f => f.label === period.label);
      if (forecast) {
        forecast['snowLevel'] = forecast['snowLevel'] || [];
        forecast['snowLevel'].push({period: period.period, subperiod: period.subperiod, level: Number(cell.replace(/\D/g, ''))});
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
    const precipZone = canonicalZoneName(row.getElementsByTagName('th')[0]);
    const zoneName = precipZoneToForecastZone[precipZone];
    if (zoneName) {
      const cells = toArray(row.getElementsByTagName('td'))
        .map(cell => str(cell))
        .filter(x => x.length > 0);
      cells.forEach((cell, idx) => {
        const period = precipPeriods[idx];
        const forecast = zones[zoneName].find(f => f.label === period.label);
        if (forecast) {
          forecast.precipitation[precipZone] = cell;
        } else {
          // console.warn(`Precipitation: could not find forecast for ${period.label}`, zones);
        }
      });
    }
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
    const zoneName = canonicalZoneName(row.getElementsByTagName('td')[0]);
    const cells = toArray(row.getElementsByTagName('td'))
      .slice(1)
      .map(cell => str(cell));
    cells.forEach((cell, idx) => {
      const period = tempsPeriods[idx];
      const forecast = zones[zoneName].find(f => f.label === period.label);
      if (forecast) {
        const [_temp, high, low] = cell.match(/(\d+)\s*\/\s*(\d+)/);
        forecast['temperatures'] = {low: Number(low), high: Number(high)};
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
    const zoneName = canonicalZoneName(row.getElementsByTagName('th')[0]);
    const cells = toArray(row.getElementsByTagName('td')).map(cell => str(cell));
    cells.forEach((cell, idx) => {
      const period = windsPeriods[idx];
      const forecast = zones[zoneName].find(f => f.label === period.label);
      if (forecast) {
        forecast['winds'] = forecast['winds'] || [];
        forecast['winds'].push({period: period.period, subperiod: period.subperiod, speed: cell});
      } else {
        // console.log(`Winds: could not find forecast for ${period.label}`, zones);
      }
    });
  });
  // console.log('step 5', JSON.stringify(zones, null, 2));

  return {
    author: str(doc.getElementsByClassName('forecaster')[0]).replace('by ', ''),
    // TODO: parse this time string - it's non-standard. The text is `Issued: 2:00 PM PST Wednesday, January 25, 2023`
    published_time: str(doc.getElementsByClassName('forecast-date')[0]),
    // TODO: need a real time here, base it on expected publish times (6 am / 2 pm I think?)
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
