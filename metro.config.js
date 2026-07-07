const {getSentryExpoConfig} = require('@sentry/react-native/metro');
const path = require('path');

module.exports = (() => {
  const config = getSentryExpoConfig(__dirname);

  const {transformer, resolver} = config;

  config.transformer = {
    ...transformer,
    babelTransformerPath: require.resolve('react-native-svg-transformer'),
  };
  config.resolver = {
    ...resolver,
    assetExts: resolver.assetExts.filter(ext => ext !== 'svg'),
    sourceExts: [...resolver.sourceExts, 'svg'],
  };

  // Web preview (Alloy) only. This is a mobile-first project built around the
  // native @rnmapbox/maps SDK, whose web implementation both pulls in the
  // native 'mapbox-gl' package (and its CSS) and exposes several components
  // that resolve to `undefined` on web. Rendering those undefined components
  // crashes the whole React tree, so for the web preview we:
  //   1. redirect 'mapbox-gl' to an empty stub, and
  //   2. redirect '@rnmapbox/maps' to a no-op stub that renders empty map
  //      containers.
  // Maps show as empty containers on web; the rest of the app renders normally.
  // Native builds are unaffected because these overrides are gated on
  // `platform === 'web'`.
  const mapboxGlStub = path.resolve(__dirname, '.alloy/web-stub.js');
  const rnmapboxStub = path.resolve(__dirname, '.alloy/rnmapbox-web-stub.js');
  const originalResolveRequest = config.resolver.resolveRequest;
  config.resolver.resolveRequest = (context, moduleName, platform) => {
    if (platform === 'web') {
      if (/^mapbox-gl(\/|$)/.test(moduleName)) {
        return {type: 'sourceFile', filePath: mapboxGlStub};
      }
      if (/^@rnmapbox\/maps(\/|$)/.test(moduleName)) {
        return {type: 'sourceFile', filePath: rnmapboxStub};
      }
    }
    if (originalResolveRequest) {
      return originalResolveRequest(context, moduleName, platform);
    }
    return context.resolveRequest(context, moduleName, platform);
  };

  return config;
})();
