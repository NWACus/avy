import {BottomTabNavigationProp} from '@react-navigation/bottom-tabs';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {AvalancheCenterID} from './types/nationalAvalancheCenter';

export type TabNavigatorParamList = {
  Home: {center_id: AvalancheCenterID; dateString: string};
  'Weather Data': {center_id: AvalancheCenterID; dateString: string};
  Observations: {center_id: AvalancheCenterID; dateString: string};
  Menu: {center_id: AvalancheCenterID};
};
export type TabNavigationProps = BottomTabNavigationProp<TabNavigatorParamList>;

export type HomeStackParamList = {
  avalancheCenter: {
    center_id: AvalancheCenterID;
    dateString: string;
  };
  forecast: {
    zoneName: string;
    center_id: AvalancheCenterID;
    forecast_zone_id: number;
    dateString: string;
  };
};
export type HomeStackNavigationProps = NativeStackNavigationProp<HomeStackParamList>;

export type TelemetryStackParamList = {
  telemetryStations: {
    center_id: AvalancheCenterID;
    dateString: string;
  };
  telemetryStation: {
    center_id: AvalancheCenterID;
    source: string;
    station_id: number;
    name: string;
    dateString: string;
  };
};
export type TelemetryStackNavigationProps = NativeStackNavigationProp<TelemetryStackParamList>;

export type ObservationsStackParamList = {
  observations: {
    center_id: AvalancheCenterID;
    dateString: string;
  };
  observation: {
    id: string;
  };
};
export type ObservationsStackNavigationProps = NativeStackNavigationProp<ObservationsStackParamList>;

export type MenuStackParamList = {
  menu: undefined;
  avalancheCenterSelector: undefined;
  textStylePreview: undefined;
};
export type MenuStackNavigationProps = NativeStackNavigationProp<MenuStackParamList>;
