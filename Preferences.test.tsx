import AsyncStorage from '@react-native-async-storage/async-storage';
import {renderHook} from '@testing-library/react-hooks';
import {waitFor} from '@testing-library/react-native';

import {PREFERENCES_KEY} from 'data/asyncStorageKeys';
import {PreferencesProvider, resetPreferencesForTests, usePreferences} from 'Preferences';

// Mock out AsyncStorage for tests
// eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-require-imports
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
    const {result} = renderHook(() => usePreferences(), {wrapper: PreferencesProvider});
    expect(result.current.preferences.center).toEqual('NWAC');

    await waitFor(() => {
      expect(result.current.preferences.center).toEqual('BAC');
    });
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

  describe('mixpanelUserId', () => {
    it('is not set when first loading', () => {
      const {result} = renderHook(() => usePreferences());
      expect(result.current.preferences.mixpanelUserId).toBeUndefined();
    });

    it('updates to a default value after loading', async () => {
      await AsyncStorage.setItem(PREFERENCES_KEY, JSON.stringify({center: 'BAC', hasSeenCenterPicker: true}));
      const {result} = renderHook(() => usePreferences(), {wrapper: PreferencesProvider});
      expect(result.current.preferences.mixpanelUserId).toBeUndefined();

      await waitFor(() => {
        expect(result.current.preferences.mixpanelUserId).toMatch(/^[0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}$/);
      });
    });

    it('does not overwrite a previously saved id', async () => {
      await AsyncStorage.setItem(PREFERENCES_KEY, JSON.stringify({center: 'BAC', hasSeenCenterPicker: true, mixpanelUserId: '00000000-0000-0000-0000-000000000000'}));
      const {result} = renderHook(() => usePreferences(), {wrapper: PreferencesProvider});
      expect(result.current.preferences.mixpanelUserId).toBeUndefined();

      await waitFor(() => {
        expect(result.current.preferences.mixpanelUserId).toEqual('00000000-0000-0000-0000-000000000000');
      });
    });

    it('is preserved when clearPreferences is called', async () => {
      const userId = 'CE998943-7231-42C4-A22F-24845B2CF567';
      await AsyncStorage.setItem(PREFERENCES_KEY, JSON.stringify({center: 'BAC', hasSeenCenterPicker: true, mixpanelUserId: userId}));

      // Render the hook to load the preferences. First we'll see the default value, then the saved value
      const {result} = renderHook(() => usePreferences(), {wrapper: PreferencesProvider});
      expect(result.current.preferences.mixpanelUserId).toBeUndefined();

      await waitFor(() => {
        expect(result.current.preferences.center).toEqual('BAC');
        expect(result.current.preferences.mixpanelUserId).toEqual(userId);
      });

      // Now clear the preferences. This is not async - we clear them in memory immediately, and lazily persist the change.
      result.current.clearPreferences();

      // After clearing, the center is reset to the default, but the userId is preserved
      await waitFor(() => {
        expect(result.current.preferences.center).toEqual('NWAC');
        expect(result.current.preferences.mixpanelUserId).toEqual(userId);
      });
    });

    it('is lost when preferences are damaged', async () => {
      const userId = 'CE998943-7231-42C4-A22F-24845B2CF567';
      await AsyncStorage.setItem(PREFERENCES_KEY, JSON.stringify({mixpanelUserId: userId, center: 'this is not a valid center'}));

      // Render the hook to load the preferences. First we'll see the default value, then the saved value
      const {result} = renderHook(() => usePreferences(), {wrapper: PreferencesProvider});
      expect(result.current.preferences.mixpanelUserId).toBeUndefined();
      // The center is invalid, so preferences parsing will fail. The previous user id is lost, and we get a different UUID in its place.
      await waitFor(() => {
        expect(result.current.preferences.mixpanelUserId).toMatch(/^[0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}$/);
        expect(result.current.preferences.mixpanelUserId).not.toEqual(userId);
      });
    });

    it('does overwrite an invalid id', async () => {
      await AsyncStorage.setItem(PREFERENCES_KEY, JSON.stringify({center: 'BAC', hasSeenCenterPicker: true, mixpanelUserId: 'not a uuid'}));
      const {result} = renderHook(() => usePreferences(), {wrapper: PreferencesProvider});
      expect(result.current.preferences.mixpanelUserId).toBeUndefined();

      await waitFor(() => {
        expect(result.current.preferences.mixpanelUserId).toMatch(/^[0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}$/);
      });
    });
  });

  afterEach(async () => {
    await resetPreferencesForTests();
    jest.restoreAllMocks();
  });
});
