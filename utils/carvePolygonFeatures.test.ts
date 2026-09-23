import * as Sentry from '@sentry/react-native';
import difference from '@turf/difference';
import union from '@turf/union';
import {logger} from 'logger';
import {MapLayerFeature} from 'types/nationalAvalancheCenter';
import {carvePolygonFeatures} from 'utils/carvePolygonFeatures';

jest.mock('@turf/union', () => {
  const actual = jest.requireActual<{default: typeof import('@turf/union').default}>('@turf/union');
  return {__esModule: true, default: jest.fn(actual.default)};
});

jest.mock('@turf/difference', () => {
  const actual = jest.requireActual<{default: typeof import('@turf/difference').default}>('@turf/difference');
  return {__esModule: true, default: jest.fn(actual.default)};
});

const mockedUnion = union as jest.MockedFunction<typeof union>;
const mockedDifference = difference as jest.MockedFunction<typeof difference>;

beforeEach(() => {
  mockedUnion.mockClear();
  mockedDifference.mockClear();
  (Sentry.captureException as jest.Mock).mockClear();
});

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

const point = (id: number, center: Center, [x, y]: [number, number]): MapLayerFeature =>
  ({
    type: 'Feature',
    id,
    geometry: {type: 'Point', coordinates: [x, y]},
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

  it('returns an empty array when featuresToCarve is empty', () => {
    const mask = square(1, 'CBAC', [0, 0], [10, 10]);
    expect(carvePolygonFeatures([], [mask], logger)).toEqual([]);
  });

  it('returns input unchanged when mask contains only non-polygon features', () => {
    const feature = square(1, 'CAIC', [0, 0], [10, 10]);
    const nonPolygonMask = point(2, 'CBAC', [5, 5]);
    const result = carvePolygonFeatures([feature], [nonPolygonMask], logger);
    expect(result).toEqual([feature]);
    expect(mockedUnion).not.toHaveBeenCalled();
    expect(mockedDifference).not.toHaveBeenCalled();
  });

  it('passes non-polygon input features through unchanged while carving polygons', () => {
    const polygonFeature = square(1, 'CAIC', [0, 0], [10, 10]);
    const pointFeature = point(2, 'CAIC', [5, 5]);
    const mask = square(3, 'CBAC', [5, 0], [15, 10]);
    const result = carvePolygonFeatures([polygonFeature, pointFeature], [mask], logger);
    expect(result).toHaveLength(2);
    expect(result.find(f => f.id === 2)).toEqual(pointFeature);
    const carved = result.find(f => f.id === 1);
    expect(carved?.geometry.type).toBe('Polygon');
  });

  it('ignores non-polygon mask features when polygon masks are also present', () => {
    const feature = square(1, 'CAIC', [0, 0], [10, 10]);
    const polygonMask = square(2, 'CBAC', [5, 0], [15, 10]);
    const pointMask = point(3, 'CBAC', [50, 50]);
    const result = carvePolygonFeatures([feature], [pointMask, polygonMask], logger);
    expect(result).toHaveLength(1);
    if (result[0].geometry.type === 'Polygon') {
      const xs = result[0].geometry.coordinates[0].map(([x]) => x);
      expect(Math.max(...xs)).toBeCloseTo(5);
    }
  });

  it('carves a MultiPolygon input feature', () => {
    const feature = multiSquare(1, 'CAIC', [
      [
        [0, 0],
        [10, 10],
      ],
      [
        [20, 0],
        [30, 10],
      ],
    ]);
    const mask = square(2, 'CBAC', [0, 0], [10, 10]);
    const result = carvePolygonFeatures([feature], [mask], logger);
    expect(result).toHaveLength(1);
    const carved = result[0];
    expect(carved.id).toBe(1);
    if (carved.geometry.type === 'Polygon') {
      const xs = carved.geometry.coordinates[0].map(([x]) => x);
      expect(Math.min(...xs)).toBeCloseTo(20);
      expect(Math.max(...xs)).toBeCloseTo(30);
    } else if (carved.geometry.type === 'MultiPolygon') {
      const xs = carved.geometry.coordinates.flat(2).map(([x]) => x);
      expect(Math.min(...xs)).toBeCloseTo(20);
      expect(Math.max(...xs)).toBeCloseTo(30);
    }
  });

  it('returns input unchanged and reports to Sentry when union throws', () => {
    const feature = square(1, 'CAIC', [0, 0], [10, 10]);
    const maskA = square(2, 'CBAC', [0, 0], [5, 10]);
    const maskB = square(3, 'CBAC', [5, 0], [10, 10]);
    mockedUnion.mockImplementationOnce(() => {
      throw new Error('boom');
    });
    const result = carvePolygonFeatures([feature], [maskA, maskB], logger);
    expect(result).toEqual([feature]);
    expect(Sentry.captureException).toHaveBeenCalledWith(expect.any(Error), {tags: {turf_union: true}});
    expect(mockedDifference).not.toHaveBeenCalled();
  });

  it('returns input unchanged when union returns null', () => {
    const feature = square(1, 'CAIC', [0, 0], [10, 10]);
    const maskA = square(2, 'CBAC', [0, 0], [5, 10]);
    const maskB = square(3, 'CBAC', [5, 0], [10, 10]);
    mockedUnion.mockReturnValueOnce(null);
    const result = carvePolygonFeatures([feature], [maskA, maskB], logger);
    expect(result).toEqual([feature]);
    expect(mockedDifference).not.toHaveBeenCalled();
  });

  it('returns the original feature and reports to Sentry when difference throws', () => {
    const feature = square(1, 'CAIC', [0, 0], [10, 10]);
    const mask = square(2, 'CBAC', [5, 0], [15, 10]);
    mockedDifference.mockImplementationOnce(() => {
      throw new Error('boom');
    });
    const result = carvePolygonFeatures([feature], [mask], logger);
    expect(result).toEqual([feature]);
    expect(Sentry.captureException).toHaveBeenCalledWith(expect.any(Error), {tags: {turf_difference: true}});
  });

  it('continues carving remaining features when difference throws for one of them', () => {
    const a = square(1, 'CAIC', [0, 0], [10, 10]);
    const b = square(2, 'CAIC', [20, 0], [30, 10]);
    const mask = square(3, 'CBAC', [5, 0], [25, 10]);
    mockedDifference.mockImplementationOnce(() => {
      throw new Error('boom');
    });
    const result = carvePolygonFeatures([a, b], [mask], logger);
    expect(result).toHaveLength(2);
    expect(result.find(f => f.id === 1)).toEqual(a);
    const carvedB = result.find(f => f.id === 2);
    expect(carvedB).toBeDefined();
    if (carvedB && carvedB.geometry.type === 'Polygon') {
      const xs = carvedB.geometry.coordinates[0].map(([x]) => x);
      expect(Math.min(...xs)).toBeCloseTo(25);
      expect(Math.max(...xs)).toBeCloseTo(30);
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
