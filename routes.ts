import {BottomTabNavigationProp} from '@react-navigation/bottom-tabs';
import {NavigatorScreenParams} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {AvalancheCenterID, WeatherStationSource} from 'types/nationalAvalancheCenter';
import {RequestedTimeString} from 'utils/date';

export type TabNavigatorParamList = {
  Home: NavigatorScreenParams<HomeStackParamList> & {center_id: AvalancheCenterID; requestedTime: RequestedTimeString};
  'Weather Data': NavigatorScreenParams<WeatherStackParamList> & {center_id: AvalancheCenterID; requestedTime: RequestedTimeString};
  Observations: NavigatorScreenParams<ObservationsStackParamList> & {center_id: AvalancheCenterID; requestedTime: RequestedTimeString};
  Menu: NavigatorScreenParams<MenuStackParamList> & {center_id: AvalancheCenterID; requestedTime: RequestedTimeString};
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
    zoneName: string;
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
};
export type HomeStackNavigationProps = NativeStackNavigationProp<HomeStackParamList>;

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
  observationSubmit: {
    center_id: AvalancheCenterID;
  };
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
    zoneName: string;
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
};
export type MenuStackNavigationProps = NativeStackNavigationProp<MenuStackParamList>;
