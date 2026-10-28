# Local development

Avy uses native modules (e.g. Mapbox) that aren't in Expo Go, so you run it in a **development build**: your own build of the app that loads JavaScript from your machine.

## Getting started

### 1. Set up your machine

Follow Expo's [environment setup guide](https://docs.expo.dev/get-started/set-up-your-environment/?mode=development-build&buildEnv=local) with **Development build** and **Build locally** selected. You'll need:

- Node 24 and Yarn 1 (`npm install -g yarn`)
- iOS: Xcode and CocoaPods
- Android: Android Studio and JDK 17 or 21. Newer JDKs fail the native build. Android Studio's bundled JDK works: `export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"`

### 2. Install and configure

Clone the repo (volunteers: clone your fork, see [CONTRIBUTING](../CONTRIBUTING.md#working-from-a-fork)), then:

```bash
yarn install
cp .env.sample .env
```

Set `MAPBOX_API_KEY` in `.env` to a Mapbox public token (`pk.…`) or the map won't render. Create one with a free [Mapbox account](https://account.mapbox.com/) or ask developer@nwac.us. Everything else in `.env` is optional; without Sentry and PostHog keys you'll see harmless warnings at startup.

### 3. Build and run

```bash
npx expo run:ios       # or: npx expo run:android
```

The first build takes a few minutes. It installs the app on a simulator/emulator and starts the Metro dev server. If the app opens to a "Development servers" screen (common on Android), tap the running server.

After that, you only need Metro:

```bash
yarn ios               # or: yarn android, or yarn start
```

Rebuild only after native changes (see [When to rebuild](#when-to-rebuild)). For DevTools and logging, see [Debugging](debugging.md).

## How it works

A React Native app has two halves:

- **Native binary**: Swift/Objective-C (iOS) and Kotlin/Java (Android), plus the native code of libraries like Mapbox, Sentry, and expo-location. Changing it requires a rebuild.
- **JavaScript bundle**: everything in `components/`, `hooks/`, etc. Metro (`expo start`) serves it to the app, and Fast Refresh applies edits in about a second.

Expo Go is a prebuilt binary with a fixed set of native modules. Avy needs modules it doesn't include, so it crashes at startup. A development build is your own binary with Avy's native modules plus `expo-dev-client`, which loads JS from Metro.

`ios/` and `android/` are generated and gitignored. `npx expo prebuild` creates them from `app.json`, `app.config.ts`, and config plugins. Don't edit them by hand; regenerate them instead.

## When to rebuild

| You changed                                                                        | Do this                                                     |
| ---------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| JS/TS code                                                                         | Nothing. Fast Refresh picks it up (`r` in Metro to reload). |
| `.env` values                                                                      | Restart Metro with a clear cache: `npx expo start -c`       |
| A package with native code, `app.json` plugins/permissions, or the Expo/RN version | `npx expo prebuild --clean` then `npx expo run:ios`         |

If a build fails or the app crashes after pulling, a stale native project is the usual cause. Run `npx expo prebuild --clean` and rebuild.

## Useful run options

- `npx expo run:ios --device`: pick a simulator or a USB-connected device.
- `npx expo run:ios --no-bundler`: build and install without starting Metro.
- `npx expo prebuild --clean --platform android`: regenerate one platform only.
