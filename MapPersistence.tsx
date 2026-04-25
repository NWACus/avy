import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Sentry from '@sentry/react-native';
import React, {createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState} from 'react';
import {useAsyncEffect} from 'use-async-effect';
import {z} from 'zod';

import {MAP_PERSISTENCE_KEY} from 'data/asyncStorageKeys';

const mapCameraSchema = z.object({
  center: z.tuple([z.number(), z.number()]),
  zoom: z.number(),
});

export type MapCameraStop = z.infer<typeof mapCameraSchema>;

const mapPersistenceSchema = z.object({
  isInNoCenterExperience: z.boolean().default(false),
  lastMapCamera: mapCameraSchema.optional(),
});

type MapPersistenceState = z.infer<typeof mapPersistenceSchema>;

const defaultState = mapPersistenceSchema.parse({});

interface MapPersistenceContextType {
  isInNoCenterExperience: boolean;
  setIsInNoCenterExperience: (value: boolean) => void;
  initialMapCamera: MapCameraStop | undefined;
  saveMapCamera: (camera: MapCameraStop) => void;
  mapPersistenceLoaded: boolean;
}

const MapPersistenceContext = createContext<MapPersistenceContextType>({
  isInNoCenterExperience: false,
  setIsInNoCenterExperience: () => undefined,
  initialMapCamera: undefined,
  saveMapCamera: () => undefined,
  mapPersistenceLoaded: false,
});

const SAVE_CAMERA_DEBOUNCE_MS = 500;

interface MapPersistenceProviderProps {
  children?: ReactNode;
}

export const MapPersistenceProvider: React.FC<MapPersistenceProviderProps> = ({children}) => {
  const [isInNoCenterExperience, setIsInNoCenterExperienceState] = useState<boolean>(defaultState.isInNoCenterExperience);
  const [initialMapCamera, setInitialMapCamera] = useState<MapCameraStop | undefined>(defaultState.lastMapCamera);
  const [mapPersistenceLoaded, setMapPersistenceLoaded] = useState(false);

  // Held in a ref so saveMapCamera can persist the latest value without
  // putting the camera into React state (which would re-render consumers).
  const latestCameraRef = useRef<MapCameraStop | undefined>(undefined);
  const saveCameraTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInNoCenterExperienceRef = useRef<boolean>(defaultState.isInNoCenterExperience);

  useAsyncEffect(async () => {
    let stored: Partial<MapPersistenceState> = {};
    try {
      stored = mapPersistenceSchema.parse(JSON.parse((await AsyncStorage.getItem(MAP_PERSISTENCE_KEY)) ?? '{}'));
    } catch (e) {
      await AsyncStorage.removeItem(MAP_PERSISTENCE_KEY);
      Sentry.captureException(e);
    }
    const next = {...defaultState, ...stored};
    setIsInNoCenterExperienceState(next.isInNoCenterExperience);
    isInNoCenterExperienceRef.current = next.isInNoCenterExperience;
    setInitialMapCamera(next.lastMapCamera);
    latestCameraRef.current = next.lastMapCamera;
    setMapPersistenceLoaded(true);
  }, []);

  const persist = useCallback(async (state: MapPersistenceState) => {
    try {
      await AsyncStorage.setItem(MAP_PERSISTENCE_KEY, JSON.stringify(state));
    } catch (e) {
      Sentry.captureException(e);
    }
  }, []);

  const setIsInNoCenterExperience = useCallback(
    (value: boolean) => {
      isInNoCenterExperienceRef.current = value;
      setIsInNoCenterExperienceState(value);
      void persist({isInNoCenterExperience: value, lastMapCamera: latestCameraRef.current});
    },
    [persist],
  );

  const saveMapCamera = useCallback(
    (camera: MapCameraStop) => {
      latestCameraRef.current = camera;
      if (saveCameraTimeoutRef.current) {
        clearTimeout(saveCameraTimeoutRef.current);
      }
      saveCameraTimeoutRef.current = setTimeout(() => {
        void persist({isInNoCenterExperience: isInNoCenterExperienceRef.current, lastMapCamera: latestCameraRef.current});
      }, SAVE_CAMERA_DEBOUNCE_MS);
    },
    [persist],
  );

  useEffect(() => {
    return () => {
      if (saveCameraTimeoutRef.current) {
        clearTimeout(saveCameraTimeoutRef.current);
      }
    };
  }, []);

  const value = useMemo<MapPersistenceContextType>(
    () => ({
      isInNoCenterExperience,
      setIsInNoCenterExperience,
      initialMapCamera,
      saveMapCamera,
      mapPersistenceLoaded,
    }),
    [isInNoCenterExperience, setIsInNoCenterExperience, initialMapCamera, saveMapCamera, mapPersistenceLoaded],
  );

  return <MapPersistenceContext.Provider value={value}>{children}</MapPersistenceContext.Provider>;
};

export const useMapPersistence = () => useContext(MapPersistenceContext);

export const resetMapPersistenceForTests = async () => {
  await AsyncStorage.setItem(MAP_PERSISTENCE_KEY, JSON.stringify(defaultState));
};
