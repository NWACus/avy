import {useBottomTabBarHeight} from '@react-navigation/bottom-tabs';
import Mapbox, {Animated, Camera, FillLayer, LineLayer, MapView, ShapeSource} from '@rnmapbox/maps';
import {OnPressEvent} from '@rnmapbox/maps/lib/typescript/src/types/OnPressEvent';
import {colorFor} from 'components/AvalancheDangerTriangle';
import {AvalancheForecastZoneCards} from 'components/AvalancheForecastZoneMap';
import {QueryState, incompleteQueryState} from 'components/content/QueryState';
import {MapViewZone, defaultMapRegionForGeometries, mapViewZoneFor} from 'components/content/ZoneMap';
import {Center, View} from 'components/core';
import {AnimatedDrawerState, AnimatedMapWithDrawerController} from 'components/map/AnimatedCards';
import {isAfter} from 'date-fns';
import {toDate} from 'date-fns-tz';
import Constants from 'expo-constants';
import {useAllMapLayers} from 'hooks/useAllMapLayers';
import {useAvalancheCenterMetadata} from 'hooks/useAvalancheCenterMetadata';
import {useMapLayer} from 'hooks/useMapLayer';
import {useMapLayerAvalancheForecasts} from 'hooks/useMapLayerAvalancheForecasts';
import {useMapLayerAvalancheWarnings} from 'hooks/useMapLayerAvalancheWarnings';
import {LoggerContext, LoggerProps} from 'loggerContext';
import React, {useCallback, useEffect, useRef, useState} from 'react';
import {useWindowDimensions} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {colorLookup} from 'theme';
import {AvalancheCenterID, DangerLevel, ForecastPeriod, MapLayerFeature, ProductType} from 'types/nationalAvalancheCenter';
import {RequestedTime, requestedTimeToUTCDate} from 'utils/date';

Mapbox.setAccessToken(Constants.expoConfig?.extra?.mapBoxAPIKey as string);

