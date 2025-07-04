import { Logger } from 'browser-bunyan';
import { getCoordinateString, parseCoordinates, parseKmlData, transformKmlFeaturesToObservationZones } from 'hooks/useAlternateObservationZones';
import { logger } from 'logger';
import { KMLFeatureCollection } from 'types/nationalAvalancheCenter';
const testUrl = 'http://NWAC_Rules.com/test.kml';
describe('getCoordinateString', () => {
  it('should extract coordinates from a KML Placemark object', () => {
    const placemark = {
      name: { _text: 'Test Placemark' },
      Polygon: {
        outerBoundaryIs: {
          LinearRing: {
            coordinates: { _text: '-121.7,47.5,0 -121.68,47.5,0' },
          },
        },
      },
    };
    const result = getCoordinateString(placemark);
    expect(result).toBe('-121.7,47.5,0 -121.68,47.5,0');
  });
  it('should extract coordinates from a KML Placemark object with MultiGeometry', () => {
    const placemark = {
      name: { _text: 'Test Placemark MultiGeometry' },
      MultiGeometry: {
        Polygon: {
          outerBoundaryIs: {
            LinearRing: {
              coordinates: {
                _text: '-121.7,47.5,0 -121.68,47.5,0',
              },
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

describe('parseKmlData', () => {
  it('should, testUrl); parse KML data with polygon features and return a FeatureCollection', () => {
    const kmlResponse = `
      <kml xmlns="http://www.opengis.net/kml/2.2">
        <Document>
          <name>NWAC_AlternateZones</name>
          <Folder>
            <Placemark>
              <name>Test Placemark</name>
              <Polygon>
                <outerBoundaryIs>
                  <LinearRing>
                    <coordinates>-121.7,47.5,0 -121.68,47.5,0</coordinates>
                  </LinearRing>
                </outerBoundaryIs>
              </Polygon>
            </Placemark>
            <Placemark>
              <name>Test Placemark 2</name>
              <Polygon>
                <outerBoundaryIs>
                  <LinearRing>
                    <coordinates>-110.7350524,43.53733288700005,0 -110.664888751,43.63112891800006,0 -110.641204569,43.86025138800005,0 -110.633213497,43.93672369700005,0</coordinates>
                  </LinearRing>
                </outerBoundaryIs>
              </Polygon>
            </Placemark>
          </Folder>
        </Document>
      </kml>`;
    const logger = {
      error: jest.fn(),
    };
    const result = parseKmlData(kmlResponse, logger as unknown as Logger, testUrl);
    expect(result).toEqual({
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [-121.7, 47.5],
                [-121.68, 47.5],
              ],
            ],
          },
          id: expect.any(Number) as unknown as number,
          properties: {
            name: 'Test Placemark',
          },
        },
        {
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [-110.7350524, 43.53733288700005],
                [-110.664888751, 43.63112891800006],
                [-110.641204569, 43.86025138800005],
                [-110.633213497, 43.93672369700005],
              ],
            ],
          },
          id: expect.any(Number) as unknown as number,
          properties: {
            name: 'Test Placemark 2',
          },
        },
      ],
    });
  });
  it('should return an empty FeatureCollection for invalid KML data', () => {
    const kmlResponse = '<kml></kml>';
    const logger = {
      error: jest.fn(),
    };
    const result = parseKmlData(kmlResponse, logger as unknown as Logger, testUrl);
    expect(result).toEqual({
      type: 'FeatureCollection',
      features: [],
    });
    expect(logger.error).toHaveBeenCalledWith('Invalid KML file: {"_errors":[],"kml":{"_errors":[],"Document":{"_errors":["Required"]}}}');
  });
  it('should return an empty FeatureCollection for invalid KML data with no features', () => {
    const kmlResponse = `
      <kml xmlns="http://www.opengis.net/kml/2.2">
        <Document>
          <name>NWAC_AlternateZones</name>
          <Folder>
          </Folder>
        </Document>
      </kml>`;
    const logger = {
      error: jest.fn(),
    };
    const result = parseKmlData(kmlResponse, logger as unknown as Logger, testUrl);
    expect(result).toEqual({
      type: 'FeatureCollection',
      features: [],
    });
    expect(logger.error).toHaveBeenCalledWith(
      'Invalid KML file: {"_errors":[],"kml":{"_errors":[],"Document":{"_errors":[],"Folder":{"_errors":[],"Placemark":{"_errors":["Required"]}}}}}',
    );
  });
  it('should return an empty FeatureCollection for invalid KML data with no coordinates', () => {
    const kmlResponse = `
      <kml xmlns="http://www.opengis.net/kml/2.2">
        <Document>
          <name>NWAC_AlternateZones</name>
          <Folder>
            <Placemark>
              <name>Test Placemark</name>
              <Polygon>
                <outerBoundaryIs>
                  <LinearRing>
                    <coordinates></coordinates>
                  </LinearRing>
                </outerBoundaryIs>
              </Polygon>
            </Placemark>
          </Folder>
        </Document>
      </kml>`;
    const logger = {
      error: jest.fn(),
    };
    const result = parseKmlData(kmlResponse, logger as unknown as Logger, testUrl);
    expect(result).toEqual({
      type: 'FeatureCollection',
      features: [],
    });
  });
  it('should return an empty FeatureCollection for invalid KML data no feature name', () => {
    const kmlResponse = `
      <kml xmlns="http://www.opengis.net/kml/2.2">
        <Document>
          <name>NWAC_AlternateZones</name>
          <Folder>
            <Placemark>
              <Polygon>
                <outerBoundaryIs>
                  <LinearRing>
                    <coordinates>-121.7,47.5,0 -121.68,47.5,0</coordinates>
                  </LinearRing>
                </outerBoundaryIs>
              </Polygon>
            </Placemark>
          </Folder>
        </Document>
      </kml>`;
    const logger = {
      error: jest.fn(),
    };
    const result = parseKmlData(kmlResponse, logger as unknown as Logger, testUrl);
    expect(result).toEqual({
      type: 'FeatureCollection',
      features: [],
    });
  });
});
describe('transform KML Features to Observation Zones', () => {
  it('should transform KML features to Observation Zones', () => {
    const kmlFeatures: KMLFeatureCollection = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [-121.7, 47.5],
                [-121.68, 47.5],
              ],
            ],
          },
          id: 1234567,
          properties: {
            name: 'Test Placemark',
          },
        },
      ],
    };
    const result = transformKmlFeaturesToObservationZones(kmlFeatures, 'NWAC', logger as unknown as Logger);
    expect(result).toEqual({
      features: [
        {
          geometry: {
            coordinates: [
              [
                [-121.7, 47.5],
                [-121.68, 47.5],
              ],
            ],
            type: 'Polygon',
          },
          id: -100000,
          properties: { center_id: 'NWAC', name: 'Test Placemark' },
          type: 'Feature',
        },
      ],
      type: 'FeatureCollection',
    });
  });

  it('should return an empty feature collection for empty KML features', () => {
    const kmlFeatures: KMLFeatureCollection = {
      type: 'FeatureCollection',
      features: [],
    };
    const result = transformKmlFeaturesToObservationZones(kmlFeatures, 'NWAC', logger as unknown as Logger);
    expect(result).toEqual({ features: [], type: 'FeatureCollection' });
  });
});
