import {createContext, useContext} from 'react';

export interface SplashScreenContextValue {
  // False while the sponsor splash screen is still showing. Startup modals wait for this so
  // they don't render above the splash.
  splashComplete: boolean;
}

export const SplashScreenContext = createContext<SplashScreenContextValue>({splashComplete: true});

export const useSplashComplete = (): boolean => useContext(SplashScreenContext).splashComplete;
