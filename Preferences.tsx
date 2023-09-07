// Create an object that uses AsyncStorage to persist user preferences
// and provide a hook to update them.

import AsyncStorage from '@react-native-async-storage/async-storage';
import {merge} from 'lodash';
import React, {createContext, ReactNode, useContext, useEffect, useState} from 'react';

import {avalancheCenterIDSchema} from 'types/nationalAvalancheCenter';
import {useAsyncEffect} from 'use-async-effect';
import {z} from 'zod';

export const PREFERENCES_KEY = 'PREFERENCES';

const preferencesSchema = z.object({
  center: avalancheCenterIDSchema,
  hasSeenCenterPicker: z.boolean(),
});

export type Preferences = z.infer<typeof preferencesSchema>;

const defaultPreferences: Preferences = {
  center: 'NWAC',
  hasSeenCenterPicker: false,
};

interface PreferencesContextType {
  preferences: Preferences;
  setPreferences: (preferences: Partial<Preferences>) => void;
}

const PreferencesContext = createContext<PreferencesContextType>({
  preferences: defaultPreferences,
  setPreferences: () => undefined,
});

interface PreferencesProviderProps {
  children?: ReactNode;
}

export const PreferencesProvider: React.FC<PreferencesProviderProps> = ({children}) => {
  const [preferences, setFullPreferences] = useState<Preferences>(defaultPreferences);

  useAsyncEffect(async () => {
    let storedPreferences = {};
    try {
      storedPreferences = preferencesSchema.parse(JSON.parse((await AsyncStorage.getItem(PREFERENCES_KEY)) ?? '{}'));
    } catch (_e) {
      // Error parsing preferences, ignore as we'll fall back to defaults
      await clearPreferences();
    }
    if (storedPreferences) {
      setPreferences(merge({}, defaultPreferences, storedPreferences));
    }
  }, []);

  useEffect(() => {
    void AsyncStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
  }, [preferences]);

  const setPreferences = (newPreferences: Partial<Preferences>) => {
    setFullPreferences(merge({}, preferences, newPreferences));
  };

  return <PreferencesContext.Provider value={{preferences, setPreferences}}>{children}</PreferencesContext.Provider>;
};

export const usePreferences = () => useContext(PreferencesContext);

export const clearPreferences = async () => {
  await AsyncStorage.removeItem(PREFERENCES_KEY);
  await AsyncStorage.setItem(PREFERENCES_KEY, JSON.stringify(defaultPreferences));
};
