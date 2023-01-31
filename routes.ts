import {BottomTabNavigationProp} from '@react-navigation/bottom-tabs';
import {NavigatorScreenParams} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {AvalancheCenterID} from './types/nationalAvalancheCenter';

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

export type WeatherStackParamList = {
  stationList: {
    center_id: AvalancheCenterID;
    dateString: string;
  };
  stationDetail: {
    center_id: AvalancheCenterID;
    station_ids: string[];
    name: string;
    dateString: string;
  };
};
export type WeatherStackNavigationProps = NativeStackNavigationProp<WeatherStackParamList>;

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

export type TabNavigatorParamList = {
  Home: NavigatorScreenParams<HomeStackParamList>;
  'Weather Data': NavigatorScreenParams<WeatherStackParamList>;
  Observations: NavigatorScreenParams<ObservationsStackParamList>;
  Menu: NavigatorScreenParams<MenuStackParamList>;
};
export type TabNavigationProps = BottomTabNavigationProp<TabNavigatorParamList>;
