import {logger} from 'logger';
import {MapLayerFeature} from 'types/nationalAvalancheCenter';
import {carvePolygonFeatures} from 'utils/carvePolygonFeatures';

type Center = MapLayerFeature['properties']['center_id'];

const square = (id: number, center: Center, [minX, minY]: [number, number], [maxX, maxY]: [number, number]): MapLayerFeature =>
  ({
    type: 'Feature',
    id,
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [minX, minY],
          [maxX, minY],
          [maxX, maxY],
          [minX, maxY],
          [minX, minY],
        ],
      ],
    },
    properties: {center_id: center, name: `${center}-${id}`},
  } as unknown as MapLayerFeature);

const multiSquare = (id: number, center: Center, boxes: ReadonlyArray<[[number, number], [number, number]]>): MapLayerFeature =>
  ({
    type: 'Feature',
    id,
    geometry: {
      type: 'MultiPolygon',
      coordinates: boxes.map(([[minX, minY], [maxX, maxY]]) => [
        [
          [minX, minY],
          [maxX, minY],
          [maxX, maxY],
          [minX, maxY],
          [minX, minY],
        ],
      ]),
    },
    properties: {center_id: center, name: `${center}-${id}`},
  } as unknown as MapLayerFeature);

describe('carvePolygonFeatures', () => {
  it('returns input unchanged when there are no mask features', () => {
    const feature = square(1, 'CAIC', [0, 0], [10, 10]);
    const result = carvePolygonFeatures([feature], [], logger);
    expect(result).toEqual([feature]);
  });

  it('leaves a feature untouched when it does not overlap the mask', () => {
    const feature = square(1, 'CAIC', [0, 0], [10, 10]);
    const mask = square(2, 'CBAC', [20, 20], [30, 30]);
    const result = carvePolygonFeatures([feature], [mask], logger);
    expect(result).toEqual([feature]);
  });

  it('drops a feature fully covered by the mask', () => {
    const feature = square(1, 'CAIC', [2, 2], [8, 8]);
    const mask = square(2, 'CBAC', [0, 0], [10, 10]);
    const result = carvePolygonFeatures([feature], [mask], logger);
    expect(result).toEqual([]);
  });

  it('carves a feature partially covered by the mask', () => {
    const feature = square(1, 'CAIC', [0, 0], [10, 10]);
    const mask = square(2, 'CBAC', [5, 0], [15, 10]);
    const result = carvePolygonFeatures([feature], [mask], logger);
    expect(result).toHaveLength(1);
    const carved = result[0];
    expect(carved.id).toBe(1);
    expect(carved.properties.center_id).toBe('CAIC');
    expect(carved.geometry.type).toBe('Polygon');
    if (carved.geometry.type === 'Polygon') {
      const xs = carved.geometry.coordinates[0].map(([x]) => x);
      expect(Math.min(...xs)).toBeCloseTo(0);
      expect(Math.max(...xs)).toBeCloseTo(5);
    }
  });

  it('unions multiple mask polygons before carving', () => {
    const feature = square(1, 'CAIC', [0, 0], [10, 10]);
    const maskLeft = square(2, 'CBAC', [0, 0], [3, 10]);
    const maskRight = square(3, 'CBAC', [7, 0], [10, 10]);
    const result = carvePolygonFeatures([feature], [maskLeft, maskRight], logger);
    expect(result).toHaveLength(1);
    const carved = result[0];
    expect(carved.geometry.type).toBe('Polygon');
    if (carved.geometry.type === 'Polygon') {
      const xs = carved.geometry.coordinates[0].map(([x]) => x);
      expect(Math.min(...xs)).toBeCloseTo(3);
      expect(Math.max(...xs)).toBeCloseTo(7);
    }
  });

  it('handles a MultiPolygon mask feature', () => {
    const feature = square(1, 'CAIC', [0, 0], [10, 10]);
    const mask = multiSquare(2, 'CBAC', [
      [
        [0, 0],
        [3, 10],
      ],
      [
        [7, 0],
        [10, 10],
      ],
    ]);
    const result = carvePolygonFeatures([feature], [mask], logger);
    expect(result).toHaveLength(1);
    const carved = result[0];
    expect(carved.geometry.type).toBe('Polygon');
    if (carved.geometry.type === 'Polygon') {
      const xs = carved.geometry.coordinates[0].map(([x]) => x);
      expect(Math.min(...xs)).toBeCloseTo(3);
      expect(Math.max(...xs)).toBeCloseTo(7);
    }
  });

  it('carves every feature in the input set', () => {
    const a = square(1, 'CAIC', [0, 0], [10, 10]);
    const b = square(2, 'NWAC', [100, 100], [110, 110]);
    const mask = square(3, 'CBAC', [5, 0], [15, 10]);
    const result = carvePolygonFeatures([a, b], [mask], logger);
    expect(result).toHaveLength(2);
    expect(result.find(f => f.id === 2)).toEqual(b);
    const carved = result.find(f => f.id === 1);
    expect(carved).toBeDefined();
    expect(carved?.properties.center_id).toBe('CAIC');
    if (carved && carved.geometry.type === 'Polygon') {
      const xs = carved.geometry.coordinates[0].map(([x]) => x);
      expect(Math.min(...xs)).toBeCloseTo(0);
      expect(Math.max(...xs)).toBeCloseTo(5);
    }
  });
});
