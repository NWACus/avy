import {
  AvalancheCenterRegion,
  avalancheCenterRegionFromRegionBounds,
  boundsForRegions,
  insetViewportBounds,
  RegionBounds,
  regionBoundsVisible,
  updateBoundsToContain,
} from 'components/helpers/geographicCoordinates';
import {Position} from 'types/nationalAvalancheCenter';

import {CameraBounds} from '@rnmapbox/maps';

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

  describe('regionBoundsVisible', () => {
    // center box: lng -110..-100, lat 40..50
    const centerBounds: CameraBounds = {ne: [-100, 50], sw: [-110, 40]};

    it('is visible when the viewport fully contains the center', () => {
      expect(regionBoundsVisible(centerBounds, {ne: [-95, 55], sw: [-115, 35]})).toBe(true);
    });

    it('is visible when the viewport is entirely inside the center', () => {
      expect(regionBoundsVisible(centerBounds, {ne: [-105, 45], sw: [-108, 42]})).toBe(true);
    });

    it('is visible when only a sliver of the center overlaps the viewport', () => {
      // viewport lng -101..-99 overlaps the center's eastern edge at -100..-101
      expect(regionBoundsVisible(centerBounds, {ne: [-99, 45], sw: [-101, 42]})).toBe(true);
    });

    it('is not visible when the viewport is entirely east of the center', () => {
      expect(regionBoundsVisible(centerBounds, {ne: [-90, 45], sw: [-95, 42]})).toBe(false);
    });

    it('is not visible when the viewport is entirely west of the center', () => {
      expect(regionBoundsVisible(centerBounds, {ne: [-115, 45], sw: [-120, 42]})).toBe(false);
    });

    it('is not visible when the viewport is entirely north of the center', () => {
      expect(regionBoundsVisible(centerBounds, {ne: [-105, 60], sw: [-108, 55]})).toBe(false);
    });

    it('is not visible when the viewport is entirely south of the center', () => {
      expect(regionBoundsVisible(centerBounds, {ne: [-105, 35], sw: [-108, 30]})).toBe(false);
    });
  });

  describe('insetViewportBounds', () => {
    // viewport lat 40..50 (span 10) over a 1000px-tall map; longitude untouched.
    const viewport = {ne: [-100, 50] as Position, sw: [-110, 40] as Position};

    it('moves the north edge south by the header fraction and the south edge north by the tab bar fraction', () => {
      // 100px header of 1000px = 10% of the 10deg span = 1deg off the north edge; 200px tab bar = 2deg off the south edge.
      expect(insetViewportBounds(viewport, {topInset: 100, bottomInset: 200, mapHeight: 1000})).toStrictEqual({
        ne: [-100, 49],
        sw: [-110, 42],
      });
    });

    it('leaves longitude unchanged', () => {
      const result = insetViewportBounds(viewport, {topInset: 100, bottomInset: 200, mapHeight: 1000});
      expect(result.ne[0]).toBe(-100);
      expect(result.sw[0]).toBe(-110);
    });

    it('returns the viewport unchanged with zero insets', () => {
      expect(insetViewportBounds(viewport, {topInset: 0, bottomInset: 0, mapHeight: 1000})).toStrictEqual(viewport);
    });

    it('returns the viewport unchanged when the map height is non-positive', () => {
      expect(insetViewportBounds(viewport, {topInset: 100, bottomInset: 200, mapHeight: 0})).toStrictEqual(viewport);
    });

    it('shrinks the visible viewport enough to drop a center hidden behind the header', () => {
      // center sits in the top 1deg of the viewport (lat 49..50), which a 200px/1000px header (2deg) hides.
      const centerBounds: CameraBounds = {ne: [-104, 50], sw: [-106, 49]};
      const inset = insetViewportBounds(viewport, {topInset: 200, bottomInset: 0, mapHeight: 1000});
      expect(regionBoundsVisible(centerBounds, viewport)).toBe(true); // visible against the full (untrimmed) bounds
      expect(regionBoundsVisible(centerBounds, inset)).toBe(false); // hidden once the header inset is applied
    });
  });
});
