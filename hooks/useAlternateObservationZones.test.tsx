import {getCoordinateString, parseCoordinates} from 'hooks/useAlternateObservationZones';
describe('getCoordinateString', () => {
  it('should extract coordinates from a KML Placemark object', () => {
    const placemark = {
      Polygon: {
        outerBoundaryIs: {
          LinearRing: {
            coordinates: '-121.7,47.5,0 -121.68,47.5,0',
          },
        },
      },
    };
    const result = getCoordinateString(placemark);
    expect(result).toBe('-121.7,47.5,0 -121.68,47.5,0');
  });
  it('should extract coordinates from a KML Placemark object with MultiGeometry', () => {
    const placemark = {
      MultiGeometry: {
        Polygon: {
          outerBoundaryIs: {
            LinearRing: {
              coordinates: '-121.7,47.5,0 -121.68,47.5,0',
            },
          },
        },
      },
    };
    const result = getCoordinateString(placemark);
    expect(result).toBe('-121.7,47.5,0 -121.68,47.5,0');
  });
});
describe('parseCoordinates', () => {
  it('should parse a valid coordinates string into an array of coordinate pairs', () => {
    const coordinatesString = `
      -121.70,47.50,0
      -121.69,47.51,0
      -121.68,47.50,0
      -121.69,47.49,0
      -121.70,47.50,0
    `;
    const result = parseCoordinates(coordinatesString);
    expect(result).toEqual([
      [-121.7, 47.5],
      [-121.69, 47.51],
      [-121.68, 47.5],
      [-121.69, 47.49],
      [-121.7, 47.5],
    ]);
  });

  it('should return an empty array for an empty coordinates string', () => {
    const coordinatesString = '';
    const result = parseCoordinates(coordinatesString);
    expect(result).toEqual([]);
  });
});
