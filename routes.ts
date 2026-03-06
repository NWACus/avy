import {BottomTabNavigationProp} from '@react-navigation/bottom-tabs';
import {DrawerNavigationProp} from '@react-navigation/drawer';
import {MaterialTopTabNavigationProp} from '@react-navigation/material-top-tabs';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {AvalancheCenterID, WeatherStationSource} from 'types/nationalAvalancheCenter';
import {RequestedTimeString} from 'utils/date';

export type TabNavigatorParamList = {
  Map: {center_id: AvalancheCenterID; requestedTime: RequestedTimeString};
  Weather: {center_id: AvalancheCenterID; requestedTime: RequestedTimeString};
  Observations: {center_id: AvalancheCenterID; requestedTime: RequestedTimeString};
};

export type TabNavigationProps = BottomTabNavigationProp<TabNavigatorParamList>;

export type MainStackParamList = {
  bottomTabs: TabNavigationProps;

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
  observationSubmit: undefined;
  observationsPortal: {
    center_id: AvalancheCenterID;
    requestedTime: RequestedTimeString;
  };
};

export type MainStackNavigationProps = NativeStackNavigationProp<MainStackParamList>;

export type DrawerParamList = {
  MainStack: MainStackNavigationProps;
};

export type SideDrawerNavigationProps = DrawerNavigationProp<DrawerParamList>;

export type RootStackParamList = {
  drawer: SideDrawerNavigationProps;
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

export type RootStackNavigatorProps = NativeStackNavigationProp<RootStackParamList>;

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
