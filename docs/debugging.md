# Debugging

## Tools

- **Metro terminal**: app logs and errors print here.
- **React Native DevTools**: press `j` in Metro. Console, breakpoints (Sources, or a `debugger;` statement), network requests, and React Components/Profiler.
- **Dev menu**: press `m` in Metro, tap the floating gear, or press `Ctrl+D` in the iOS simulator / `Cmd+M` in the Android emulator. Includes Element Inspector and the performance monitor.
- **Avy's Developer Menu**: in the app's side drawer, under **Developer Menu → Open Dev Menu** (hidden in release builds). Switch to staging APIs, reset the query cache, reset preferences, and more.
- **LogBox**: on-screen error and warning toasts. Set `EXPO_PUBLIC_DISABLE_LOGBOX=1` to hide them (handy in summer when forecasts are missing).
- **Native crashes** (app closes with no red screen): run from Xcode (`ios/Avy.xcworkspace`) or check Logcat in Android Studio for the native stack trace.

## App logging

Avy logs through the logger in `LoggerContext`. In development builds those logs go to the Metro terminal. Set the level in `.env`, then restart with `npx expo start -c`:

- `LOG_LEVEL=info` (default)
- `LOG_LEVEL=debug`: adds every network request and response
- `LOG_LEVEL=trace`: also adds request and response bodies

## Common gotchas

- **Stale data**: React Query persists its cache for 24 hours, so a fix can look like it didn't work. Clear it from Avy's Developer Menu with **Reset the query cache**.
- **No forecasts in summer**: set `EXPO_PUBLIC_DATE='2023-02-20'` to load a date with real data.
- **Startup warnings about Sentry or PostHog**: expected without those keys in `.env`.

See [.env.sample](../.env.sample) for more debug flags.
