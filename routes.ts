import {BottomTabNavigationProp} from '@react-navigation/bottom-tabs';
import {NavigatorScreenParams} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {AvalancheCenterID} from 'types/nationalAvalancheCenter';

export type TabNavigatorParamList = {
  Home: NavigatorScreenParams<HomeStackParamList> & {center_id: AvalancheCenterID; dateString: string};
  'Weather Data': NavigatorScreenParams<WeatherStackParamList> & {center_id: AvalancheCenterID; dateString: string};
  Observations: NavigatorScreenParams<ObservationsStackParamList> & {center_id: AvalancheCenterID; dateString: string};
  Menu: NavigatorScreenParams<MenuStackParamList> & {center_id: AvalancheCenterID};
};
export type TabNavigationProps = BottomTabNavigationProp<TabNavigatorParamList>;

type WeatherStationDetailPageProps = {
  center_id: AvalancheCenterID;
  station_stids: string[];
  zoneName: string;
  name: string;
  dateString: string;
};

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
  stationDetail: WeatherStationDetailPageProps;
};
export type HomeStackNavigationProps = NativeStackNavigationProp<HomeStackParamList>;

export type WeatherStackParamList = {
  stationList: {
    center_id: AvalancheCenterID;
    dateString: string;
  };
  stationDetail: WeatherStationDetailPageProps;
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
  observationsPortal: {
    center_id: AvalancheCenterID;
    dateString: string;
  };
  observationSubmit: {
    center_id: AvalancheCenterID;
  };
  observationsList: {
    center_id: AvalancheCenterID;
    dateString: string;
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
  avalancheCenterSelector: undefined;
  textStylePreview: undefined;
};
export type MenuStackNavigationProps = NativeStackNavigationProp<MenuStackParamList>;
