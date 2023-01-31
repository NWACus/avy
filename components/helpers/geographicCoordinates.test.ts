// useAvalancheForecastFragments pulls in Sentry, which makes Jest blow up
jest.mock('@sentry/react-native', () => ({init: () => jest.fn()}));

import {updateBoundsToContain, RegionBounds, regionFromBounds, boundsForRegions} from 'components/helpers/geographicCoordinates';
import {LatLng} from 'react-native-maps';

describe('AvalancheForecastZonePolygon', () => {
  describe('updateRegionToContain', () => {
    it('returns the region bounds unchanged when no coordinates are provided', () => {
      const bounds: RegionBounds = {
        topLeft: {latitude: 1, longitude: 1},
        bottomRight: {latitude: 2, longitude: 2},
      };
      const coordinates: LatLng[] = null;
      expect(updateBoundsToContain(bounds, coordinates)).toStrictEqual({
        topLeft: {latitude: 1, longitude: 1},
        bottomRight: {latitude: 2, longitude: 2},
      });
    });

    it('initializes an empty region bound', () => {
      const bounds: RegionBounds = {
        topLeft: {latitude: 0, longitude: 0},
        bottomRight: {latitude: 0, longitude: 0},
      };
      const coordinates: LatLng[] = [{latitude: 1, longitude: 1}];

      const updated: RegionBounds = updateBoundsToContain(bounds, coordinates);
      expect(updated).toStrictEqual({
        topLeft: {latitude: 1, longitude: 1},
        bottomRight: {latitude: 1, longitude: 1},
      });

      expect(bounds).not.toStrictEqual(updated); // should not mutate input
    });

    const coordinates: LatLng[] = [
      {longitude: -121.9298, latitude: 45.2792},
      {longitude: -121.952, latitude: 45.326},
      {longitude: -121.9315, latitude: 45.3659},
      {longitude: -121.8805, latitude: 45.4445},
      {longitude: -121.8473, latitude: 45.4646},
      {longitude: -121.8032, latitude: 45.4794},
      {longitude: -121.7216, latitude: 45.4921},
      {longitude: -121.6435, latitude: 45.4839},
      {longitude: -121.5219, latitude: 45.4578},
      {longitude: -121.431, latitude: 45.3475},
      {longitude: -121.477, latitude: 45.2279},
      {longitude: -121.5565, latitude: 45.2055},
      {longitude: -121.623, latitude: 45.1939},
      {longitude: -121.7036, latitude: 45.1916},
      {longitude: -121.8579, latitude: 45.2292},
      {longitude: -121.92, latitude: 45.2646},
      {longitude: -121.9298, latitude: 45.2792},
    ];

    // for the US, the "top left" corner of a map will have the largest latitude and smallest longitude
    // similarly, the "bottom right" will have the smallest latitude and largest longitude
    const regionBounds: RegionBounds = {
      topLeft: {latitude: 45.4921, longitude: -121.952},
      bottomRight: {latitude: 45.1916, longitude: -121.431},
    };

    it('minimally bounds all coordinates with the region', () => {
      const bounds: RegionBounds = {
        topLeft: {latitude: 0, longitude: 0},
        bottomRight: {latitude: 0, longitude: 0},
      };
      expect(updateBoundsToContain(bounds, coordinates)).toStrictEqual(regionBounds);
    });

    it('arrives at the same result regardless of how many iterations it takes to apply all coordinates', () => {
      const bounds: RegionBounds = {
        topLeft: {latitude: 0, longitude: 0},
        bottomRight: {latitude: 0, longitude: 0},
      };

      const firstPass = updateBoundsToContain(bounds, coordinates.slice(0, 5));
      const secondPass = updateBoundsToContain(firstPass, coordinates.slice(5, 10));
      const thirdPass = updateBoundsToContain(secondPass, coordinates.slice(10, coordinates.length));
      expect(thirdPass).toStrictEqual(regionBounds);
    });
  });

  describe('regionFromBounds', () => {
    it('returns the region from bounds', () => {
      const bounds: RegionBounds = {
        topLeft: {latitude: 0, longitude: 0},
        bottomRight: {latitude: 2, longitude: 2},
      };
      expect(regionFromBounds(bounds)).toStrictEqual({
        latitude: 1,
        longitude: 1,
        latitudeDelta: 2,
        longitudeDelta: 2,
      });
    });
  });

  describe('boundsForRegions', () => {
    it('calculates the total bounding box for multiple regions', () => {
      const regions = [
        {
          topLeft: {latitude: 20, longitude: -100},
          bottomRight: {latitude: 10, longitude: -50},
        },
        {
          topLeft: {latitude: 40, longitude: -110},
          bottomRight: {latitude: 15, longitude: -75},
        },
      ];
      expect(boundsForRegions(regions)).toStrictEqual({
        topLeft: {latitude: 40, longitude: -110},
        bottomRight: {latitude: 10, longitude: -50},
      });
    });
  });
});