export const ForecastMapViewV2: React.FunctionComponent<{requestedTime: RequestedTime}> = ({requestedTime}) => {
  const {logger} = React.useContext<LoggerProps>(LoggerContext);
  const [center, setCenter] = useState<AvalancheCenterID>('NWAC');
  const allMapLayerResult = useAllMapLayers(center);
  const mapLayerResult = useMapLayer(center);
  const centerMetadataResult = useAvalancheCenterMetadata(center);
  const [selectedZoneId, setSelectedZoneId] = useState<number | null>(null);
  const mapLayer = mapLayerResult.data;
  const allMapLayer = allMapLayerResult.data;
  const centerMetadata = centerMetadataResult.data;

  const forecastResults = useMapLayerAvalancheForecasts(center, requestedTime, mapLayer, centerMetadata);
  const warningResults = useMapLayerAvalancheWarnings(center, requestedTime, mapLayer);

  const cameraRef = useRef<Camera>(null);

  const initialRegion = defaultMapRegionForGeometries(mapLayer?.features.map(feature => feature.geometry));
  const neBound = [initialRegion.longitude + initialRegion.longitudeDelta / 2, initialRegion.latitude + initialRegion.latitudeDelta / 2];
  const swBound = [initialRegion.longitude - initialRegion.longitudeDelta / 2, initialRegion.latitude - initialRegion.latitudeDelta / 2];

  const controller = useRef<AnimatedMapWithDrawerController>(new AnimatedMapWithDrawerController(AnimatedDrawerState.Hidden, initialRegion, logger, undefined, cameraRef)).current;
  React.useEffect(() => {
    controller.animateUsingUpdatedAvalancheCenterMapRegion(initialRegion);
  }, [initialRegion, controller]);

  const {width: windowWidth, height: windowHeight} = useWindowDimensions();
  React.useEffect(() => {
    controller.animateUsingUpdatedWindowDimensions(windowWidth, windowHeight);
  }, [windowWidth, windowHeight, controller]);

  const tabBarHeight = useBottomTabBarHeight();
  React.useEffect(() => {
    controller.animateUsingUpdatedTabBarHeight(tabBarHeight);
  }, [tabBarHeight, controller]);

  useEffect(() => {
    if (allMapLayer) {
      const mapFeaturesForCenter = allMapLayer.features.filter(feature => center === (feature.properties['center_id'] as AvalancheCenterID));
      if (mapFeaturesForCenter) {
        const initialRegion = defaultMapRegionForGeometries(mapFeaturesForCenter.map(feature => feature.geometry));
        if (initialRegion.latitude != 0 && initialRegion.longitude != 0) {
          const neBound = [initialRegion.longitude + initialRegion.longitudeDelta / 2, initialRegion.latitude + initialRegion.latitudeDelta / 2];
          const swBound = [initialRegion.longitude - initialRegion.longitudeDelta / 2, initialRegion.latitude - initialRegion.latitudeDelta / 2];
          cameraRef.current?.setCamera({bounds: {ne: neBound, sw: swBound}, heading: 0});
        }
      }
    }
  }, [allMapLayer, cameraRef, center]);

  const onPress = useCallback(
    (event: OnPressEvent) => {
      const feature = event.features[0];
      const properties = feature.properties;
      if (properties) {
        const centerId = properties['center_id'] as AvalancheCenterID;
        if (center !== centerId) {
          setCenter(centerId);
        }
      }
      const id = Number(feature.id);
      if (selectedZoneId != id) {
        setSelectedZoneId(id);
      }
    },
    [setCenter, setSelectedZoneId, selectedZoneId, center],
  );

  if (incompleteQueryState(mapLayerResult, centerMetadataResult, ...forecastResults, ...warningResults) || !mapLayer || !centerMetadata) {
    return (
      <SafeAreaView edges={['top', 'left', 'right']}>
        <Center width="100%" height="100%">
          <QueryState
            results={[mapLayerResult, centerMetadataResult, ...forecastResults, ...warningResults]}
            terminal
            customMessage={{
              notFound: () => ({
                headline: 'Missing forecast',
                body: 'There may not be a forecast available for today.',
              }),
            }}
          />
        </Center>
      </SafeAreaView>
    );
  }

  const outline = colorLookup('gray.700');
  const highlight = colorLookup('blue.100');

  // default to the values in the map layer, but update it with the forecasts and warnings we've fetched
  const zonesById: Record<string, MapViewZone> = mapLayer.features.reduce((accum: Record<string, MapViewZone>, feature: MapLayerFeature) => {
    accum[feature.id] = mapViewZoneFor(center, feature);
    return accum;
  }, {});
  forecastResults
    .map(result => result.data) // get data from the results
    .filter(data => data) // only operate on results that have succeeded
    .forEach(forecast => {
      forecast &&
        forecast.forecast_zone?.forEach(({id}) => {
          if (zonesById[id]) {
            // the map layer will expose old forecasts with their danger level as appropriate, but the map expects to show a card
            // that doesn't divulge the old forecast's rating, travel advice or publication/expiry times, so we clear things out
            if (
              !zonesById[id].end_date ||
              (zonesById[id].end_date &&
                isAfter(requestedTimeToUTCDate(requestedTime), toDate(new Date(zonesById[id].end_date || '2000-01-01'), {timeZone: 'UTC'}))) /* requesting after expiry */
            ) {
              zonesById[id].danger_level = DangerLevel.None;
              zonesById[id].end_date = null;
              zonesById[id].start_date = null;
            }
            // product-specific queries can give us results that are expired or older than the map layer, in which case we don't
            // want to use them
            if (
              (forecast.product_type === ProductType.Forecast || forecast.product_type === ProductType.Summary) &&
              forecast.expires_time &&
              zonesById[id].end_date &&
              (isAfter(toDate(new Date(forecast.expires_time), {timeZone: 'UTC'}), requestedTimeToUTCDate(requestedTime)) /* product is not expired */ ||
                isAfter(
                  toDate(new Date(forecast.expires_time), {timeZone: 'UTC'}),
                  toDate(new Date(zonesById[id].end_date || '2000-01-01'), {timeZone: 'UTC'}),
                )) /* product newer than map layer */
            ) {
              if (forecast.product_type === ProductType.Forecast) {
                const currentDanger = forecast.danger.find(d => d.valid_day === ForecastPeriod.Current);
                if (currentDanger) {
                  zonesById[id].danger_level = Math.max(currentDanger.lower, currentDanger.middle, currentDanger.upper) as DangerLevel;
                }
              }

              // Regardless if the product type is a summary or forecast, we want to use the forecast API timestamp as it has timezone information
              zonesById[id].start_date = forecast.published_time;
              zonesById[id].end_date = forecast.expires_time;
            }
          }
        });
    });
  warningResults
    .map(result => result.data) // get data from the results
    .forEach(warning => {
      if (!warning) {
        return;
      }
      // the warnings endpoint can return warnings, watches and special bulletins; we only want to make the map flash
      // when there's an active warning for the zone
      if (
        'product_type' in warning.data &&
        warning.data.product_type === ProductType.Warning &&
        'expires_time' in warning.data &&
        isAfter(toDate(new Date(warning.data.expires_time), {timeZone: 'UTC'}), requestedTimeToUTCDate(requestedTime))
      ) {
        const mapViewZoneData = zonesById[warning.zone_id];
        if (mapViewZoneData) {
          mapViewZoneData.hasWarning = true;
        }
      }
    });
  const zones = Object.keys(zonesById).map(k => zonesById[k]);

  return (
    <View flex={1}>
      <MapView style={{flex: 1}} styleURL={Mapbox.StyleURL.Outdoors} scaleBarEnabled={false}>
        <Camera ref={cameraRef} defaultSettings={{bounds: {ne: neBound, sw: swBound}}} />
        {allMapLayer &&
          allMapLayer.features.map(feature => (
            <ShapeSource key={`${feature.id}`} id={`${feature.id}`} shape={feature} onPress={onPress} hitbox={{width: 0, height: 0}}>
              <FillLayer id={`${feature.id}-fillLayer`} style={{fillColor: colorFor(feature.properties.danger_level).alpha(feature.properties.fillOpacity).string()}} />
              <LineLayer id={`${feature.id}-lineLayer`} style={{lineColor: outline.toString(), lineWidth: 2}} />
            </ShapeSource>
          ))}

        {/* Set the whole feature as the selected state to not have to filter this */}
        {allMapLayer &&
          allMapLayer.features
            .filter(feature => feature.id === selectedZoneId)
            .map(feature => (
              <Animated.ShapeSource key={`${feature.id}+selected`} id={`${feature.id}+selected`} shape={feature} hitbox={{width: 0, height: 0}}>
                <LineLayer id={`${feature.id}-lineLayer-selected`} style={{lineColor: highlight.toString(), lineWidth: 4}} />
              </Animated.ShapeSource>
            ))}
      </MapView>

      <AvalancheForecastZoneCards
        key={center}
        center_id={center}
        date={requestedTime}
        zones={zones}
        selectedZoneId={selectedZoneId}
        setSelectedZoneId={setSelectedZoneId}
        controller={controller}
      />
    </View>
  );
};
