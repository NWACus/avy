import {AvalancheCenterRegion, avalancheCenterRegionFromRegionBounds, boundsForRegions, RegionBounds, updateBoundsToContain} from 'components/helpers/geographicCoordinates';
import {Position} from 'types/nationalAvalancheCenter';

describe('AvalancheForecastZonePolygon', () => {
  describe('updateRegionToContain', () => {
    it('returns the region bounds unchanged when no coordinates are provided', () => {
      const bounds: RegionBounds = {
        topRight: {longitude: 1, latitude: 1},
        bottomLeft: {longitude: 2, latitude: 2},
      };
      const coordinates: Position[] = [];
      expect(updateBoundsToContain(bounds, coordinates)).toStrictEqual({
        topRight: {longitude: 1, latitude: 1},
        bottomLeft: {longitude: 2, latitude: 2},
      });
    });

    it('initializes an empty region bound', () => {
      const bounds: RegionBounds = {
        topRight: {longitude: 0, latitude: 0},
        bottomLeft: {longitude: 0, latitude: 0},
      };
      const coordinates: Position[] = [[1, 1]];

      const updated: RegionBounds = updateBoundsToContain(bounds, coordinates);
      expect(updated).toStrictEqual({
        topRight: {longitude: 1, latitude: 1},
        bottomLeft: {longitude: 1, latitude: 1},
      });

      expect(bounds).not.toStrictEqual(updated); // should not mutate input
    });

    const coordinates: Position[] = [
      [-121.9298, 45.2792],
      [-121.952, 45.326],
      [-121.9315, 45.3659],
      [-121.8805, 45.4445],
      [-121.8473, 45.4646],
      [-121.8032, 45.4794],
      [-121.7216, 45.4921],
      [-121.6435, 45.4839],
      [-121.5219, 45.4578],
      [-121.431, 45.3475],
      [-121.477, 45.2279],
      [-121.5565, 45.2055],
      [-121.623, 45.1939],
      [-121.7036, 45.1916],
      [-121.8579, 45.2292],
      [-121.92, 45.2646],
      [-121.9298, 45.2792],
    ];

    // for the US, the "top right" corner of a map will have the largest latitude and largest longitude
    // similarly, the "bottom left" will have the smallest latitude and smallest longitude
    const regionBounds: RegionBounds = {
      topRight: {longitude: -121.431, latitude: 45.4921},
      bottomLeft: {longitude: -121.952, latitude: 45.1916},
    };

    it('minimally bounds all coordinates with the region', () => {
      const bounds: RegionBounds = {
        topRight: {longitude: 0, latitude: 0},
        bottomLeft: {longitude: 0, latitude: 0},
      };
      expect(updateBoundsToContain(bounds, coordinates)).toStrictEqual(regionBounds);
    });

    it('arrives at the same result regardless of how many iterations it takes to apply all coordinates', () => {
      const bounds: RegionBounds = {
        topRight: {longitude: 0, latitude: 0},
        bottomLeft: {longitude: 0, latitude: 0},
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
        topRight: {longitude: 0, latitude: 0},
        bottomLeft: {longitude: 2, latitude: 2},
      };
      const expectedAvalancheCenterRegion: AvalancheCenterRegion = {
        centerCoordinate: {
          latitude: 1,
          longitude: 1,
        },
        latitudeDelta: 2,
        longitudeDelta: 2,
        cameraBounds: {
          ne: [2, 2],
          sw: [0, 0],
        },
      };
      expect(avalancheCenterRegionFromRegionBounds(bounds)).toStrictEqual(expectedAvalancheCenterRegion);
    });
  });

  describe('boundsForRegions', () => {
    it('calculates the total bounding box for multiple regions', () => {
      const regions = [
        {
          topRight: {longitude: -50, latitude: 20},
          bottomLeft: {longitude: -100, latitude: 10},
        },
        {
          topRight: {longitude: -75, latitude: 40},
          bottomLeft: {longitude: -110, latitude: 15},
        },
      ];
      expect(boundsForRegions(regions)).toStrictEqual({
        topRight: {longitude: -50, latitude: 40},
        bottomLeft: {longitude: -110, latitude: 10},
      });
    });
  });
});
