// Web-only stub for '@rnmapbox/maps' used by the Alloy web preview.
//
// This mobile-first project relies on the native @rnmapbox/maps SDK. Its web
// implementation pulls in the native 'mapbox-gl' package (also stubbed for the
// preview) and, more importantly, several of its React components resolve to
// `undefined` in this environment. Rendering `undefined` (e.g. via
// `MBAnimated.FillLayer`) crashes the whole React tree, which is why the Map
// tab is the default landing route.
//
// For the web preview we redirect '@rnmapbox/maps' to this module so every
// component the app touches is a harmless no-op that renders nothing. Maps show
// as empty containers on web; the rest of the app (forecasts, observations,
// weather, navigation) renders normally. Native builds are unaffected.

const React = require('react');

// A component that renders its children (if any) inside a plain View-like
// container but otherwise does nothing. Using a function component keeps it
// valid anywhere a rnmapbox component is used, including as a JSX element.
function makeNoopComponent(displayName, imperativeHandle) {
  const Comp = React.forwardRef(function NoopMapComponent(props, ref) {
    React.useImperativeHandle(ref, () => (imperativeHandle ? imperativeHandle() : {}), []);
    // Render children so overlays/markers passed as children still mount, but
    // we don't attach any real map behavior.
    return props && props.children ? React.createElement(React.Fragment, null, props.children) : null;
  });
  Comp.displayName = displayName;
  return Comp;
}

// Imperative methods the app calls on map/camera refs (e.g. camera.setCamera,
// map.getCenter). They must exist as callable no-ops so ref-based calls don't
// throw and crash the tree.
const cameraHandle = () => ({
  setCamera: () => {},
  fitBounds: () => {},
  flyTo: () => {},
  moveTo: () => {},
  zoomTo: () => {},
});

const mapViewHandle = () => ({
  getCenter: () => Promise.resolve([0, 0]),
  getZoom: () => Promise.resolve(0),
  getVisibleBounds: () =>
    Promise.resolve([
      [0, 0],
      [0, 0],
    ]),
  getPointInView: () => Promise.resolve([0, 0]),
  getCoordinateFromView: () => Promise.resolve([0, 0]),
  setCamera: () => {},
  queryRenderedFeaturesAtPoint: () => Promise.resolve({features: []}),
  queryRenderedFeaturesInRect: () => Promise.resolve({features: []}),
});

const MapView = makeNoopComponent('MapView', mapViewHandle);
const Camera = makeNoopComponent('Camera', cameraHandle);
const ShapeSource = makeNoopComponent('ShapeSource');
const LineLayer = makeNoopComponent('LineLayer');
const FillLayer = makeNoopComponent('FillLayer');
const CircleLayer = makeNoopComponent('CircleLayer');
const SymbolLayer = makeNoopComponent('SymbolLayer');
const RasterLayer = makeNoopComponent('RasterLayer');
const BackgroundLayer = makeNoopComponent('BackgroundLayer');
const FillExtrusionLayer = makeNoopComponent('FillExtrusionLayer');
const HeatmapLayer = makeNoopComponent('HeatmapLayer');
const MarkerView = makeNoopComponent('MarkerView');
const PointAnnotation = makeNoopComponent('PointAnnotation');
const Callout = makeNoopComponent('Callout');
const UserLocation = makeNoopComponent('UserLocation');
const Images = makeNoopComponent('Images');
const Image = makeNoopComponent('Image');
const RasterSource = makeNoopComponent('RasterSource');
const VectorSource = makeNoopComponent('VectorSource');
const ImageSource = makeNoopComponent('ImageSource');
const Light = makeNoopComponent('Light');
const Atmosphere = makeNoopComponent('Atmosphere');
const Terrain = makeNoopComponent('Terrain');
const Sky = makeNoopComponent('Sky');

// `Animated` mirrors the animated versions of the layer components.
const Animated = {
  FillLayer: makeNoopComponent('Animated.FillLayer'),
  LineLayer: makeNoopComponent('Animated.LineLayer'),
  CircleLayer: makeNoopComponent('Animated.CircleLayer'),
  SymbolLayer: makeNoopComponent('Animated.SymbolLayer'),
  BackgroundLayer: makeNoopComponent('Animated.BackgroundLayer'),
  RasterLayer: makeNoopComponent('Animated.RasterLayer'),
  FillExtrusionLayer: makeNoopComponent('Animated.FillExtrusionLayer'),
  ShapeSource: makeNoopComponent('Animated.ShapeSource'),
  ImageSource: makeNoopComponent('Animated.ImageSource'),
};

const StyleURL = {
  Street: 'mapbox://styles/mapbox/streets-v11',
  Dark: 'mapbox://styles/mapbox/dark-v10',
  Light: 'mapbox://styles/mapbox/light-v10',
  Outdoors: 'mapbox://styles/mapbox/outdoors-v11',
  Satellite: 'mapbox://styles/mapbox/satellite-v9',
  SatelliteStreet: 'mapbox://styles/mapbox/satellite-streets-v11',
  TrafficDay: 'mapbox://styles/mapbox/traffic-day-v2',
  TrafficNight: 'mapbox://styles/mapbox/traffic-night-v2',
};

// The default export ("Mapbox") plus its static helpers/enums used by the app.
const Mapbox = {
  MapView,
  Camera,
  ShapeSource,
  LineLayer,
  FillLayer,
  CircleLayer,
  SymbolLayer,
  RasterLayer,
  MarkerView,
  PointAnnotation,
  UserLocation,
  Images,
  Animated,
  StyleURL,
  // No-op setup helpers. Return resolved promises where the SDK would.
  setAccessToken: () => Promise.resolve(),
  setTelemetryEnabled: () => Promise.resolve(),
  setWellKnownTileServer: () => Promise.resolve(),
  setConnected: () => Promise.resolve(),
  requestAndroidLocationPermissions: () => Promise.resolve(true),
  clearData: () => Promise.resolve(),
};

module.exports = Mapbox;
module.exports.default = Mapbox;

// Named exports mirror @rnmapbox/maps' public API surface.
module.exports.MapView = MapView;
module.exports.Camera = Camera;
module.exports.ShapeSource = ShapeSource;
module.exports.LineLayer = LineLayer;
module.exports.FillLayer = FillLayer;
module.exports.CircleLayer = CircleLayer;
module.exports.SymbolLayer = SymbolLayer;
module.exports.RasterLayer = RasterLayer;
module.exports.BackgroundLayer = BackgroundLayer;
module.exports.FillExtrusionLayer = FillExtrusionLayer;
module.exports.HeatmapLayer = HeatmapLayer;
module.exports.MarkerView = MarkerView;
module.exports.PointAnnotation = PointAnnotation;
module.exports.Callout = Callout;
module.exports.UserLocation = UserLocation;
module.exports.Images = Images;
module.exports.Image = Image;
module.exports.RasterSource = RasterSource;
module.exports.VectorSource = VectorSource;
module.exports.ImageSource = ImageSource;
module.exports.Light = Light;
module.exports.Atmosphere = Atmosphere;
module.exports.Terrain = Terrain;
module.exports.Sky = Sky;
module.exports.Animated = Animated;
module.exports.StyleURL = StyleURL;
