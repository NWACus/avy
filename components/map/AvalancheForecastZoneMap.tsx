import React, {useCallback, useEffect, useMemo, useState} from 'react';

import {useFocusEffect} from '@react-navigation/native';
import {incompleteQueryState, QueryState} from 'components/content/QueryState';
import {Center, VStack} from 'components/core';
import {MapViewZone, mapViewZoneFor} from 'components/map/ZoneMap';
import {AvalancheCenterSelectionModal} from 'components/modals/AvalancheCenterSelectionModal';
import {isAfter} from 'date-fns';
import {toDate} from 'date-fns-tz';
import {useAvalancheCenterMetadata} from 'hooks/useAvalancheCenterMetadata';
import {useMapLayerAvalancheForecasts} from 'hooks/useMapLayerAvalancheForecasts';
import {useMapLayerAvalancheWarnings} from 'hooks/useMapLayerAvalancheWarnings';
import {usePostHog} from 'posthog-react-native';
import {usePreferences} from 'Preferences';
import {AvalancheCenterID, DangerLevel, ForecastPeriod, MapLayerFeature, ProductType} from 'types/nationalAvalancheCenter';
import {RequestedTime, requestedTimeToUTCDate} from 'utils/date';

import {ForecastNavigationHeader} from 'components/content/navigation/ForecastMapNavigationHeader';
import {DangerScale} from 'components/DangerScale';
import {AvalancheForecastMapView} from 'components/map/AvalancheForecastMapView';
import * as Location from 'expo-location';
import {Position} from 'geojson';
import {useAllMapLayers} from 'hooks/useAllMapLayers';
import {logger} from 'logger';
import {Alert, Linking, View} from 'react-native';

export interface MapProps {
  center_id: AvalancheCenterID;
  requestedTime: RequestedTime;
  tabBarHeight?: number;
}

export type TopElementMeasurments = {
  yPos: number;
  height: number;
};

