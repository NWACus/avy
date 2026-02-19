import {BottomTabNavigationProp} from '@react-navigation/bottom-tabs';
import {MaterialTopTabNavigationProp} from '@react-navigation/material-top-tabs';
import {NavigatorScreenParams} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {AvalancheCenterID, WeatherStationSource} from 'types/nationalAvalancheCenter';
import {RequestedTimeString} from 'utils/date';

export type TabNavigatorParamList = {
  Home: NavigatorScreenParams<HomeStackParamList> & {requestedTime: RequestedTimeString};
  'Weather Data': NavigatorScreenParams<WeatherStackParamList> & {requestedTime: RequestedTimeString};
  Observations: NavigatorScreenParams<ObservationsStackParamList> & {requestedTime: RequestedTimeString};
  Menu: NavigatorScreenParams<MenuStackParamList> & {requestedTime: RequestedTimeString};
};
export type TabNavigationProps = BottomTabNavigationProp<TabNavigatorParamList>;

type WeatherStationsDetailPageProps = {
  center_id: AvalancheCenterID;
  zoneName: string;
  name: string;
  stations: Record<string, WeatherStationSource>;
  requestedTime: RequestedTimeString;
};

type WeatherStationDetailPageProps = {
  center_id: AvalancheCenterID;
  stationId: string;
  source: WeatherStationSource;
  requestedTime: RequestedTimeString;
};

export type HomeStackParamList = {
  avalancheCenter: {
    center_id: AvalancheCenterID;
    requestedTime: RequestedTimeString;
  };
  forecast: {
    center_id: AvalancheCenterID;
    forecast_zone_id: number;
    requestedTime: RequestedTimeString;
  };
  // While in the home stack, we can display these pages:
  // - weather station detail
  // - observation detail (nwac & nac)
  stationsDetail: WeatherStationsDetailPageProps;
  stationDetail: WeatherStationDetailPageProps;
  observation: {
    id: string;
  };
  nwacObservation: {
    id: string;
  };
  observationSubmit: {
    center_id: AvalancheCenterID;
  };
};
export type HomeStackNavigationProps = NativeStackNavigationProp<HomeStackParamList>;

type ForecastPageProps = {
  center_id: AvalancheCenterID;
  requestedTime: RequestedTimeString;
  forecast_zone_id: number;
};

export type ForecastTabNavigatorParamList = {
  avalanche: ForecastPageProps;
  weather: ForecastPageProps;
  observations: ForecastPageProps;
  blog: ForecastPageProps;
};
export type ForecastTabNavigatorProps = MaterialTopTabNavigationProp<ForecastTabNavigatorParamList>;

export type WeatherStackParamList = {
  stationList: {
    center_id: AvalancheCenterID;
    requestedTime: RequestedTimeString;
  };
  stationsDetail: WeatherStationsDetailPageProps;
  stationDetail: WeatherStationDetailPageProps;
};
export type WeatherStackNavigationProps = NativeStackNavigationProp<WeatherStackParamList>;

export type TelemetryStackParamList = {
  telemetryStations: {
    center_id: AvalancheCenterID;
    requestedTime: RequestedTimeString;
  };
  telemetryStation: {
    center_id: AvalancheCenterID;
    source: string;
    station_id: number;
    name: string;
    requestedTime: RequestedTimeString;
  };
};
export type TelemetryStackNavigationProps = NativeStackNavigationProp<TelemetryStackParamList>;

export type ObservationsStackParamList = {
  observationsPortal: {
    center_id: AvalancheCenterID;
    requestedTime: RequestedTimeString;
  };
  observationSubmit: undefined;
  observationsList: {
    center_id: AvalancheCenterID;
    requestedTime: RequestedTimeString;
  };
  observation: {
    id: string;
  };
  nwacObservation: {
    id: string;
  };
};
export type ObservationsStackNavigationProps = NativeStackNavigationProp<ObservationsStackParamList>;

export type MenuStackParamList = {
  menu: undefined;
  avalancheCenterSelector: {
    debugMode: boolean;
  };
  buttonStylePreview: undefined;
  textStylePreview: undefined;
  avalancheComponentPreview: undefined;
  toastPreview: undefined;
  timeMachine: undefined;
  avalancheCenter: {
    center_id: AvalancheCenterID;
    requestedTime: RequestedTimeString;
  };
  forecast: {
    center_id: AvalancheCenterID;
    forecast_zone_id: number;
    requestedTime: RequestedTimeString;
  };
  observation: {
    id: string;
  };
  nwacObservation: {
    id: string;
  };
  about: undefined;
  outcome: {
    which: string;
  };

  expoConfig: undefined;
  featureFlags: undefined;
};
export type MenuStackNavigationProps = NativeStackNavigationProp<MenuStackParamList>;
