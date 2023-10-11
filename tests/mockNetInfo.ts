const onlineState = {
  type: 'cellular',
  isConnected: true,
  isInternetReachable: true,
};

const offlineState = {
  type: 'none',
  isConnected: false,
  isInternetReachable: false,
};

interface NetInfoState {
  type: string;
  isConnected: boolean;
  isInternetReachable: boolean;
}

let currentState = onlineState;
const listeners: ((state: NetInfoState) => void)[] = [];

const MockNetInfo = {
  configure: jest.fn(),
  fetch: jest.fn().mockImplementation(() => {
    return Promise.resolve(currentState);
  }),
  refresh: jest.fn().mockResolvedValue(currentState),
  addEventListener: jest.fn().mockImplementation((handler: (state: NetInfoState) => void) => {
    listeners.push(handler);
  }),
  useNetInfo: jest.fn().mockImplementation(() => Promise.resolve(currentState)),
  mockGoOnline: () => {
    currentState = onlineState;
    listeners.forEach(listener => listener(currentState));
  },
  mockGoOffline: () => {
    currentState = offlineState;
    listeners.forEach(listener => listener(currentState));
  },
};

jest.mock('@react-native-community/netinfo', () => MockNetInfo);
