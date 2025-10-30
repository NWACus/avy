import * as Updates from 'expo-updates';
import {AllAvalancheCenterCapabilities, AvalancheCenter, AvalancheCenterID, avalancheCenterIDSchema, userFacingCenterId} from 'types/nationalAvalancheCenter';

export interface AvalancheCenterListData {
  center: AvalancheCenter;
  description?: string;
  display_id: string;
}

const supportedAvalancheCenters = (): {center: AvalancheCenterID; description: string}[] => {
  const centers: {center: AvalancheCenterID; description: string}[] = [
    {center: 'BTAC', description: 'Avalanche forecasts for Western Wyoming and Eastern Idaho.'},
    {center: 'BAC', description: 'Avalanche forecasts for the Bridgeport region in California.'},
    {center: 'CBAC', description: 'Avalanche forecasts for Southwestern Colorado.'},
    {center: 'COAA', description: 'Avalanche forecasts for central Oregon.'},
    {center: 'FAC', description: 'Avalanche forecasts for Northwestern Montana.'},
    {center: 'MSAC', description: 'Avalanche forecasts for the Mount Shasta region in California.'},
    {center: 'MWAC', description: 'Avalanche forecasts for Mount Washington.'},
    {center: 'NWAC', description: 'Avalanche forecasts for Washington and Northern Oregon.'},
    {center: 'PAC', description: 'Avalanche forecasts for the Payette region in Idaho.'},
    {center: 'SNFAC', description: 'Avalanche forecasts for South Central Idaho.'},
    {center: 'SAC', description: 'Avalanche forecasts for the Lake Tahoe region in California.'},
  ];

  if (Updates.channel !== 'release') {
    centers.push(
      // {center: 'AAIC', description: 'Avalanche forecasts for Alaska.'}, // failed to parse
      {center: 'CNFAIC', description: 'Avalanche forecasts for the Chugach National Forest.'},
      {center: 'ESAC', description: 'Avalanche forecasts for the Eastern Sierra region in California.'},
      // {center: 'HAC', description: 'Avalanche forecasts for the Haines region in Alaska.'}, // failed to parse
      {center: 'HPAC', description: 'Avalanche forecasts for the Hatcher Pass region in Alaska.'},
      {center: 'IPAC', description: 'Avalanche forecasts for the Idaho panhandle.'},
      {center: 'KPAC', description: 'Avalanche forecasts for the Kachina region in Arizona.'},
      {center: 'TAC', description: 'Avalanche forecasts for the Taos Valley in New Mexico.'},
      // {center: 'VAC', description: 'Avalanche forecasts for the Valdez region of Alaska.'}, // failed to parse
      {center: 'WAC', description: 'Avalanche forecasts for the Wallowa Range in Oregon.'},
      {center: 'WCMAC', description: 'Avalanche forecasts for West Central Montana.'},
    );
  }

  return centers;
};

export enum AvalancheCenters {
  SupportedCenters,
  AllCenters,
}

// In order to display data for the center, we need to know about it so that we have a logo, etc.
export const filterToKnownCenters = (ids: string[]): AvalancheCenterID[] => {
  const knownCenters: AvalancheCenterID[] = [];
  for (const center of ids) {
    const idResult = avalancheCenterIDSchema.safeParse(center);
    if (idResult.success) {
      knownCenters.push(idResult.data);
    }
  }
  return knownCenters;
};

export const filterToSupportedCenters = (ids: AvalancheCenterID[]): AvalancheCenterID[] => {
  const supportedCenters: AvalancheCenterID[] = supportedAvalancheCenters().map(c => c.center);
  return ids.filter(id => supportedCenters.includes(id));
};

export const avalancheCenterList = (metadata: AvalancheCenter[], capabilities: AllAvalancheCenterCapabilities): AvalancheCenterListData[] => {
  const centers = supportedAvalancheCenters();
  return metadata
    .map(center => ({
      center: center,
      description: centers.find(supported => supported.center === center.id)?.description,
      display_id: userFacingCenterId(center.id as AvalancheCenterID, capabilities),
    }))
    .sort((a, b) => {
      // Centers with descriptions are "blessed" and should sort above the rest
      if (a.description && !b.description) {
        return -1;
      } else if (!a.description && b.description) {
        return 1;
      } else if (!a.description && !b.description) {
        // Unsupported centers are sorted alphabetically
        return a.center.name.localeCompare(b.center.name);
      } else {
        // Supported centers are sorted according to their order in supportedAvalancheCenters
        return centers.findIndex(supported => supported.center === a.center.id) - centers.findIndex(supported => supported.center === b.center.id);
      }
    });
};