export const AvalancheForecastZoneMap: React.FunctionComponent<MapProps> = ({center_id, requestedTime, tabBarHeight = 0}: MapProps) => {
  const {preferences, setPreferences} = usePreferences();
  const {isInNoCenterExperience, lastMapCamera} = preferences;

  // Fetches all the map layers in call. Unfortunately, CBAC isn't included in that call so it needs to be fetched separately
  const allMapLayersResult = useAllMapLayers();
  const allMapLayers = allMapLayersResult.data;

  const metadataResult = useAvalancheCenterMetadata(center_id);
  const metadata = metadataResult.data;
  const forecastResults = useMapLayerAvalancheForecasts(center_id, requestedTime, allMapLayers, metadata);
  const warningResults = useMapLayerAvalancheWarnings(center_id, requestedTime, allMapLayers);

  const topElements = React.useRef<View>(null);

  const [userLocation, setUserLocation] = useState<Position | undefined>(undefined);
  const [topElementMeasurements, setTopElementMeasurements] = useState<TopElementMeasurments>({yPos: 0, height: 0});

  const postHog = usePostHog();
  const recordAnalytics = useCallback(() => {
    if (postHog && center_id) {
      postHog.screen('avalancheForecastMap', {
        center: center_id,
      });
    }
  }, [postHog, center_id]);
  useFocusEffect(recordAnalytics);

  // Default to the values in the map layer, but update it with the forecasts and warnings we've fetched
  // This is done all at once so that zonesById is recalculated when forecastResults or warningResults changes while
  // avoiding the recalculation on every re-render
  const zonesById = useMemo(() => {
    const zones = allMapLayers?.features.reduce((accum: Record<string, MapViewZone>, feature: MapLayerFeature) => {
      accum[feature.id] = mapViewZoneFor(feature);
      return accum;
    }, {});

    if (!zones) return zones;

    // Apply forecast changes — objects in base are freshly created above, so mutation here is safe
    forecastResults
      .map(result => result.data) // get data from the results
      .filter(data => data) // only operate on results that have succeeded
      .forEach(forecast => {
        if (forecast && forecast.forecast_zone) {
          forecast.forecast_zone.forEach(({id}) => {
            if (zones[id]) {
              // If the zone is marked as off-season in the map layer, we want the danger level to be None so that the color is grey
              // regarless of what the forecast says
              if (zones[id].feature.properties.off_season) {
                zones[id].danger_level = DangerLevel.None;
              } else {
                // the map layer will expose old forecasts with their danger level as appropriate, but the map expects to show a card
                // that doesn't divulge the old forecast's rating, travel advice or publication/expiry times, so we clear things out
                if (
                  !zones[id].end_date ||
                  (zones[id].end_date &&
                    isAfter(requestedTimeToUTCDate(requestedTime), toDate(new Date(zones[id].end_date || '2000-01-01'), {timeZone: 'UTC'}))) /* requesting after expiry */
                ) {
                  zones[id].danger_level = DangerLevel.GeneralInformation;
                  zones[id].end_date = null;
                  zones[id].start_date = null;
                }
                // product-specific queries can give us results that are expired or older than the map layer, in which case we don't
                // want to use them
                if (
                  (forecast.product_type === ProductType.Forecast || forecast.product_type === ProductType.Summary) &&
                  forecast.expires_time &&
                  (isAfter(toDate(new Date(forecast.expires_time), {timeZone: 'UTC'}), requestedTimeToUTCDate(requestedTime)) /* product is not expired */ ||
                    (zones[id].end_date &&
                      isAfter(
                        toDate(new Date(forecast.expires_time), {timeZone: 'UTC'}),
                        toDate(new Date(zones[id].end_date || '2000-01-01'), {timeZone: 'UTC'}),
                      ))) /* product newer than map layer */
                ) {
                  if (forecast.product_type === ProductType.Forecast) {
                    const currentDanger = forecast.danger.find(d => d.valid_day === ForecastPeriod.Current);
                    if (currentDanger) {
                      const maxCurrentDanger = Math.max(currentDanger.lower, currentDanger.middle, currentDanger.upper) as DangerLevel;
                      // If we're in season, use the forecast's danger level only if it's not None
                      if (maxCurrentDanger !== DangerLevel.None) {
                        zones[id].danger_level = maxCurrentDanger;
                      }
                    }
                  }

                  // Regardless if the product type is a summary or forecast, we want to use the forecast API timestamp as it has timezone information
                  zones[id].start_date = forecast.published_time;
                  zones[id].end_date = forecast.expires_time;
                }
              }
            }
          });
        }
      });

    // Apply warning changes
    warningResults
      .map(result => result.data) // get data from the results
      .forEach(warning => {
        if (!warning) return;
        // the warnings endpoint can return warnings, watches and special bulletins; we only want to make the map flash
        // when there's an active warning for the zone
        if (
          'product_type' in warning.data &&
          warning.data.product_type === ProductType.Warning &&
          'expires_time' in warning.data &&
          isAfter(toDate(new Date(warning.data.expires_time), {timeZone: 'UTC'}), requestedTimeToUTCDate(requestedTime))
        ) {
          const mapViewZoneData = zones[warning.zone_id];
          if (mapViewZoneData) {
            mapViewZoneData.hasWarning = true;
          }
        }
      });

    return zones;
  }, [allMapLayers, forecastResults, warningResults, requestedTime]);

  const onSelectCenter = useCallback(
    (center: AvalancheCenterID) => {
      setPreferences({center: center, hasSeenCenterPicker: true});
    },
    [setPreferences],
  );

  const onLayout = useCallback(() => {
    // onLayout returns position relative to parent - we need position relative to screen
    topElements.current?.measureInWindow((x, y, width, height) => {
      setTopElementMeasurements({yPos: y, height: height});
    });

    // we seem to see races between onLayout firing and the measureInWindow picking up the correct
    // SafeAreaView bounds, so let's queue up another render pass in the future to hopefully converge
    setTimeout(() => {
      if (topElements.current) {
        topElements.current.measureInWindow((x, y, width, height) => {
          setTopElementMeasurements({yPos: y, height: height});
        });
      }
    }, 50);
  }, [setTopElementMeasurements]);

  const onFetchLocation = useCallback(() => {
    async function getUserLocation() {
      const {status: existingStatus, canAskAgain} = await Location.getForegroundPermissionsAsync();

      if (existingStatus !== Location.PermissionStatus.GRANTED && canAskAgain) {
        // Request permissions if needed
        const {status: newStatus} = await Location.requestForegroundPermissionsAsync();
        if (newStatus !== Location.PermissionStatus.GRANTED) {
          Alert.alert('Location Permissions Denied', 'Please enable location permissions in settings in order to center the map', [
            {
              text: 'Cancel',
              style: 'cancel',
            },
            {
              text: 'Go to Settings',
              onPress: () => void Linking.openSettings(),
            },
          ]);
          return;
        }
      }

      // Get the last known location that's less than 12 hours old.
      // getCurrentPositionAsync can sometimes take 5+ seconds to resolve while getLastKnownPositionAsync will fire immediately if the location matches the criteria
      let location = await Location.getLastKnownPositionAsync({maxAge: 12 * 60 * 60 * 1000});
      if (!location) {
        try {
          location = await Location.getCurrentPositionAsync({accuracy: Location.LocationAccuracy.Low});
          setUserLocation([location.coords.longitude, location.coords.latitude]);
        } catch (error) {
          logger.debug({error}, "Failed to fetch the user's location");
        }
      }
    }

    void getUserLocation();
  }, [setUserLocation]);

  const zones = useMemo(() => (zonesById !== undefined ? Object.keys(zonesById).map(k => zonesById[k]) : []), [zonesById]);

  const [selectedZoneId, setSelectedZoneId] = useState<number | null>(null);

  // Reset selected zone when the user switches centers via the center picker (not via zone tap).
  // When a zone tap switches centers, selectedZoneId is set to the tapped zone which belongs to the
  // new center — so we only clear when the selected zone doesn't belong to the current center.
  useEffect(() => {
    if (selectedZoneId === null || zones.length === 0) return;
    const selectedZoneBelongsToCurrentCenter = zones.some(z => z.zone_id === selectedZoneId && z.center_id === center_id);
    if (!selectedZoneBelongsToCurrentCenter) {
      setSelectedZoneId(null);
    }
  }, [center_id, zones, selectedZoneId]);

  const showAvalancheCenterSelectionModal = useMemo(() => !preferences.hasSeenCenterPicker, [preferences.hasSeenCenterPicker]);

  const isQueryIncomplete = incompleteQueryState(allMapLayersResult, metadataResult, ...forecastResults, ...warningResults) || !allMapLayers || !metadata;

  return (
    <>
      {isQueryIncomplete ? (
        <Center width="100%" height="100%">
          <QueryState
            results={[allMapLayersResult, metadataResult, ...forecastResults, ...warningResults]}
            terminal
            customMessage={{
              notFound: () => ({
                headline: 'Missing forecast',
                body: 'There may not be a forecast available for today.',
              }),
            }}
          />
        </Center>
      ) : (
        <AvalancheForecastMapView
          preferredCenterId={center_id}
          zones={zones}
          requestedTime={requestedTime}
          topElementMeasurements={topElementMeasurements}
          userLocation={userLocation}
          isInNoCenterExperience={isInNoCenterExperience}
          lastMapCamera={lastMapCamera}
          selectedZoneId={selectedZoneId}
          tabBarHeight={tabBarHeight}
          setSelectedZoneId={setSelectedZoneId}
        />
      )}

      <VStack ref={topElements} width="100%" position="absolute" top={0} left={0} right={0} onLayout={onLayout}>
        <ForecastNavigationHeader centerId={center_id} isInNoCenterExperience={isInNoCenterExperience} onFetchUserLocation={onFetchLocation} />
        <VStack px={4} marginTop={8}>
          <DangerScale width="100%" />
        </VStack>
      </VStack>

      <AvalancheCenterSelectionModal visible={showAvalancheCenterSelectionModal} initialSelection={preferences.center} onClose={onSelectCenter} />
    </>
  );
};
