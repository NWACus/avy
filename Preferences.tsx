// Create an object that uses AsyncStorage to persist user preferences
// and provide a hook to update them.

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Sentry from '@sentry/react-native';
import {merge} from 'lodash';
import React, {createContext, ReactNode, useCallback, useContext, useEffect, useState} from 'react';
import uuid from 'react-native-uuid';
import {useAsyncEffect} from 'use-async-effect';
import {z} from 'zod';

import {PREFERENCES_KEY} from 'data/asyncStorageKeys';
import {avalancheCenterIDSchema} from 'types/nationalAvalancheCenter';

const preferencesSchema = z.object({
  center: avalancheCenterIDSchema.default('NWAC'),
  hasSeenCenterPicker: z.boolean().default(false),
  developerMenuCollapsed: z.boolean().default(true),
  mixpanelUserId: z.string().uuid().optional(),
});

export type Preferences = z.infer<typeof preferencesSchema>;

const defaultPreferences = preferencesSchema.parse({});

interface PreferencesContextType {
  preferences: Preferences;
  setPreferences: (preferences: Partial<Preferences>) => void;
  clearPreferences: () => void;
}

const PreferencesContext = createContext<PreferencesContextType>({
  preferences: defaultPreferences,
  setPreferences: () => undefined,
  clearPreferences: () => undefined,
});

interface PreferencesProviderProps {
  children?: ReactNode;
}

export const PreferencesProvider: React.FC<PreferencesProviderProps> = ({children}) => {
  const [preferences, setPreferences] = useState<Preferences>(defaultPreferences);

  useAsyncEffect(async () => {
    let storedPreferences = {};
    try {
      storedPreferences = preferencesSchema.parse(JSON.parse((await AsyncStorage.getItem(PREFERENCES_KEY)) ?? '{}'));
    } catch (e) {
      // Error parsing preferences, ignore as we'll fall back to defaults
      await AsyncStorage.removeItem(PREFERENCES_KEY);
      // But do log it to Sentry as it shouldn't happen
      Sentry.captureException(e);
    }
    setPartialPreferences(
      merge(
        {},
        defaultPreferences,
        {
          // Generate a new UUID if one doesn't exist, but overwrite with stored prefs if that's set
          mixpanelUserId: uuid.v4(),
        },
        storedPreferences,
      ),
    );
  }, []);

  useEffect(() => {
    void AsyncStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
  }, [preferences]);

  const setPartialPreferences = useCallback(
    (newPreferences: Partial<Preferences>) => {
      setPreferences(merge({}, preferences, newPreferences));
    },
    [preferences, setPreferences],
  );

  const clearPreferences = useCallback(() => {
    // Clear everything _except_ the mixpanelUserId. It might not be set yet, but if it is we don't want to lose it.
    setPreferences({...defaultPreferences, mixpanelUserId: preferences.mixpanelUserId});
  }, [setPreferences, preferences.mixpanelUserId]);

  return <PreferencesContext.Provider value={{preferences, setPreferences: setPartialPreferences, clearPreferences}}>{children}</PreferencesContext.Provider>;
};

export const usePreferences = () => useContext(PreferencesContext);

export const resetPreferencesForTests = async () => {
  await AsyncStorage.setItem(PREFERENCES_KEY, JSON.stringify(defaultPreferences));
};
