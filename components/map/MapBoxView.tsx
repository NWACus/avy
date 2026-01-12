import Mapbox, {Camera, FillLayer, LineLayer, MapView, ShapeSource} from '@rnmapbox/maps';
import {colorFor} from 'components/AvalancheDangerTriangle';
import {View} from 'components/core';
import {useAllMapLayers} from 'hooks/useAllMapLayers';
import React from 'react';
import {AvalancheCenterID} from 'types/nationalAvalancheCenter';

Mapbox.setAccessToken(process.env.MAPBOX_API_KEY as string);

export const MapBoxView: React.FunctionComponent<{center: AvalancheCenterID}> = ({center}) => {
  const mapLayerResult = useAllMapLayers(center);
  const mapLayer = mapLayerResult.data;
  // const forecastResults = useMapLayerAvalancheForecasts(center, requestedTime, mapLayer, metadata);
  // const warningResults = useMapLayerAvalancheWarnings(center, requestedTime, mapLayer);

  return (
    <View flex={1}>
      <MapView style={{flex: 1}} styleURL={Mapbox.StyleURL.Outdoors}>
        <Camera centerCoordinate={[-116.948817, 41.22954]} zoomLevel={4} />
        {mapLayer &&
          mapLayer.features.map(feature => (
            <ShapeSource key={`${feature.properties.name}+${feature.id}`} id={`${feature.id}`} shape={feature.geometry}>
              <LineLayer id={`${feature.properties.name}+${feature.id}-lineLayer`} style={{lineColor: 'black', lineWidth: 2}} />
              <FillLayer
                id={`${feature.properties.name}+${feature.id}-fillLayer`}
                style={{fillColor: colorFor(feature.properties.danger_level).alpha(feature.properties.fillOpacity).string(), fillOutlineColor: 'black'}}
              />
            </ShapeSource>
          ))}
      </MapView>
    </View>
  );
};
