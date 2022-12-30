import {BottomTabNavigationProp} from '@react-navigation/bottom-tabs';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';

export type TabNavigatorParamList = {
  Home: {center_id: string; date: string};
  'Weather Data': {center_id: string; date: string};
  Observations: {center_id: string; date: string};
  Menu: {center_id: string};
};
export type TabNavigationProps = BottomTabNavigationProp<TabNavigatorParamList>;

export type HomeStackParamList = {
  avalancheCenter: {
    center_id: string;
    date: string;
  };
  forecast: {
    zoneName: string;
    center_id: string;
    forecast_zone_id: number;
    date: string;
  };
};
export type HomeStackNavigationProps = NativeStackNavigationProp<HomeStackParamList>;

export type TelemetryStackParamList = {
  telemetryStations: {
    center_id: string;
    date: string;
  };
  telemetryStation: {
    center_id: string;
    source: string;
    station_id: number;
    name: string;
    date: string;
  };
};
export type TelemetryStackNavigationProps = NativeStackNavigationProp<TelemetryStackParamList>;

export type ObservationsStackParamList = {
  observations: {
    center_id: string;
    date: string;
  };
  observation: {
    id: string;
  };
};
export type ObservationsStackNavigationProps = NativeStackNavigationProp<ObservationsStackParamList>;

export type MenuStackParamList = {
  menu: undefined;
  avalancheCenterSelector: undefined;
};
export type MenuStackNavigationProps = NativeStackNavigationProp<MenuStackParamList>;
