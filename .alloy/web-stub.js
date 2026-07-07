// Stub used by the Alloy web preview.
//
// @rnmapbox/maps' web entry imports 'mapbox-gl' and its CSS, which are native
// map dependencies that are not part of this (mobile-first) project. For the
// web preview we resolve those imports to this harmless stub so the Metro web
// bundle can build.
//
// @rnmapbox/maps' web MapView does `new mapboxgl.Map(...)` on mount, so an
// empty object would throw "mapboxgl.Map is not a constructor" and crash the
// whole React tree. We therefore provide no-op constructors/helpers with the
// small surface the library touches. Maps simply render as empty containers on
// web; the rest of the app (forecasts, observations, weather, tabs) renders
// normally.

class NoopEmitter {
  on() {
    return this;
  }
  off() {
    return this;
  }
  once() {
    return this;
  }
  fire() {
    return this;
  }
}

class Map extends NoopEmitter {
  constructor() {
    super();
    this._container = null;
  }
  addControl() {
    return this;
  }
  removeControl() {
    return this;
  }
  addSource() {
    return this;
  }
  removeSource() {
    return this;
  }
  addLayer() {
    return this;
  }
  removeLayer() {
    return this;
  }
  getLayer() {
    return undefined;
  }
  getSource() {
    return undefined;
  }
  setStyle() {
    return this;
  }
  resize() {
    return this;
  }
  remove() {
    return this;
  }
  flyTo() {
    return this;
  }
  jumpTo() {
    return this;
  }
  easeTo() {
    return this;
  }
  fitBounds() {
    return this;
  }
  setCenter() {
    return this;
  }
  getCenter() {
    return {lng: 0, lat: 0};
  }
  setZoom() {
    return this;
  }
  getZoom() {
    return 0;
  }
  getCanvas() {
    return {style: {}};
  }
  getContainer() {
    return this._container;
  }
  project() {
    return {x: 0, y: 0};
  }
  unproject() {
    return {lng: 0, lat: 0};
  }
  queryRenderedFeatures() {
    return [];
  }
  loaded() {
    return true;
  }
  isStyleLoaded() {
    return true;
  }
}

class NoopClass extends NoopEmitter {
  addTo() {
    return this;
  }
  remove() {
    return this;
  }
  setLngLat() {
    return this;
  }
  setPopup() {
    return this;
  }
  setHTML() {
    return this;
  }
  setDOMContent() {
    return this;
  }
}

const mapboxgl = {
  Map,
  Marker: NoopClass,
  Popup: NoopClass,
  LngLat: class LngLat {},
  LngLatBounds: class LngLatBounds {},
  NavigationControl: NoopClass,
  GeolocateControl: NoopClass,
  AttributionControl: NoopClass,
  ScaleControl: NoopClass,
  supported: () => false,
  accessToken: '',
  version: '0.0.0-alloy-stub',
};

module.exports = mapboxgl;
module.exports.default = mapboxgl;
