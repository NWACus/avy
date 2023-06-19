/* eslint-disable no-console */
import * as fs from 'fs';
import * as path from 'path';

// eslint-disable-next-line
import {
  avalancheCenterSchema,
  mapLayerSchema,
  nwacObservationSchema,
  nwacObservationsListSchema,
  observationListResultSchema,
  observationSchema,
  productFragmentArraySchema,
  productSchema,
  ProductType,
} from './types/nationalAvalancheCenter';

async function* walk(dir: string): AsyncGenerator<string> {
  for await (const d of await fs.promises.opendir(dir)) {
    const entry = path.join(dir, d.name);
    if (d.isDirectory()) yield* walk(entry);
    else if (d.isFile()) yield entry;
  }
}

async function main() {
  // TODO: pass in data dir as an arg
  const dir = '/tmp/nac-data';
  let metadata = 0;
  let mapLayer = 0;
  let fragments = 0;
  const products: Record<ProductType, number> = {
    [ProductType.Forecast]: 0,
    [ProductType.Summary]: 0,
    [ProductType.Synopsis]: 0,
    [ProductType.Warning]: 0,
    [ProductType.Watch]: 0,
    [ProductType.Special]: 0,
    [ProductType.Weather]: 0,
  };
  let obsLists = 0;
  let obsFragments = 0;
  let obs = 0;
  let nwacObsLists = 0;
  let nwacObsFragments = 0;
  let nwacObs = 0;

  const exitHandler = () => {
    console.log(`parsed ${String(metadata)} center metadata files`);
    console.log(`parsed ${String(mapLayer)} center map layers`);
    console.log(`parsed ${String(fragments)} center product fragments`);
    for (const [key, value] of Object.entries(products)) {
      console.log(`parsed ${value} ${key} products`);
    }

    console.log(`parsed ${String(obsLists)} observation lists`);
    console.log(`parsed ${String(obsFragments)} observation fragments`);
    console.log(`parsed ${String(obs)} observations`);

    console.log(`parsed ${String(nwacObsLists)} NWAC observation lists`);
    console.log(`parsed ${String(nwacObsFragments)} NWAC observation fragments`);
    console.log(`parsed ${String(nwacObs)} NWAC observations`);
  };

  process.on('exit', exitHandler.bind(null));

  // TODO: use Chris' new capabilities API when it's ready to find the centers which support the map, forecasts & warnings
  const centers = ['BAC', 'BTAC', 'CBAC', 'COAA', 'ESAC', 'FAC', 'IPAC', 'KPAC', 'MSAC', 'MWAC', 'NWAC', 'PAC', 'SAC', 'SNFAC', 'TAC', 'WAC', 'WCMAC'];
  for (const center of centers) {
    fs.readFile(`${dir}/${center}/metadata.json`, (err, data) => {
      if (err) {
        throw err;
      }
      const rawData: unknown = JSON.parse(data.toString());
      const parseResult = avalancheCenterSchema.safeParse(rawData);
      if (!parseResult.success) {
        console.error(`failed to parse center metadata for ${center}: ${JSON.stringify(parseResult.error, null, 2)}`);
      }
      metadata++;
    });
    fs.readFile(`${dir}/${center}/map-layer.json`, (err, data) => {
      if (err) {
        throw err;
      }
      const rawData: unknown = JSON.parse(data.toString());
      const parseResult = mapLayerSchema.safeParse(rawData);
      if (!parseResult.success) {
        console.error(`failed to parse map layer for ${center}: ${JSON.stringify(parseResult.error, null, 2)}`);
      }
      mapLayer++;
    });
    fs.readFile(`${dir}/${center}/products.json`, (err, data) => {
      if (err) {
        throw err;
      }
      const rawData: unknown = JSON.parse(data.toString());
      const parseResult = productFragmentArraySchema.safeParse(rawData);
      if (!parseResult.success) {
        console.error(`failed to parse product fragments for ${center}: ${JSON.stringify(parseResult.error, null, 2)}`);
      } else {
        fragments += parseResult.data.length;
      }
    });
    for await (const p of walk(`${dir}/${center}/products`)) {
      fs.readFile(p, (err, data) => {
        if (err) {
          throw err;
        }
        const rawData: unknown = JSON.parse(data.toString());
        const parseResult = productSchema.safeParse(rawData);
        if (!parseResult.success) {
          console.error(`failed to parse product ${p} for ${center}: ${JSON.stringify(parseResult.error, null, 2)}`);
        } else {
          products[parseResult.data.product_type]++;
        }
      });
    }
  }

  const centersWithObs = ['BAC', 'BTAC', 'FAC', 'IPAC', 'KPAC', 'MWAC', 'NWAC', 'PAC', 'WAC', 'WCMAC']; // TODO: AAIC ...
  for (const center of centersWithObs) {
    fs.readFile(`${dir}/${center}/observations.json`, (err, data) => {
      if (err) {
        throw err;
      }
      const rawData: unknown = JSON.parse(data.toString());
      const parseResult = observationListResultSchema.safeParse(rawData);
      if (!parseResult.success) {
        console.error(`failed to parse list of observations ${dir}/${center}/observations.json for ${center}: ${JSON.stringify(parseResult.error, null, 2)}`);
      } else {
        if (parseResult.data.data) {
          obsFragments += parseResult.data.data.getObservationList.length;
        }
      }
      obsLists++;
    });
    fs.readFile(`${dir}/${center}/observations-error.json`, (err, data) => {
      if (err) {
        throw err;
      }
      const rawData: unknown = JSON.parse(data.toString());
      const parseResult = observationListResultSchema.safeParse(rawData);
      if (!parseResult.success) {
        console.error(`failed to parse list of observations with errors ${dir}/${center}/observations-error.json for ${center}: ${JSON.stringify(parseResult.error, null, 2)}`);
      }
      obsLists++;
    });
    for await (const p of walk(`${dir}/${center}/observations`)) {
      fs.readFile(p, (err, data) => {
        if (err) {
          throw err;
        }
        const rawData: unknown = JSON.parse(data.toString());
        const parseResult = observationSchema.safeParse(rawData);
        if (!parseResult.success) {
          console.error(`failed to parse observation ${p} for ${center}: ${JSON.stringify(parseResult.error, null, 2)}`);
        } else {
          obs++;
        }
      });
    }
  }

  // TODO: use Chris' new capabilities API when it's ready to find the centers which support the stations
  // const centers = ['BTAC', 'CBAC', 'COAA', 'ESAC', 'FAC', 'IPAC', 'MSAC', 'MWAC', 'NWAC', 'PAC', 'SAC', 'SNFAC', 'WAC', 'WCMAC'];

  fs.readFile(`${dir}/NWAC/nwac-observations.json`, (err, data) => {
    if (err) {
      throw err;
    }
    const rawData: unknown = JSON.parse(data.toString());
    const parseResult = nwacObservationsListSchema.safeParse(rawData);
    if (!parseResult.success) {
      console.error(`failed to parse list of observations ${dir}/NWAC/nwac-observations.json for NWAC: ${JSON.stringify(parseResult.error, null, 2)}`);
    } else {
      nwacObsFragments += parseResult.data.objects.length;
    }
    nwacObsLists++;
  });

  for await (const p of walk(`${dir}/NWAC/nwac-observations`)) {
    fs.readFile(p, (err, data) => {
      if (err) {
        throw err;
      }
      const rawData: unknown = JSON.parse(data.toString());
      const parseResult = nwacObservationSchema.safeParse(rawData);
      if (!parseResult.success) {
        console.error(`failed to parse NWAC observation ${p} for NWAC: ${JSON.stringify(parseResult.error, null, 2)}`);
      } else {
        nwacObs++;
      }
    });
  }
}

void main();