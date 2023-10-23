import AsyncStorage from '@react-native-async-storage/async-storage';
import {renderHook} from '@testing-library/react-hooks';

import {PREFERENCES_KEY} from 'data/asyncStorageKeys';
import {clearPreferences, PreferencesProvider, usePreferences} from 'Preferences';

// Mock out AsyncStorage for tests
// eslint-disable-next-line @typescript-eslint/no-unsafe-return
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));

describe('Preferences', () => {
  beforeEach(() => {
    // Suppress console.error while running the test - mocking out hooks produces noise around misuse of act()
    jest.spyOn(console, 'error').mockImplementation(() => jest.fn());
  });

  it('makes default preferences available immediately', () => {
    const {result} = renderHook(() => usePreferences());
    expect(result.current.preferences.center).toEqual('NWAC');
  });

  it('updates after preferences are loaded', async () => {
    await AsyncStorage.setItem(PREFERENCES_KEY, JSON.stringify({center: 'BAC', hasSeenCenterPicker: true}));
    const {result, waitForValueToChange} = renderHook(() => usePreferences(), {wrapper: PreferencesProvider});
    expect(result.current.preferences.center).toEqual('NWAC');

    await waitForValueToChange(() => result.current.preferences.center);
    expect(result.current.preferences.center).toEqual('BAC');
  });

  it('falls back to defaults if preferences cannot be parsed', async () => {
    // Trash the stored preferences
    await AsyncStorage.setItem(PREFERENCES_KEY, JSON.stringify({foo: 'bar'}));

    // Render the hook to load the preferences
    const {result} = renderHook(() => usePreferences(), {wrapper: PreferencesProvider});
    // We see NWAC as expected, since the preferences could not be parsed
    expect(result.current.preferences.center).toEqual('NWAC');
    // We also should see that the preferences have been reset in storage
    expect(AsyncStorage.setItem).toHaveBeenLastCalledWith(PREFERENCES_KEY, expect.stringContaining('"center":"NWAC"'));
  });

  afterEach(async () => {
    await clearPreferences();
    jest.restoreAllMocks();
  });
});
