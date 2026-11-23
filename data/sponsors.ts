import {BundledAssetSource, resolveAssetSource} from 'utils/resolveAssetSource';

export interface Sponsor {
  id: string;
  displayName: string;
  campaignUrl: string;
  logoOnLight: BundledAssetSource;
  logoOnDark: BundledAssetSource;
  aboutSponsor: string;
  whyWePartner: string;
  splashMessage: string;
  visitButtonTitle: string;
}

/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-require-imports */
export const TITLE_SPONSOR: Sponsor = {
  id: 'nokian-tyres',
  displayName: 'Nokian Tyres',
  campaignUrl: 'https://na.nokiantyres.com/?utm_medium=referral&utm_source=3rd%20Party&utm_campaign=Nokian_Tyres_Avy',
  logoOnLight: resolveAssetSource(require('assets/logos/Nokian_Tyres_Logo.png')),
  logoOnDark: resolveAssetSource(require('assets/logos/Nokian_Tyres_Snow.png')),
  aboutSponsor: 'Nokian Tyres invented the winter tire in 1934 and has spent ninety years helping people travel safely through snow and ice.',
  whyWePartner: 'Their support keeps the AvyApp free for every backcountry traveler: no banner ads, no paywall, easy access to the forecasts you rely on.',
  splashMessage: 'IN PARTNERSHIP WITH',
  visitButtonTitle: 'Visit nokiantyres.com',
};
/* eslint-enable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-require-imports */

export const sponsorLogoSize = (logo: BundledAssetSource, width: number): {width: number; height: number} => ({
  width,
  height: (width * logo.height) / logo.width,
});
