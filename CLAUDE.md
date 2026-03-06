# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Avy is a React Native (Expo managed workflow) app for viewing avalanche forecasts, observations, and weather data. Built with TypeScript, targeting iOS, Android, and web.

## Commands

```bash
yarn install              # Install dependencies
yarn ios                  # Run on iOS simulator
yarn android              # Run on Android emulator
yarn start                # Start Expo dev server
yarn test                 # Run all Jest tests
yarn test <pattern>       # Run specific test file (e.g. yarn test date.test)
yarn ci                   # Full CI: prettier + eslint + tsc + tests
yarn ci:prettier          # Check formatting
yarn ci:eslint            # Run linter
yarn ci:tsc               # TypeScript type check
yarn prettify             # Auto-fix formatting and lint issues
yarn graphql:codegen      # Generate GraphQL types
yarn gen-openapi          # Generate OpenAPI types (Snowbound API)
yarn intl:extract         # Extract i18n strings
yarn intl:compile         # Compile i18n translations
```

## Architecture

### Navigation

React Navigation v6 with bottom tabs (Home/Observations/Weather/Menu). Each tab has its own stack navigator. Route types defined in `routes.ts`. Material top tabs used for forecast detail view.

### Data Fetching

TanStack React Query v4 with AsyncStorage persistence (24h cache TTL). Axios HTTP client with custom logging interceptors. Query cache key includes git revision for automatic cache busting on updates.

Custom hooks in `hooks/` wrap React Query (e.g. `useAvalancheForecast`, `useNWACObservations`, `useWeatherStationTimeseries`). Safe fetch wrapper in `hooks/fetch.ts` handles errors and throws `NotFoundError` for 404s.

API hosts configured in `clientContext.ts` with production/staging toggle:

- National Avalanche Center: `api.avalanche.org`
- NWAC: `nwac.us`
- Snowbound (weather): `api.snowobs.com`

Zod schemas validate API responses at runtime, with parse errors reported to Sentry.

### State Management

React Context providers (nested in `App.tsx`):

- **ClientContext** - API host URLs and requested time
- **PreferencesProvider** - AsyncStorage-backed user preferences (Zod-validated schema in `Preferences.tsx`)
- **FeatureFlagsProvider** - PostHog feature flags with client-side overrides (`FeatureFlags.tsx`)
- **LoggerContext** - Bunyan logger instance

### Forms

react-hook-form with Zod validation (`@hookform/resolvers`). Custom form field components in `components/form/` (TextField, DateField, SelectField, LocationField, ImageCaptionField, etc.).

### UI Components

Core layout primitives in `components/core/` (View with theme-aware props, VStack, HStack, Center). Theme colors and spacing defined in `theme/`. Inline styles with theme lookups rather than separate stylesheets.

## Key Directories

- `components/screens/` - Full screen components
- `components/forecast/` - Avalanche forecast visualization
- `components/observations/` - Observation list/detail/submit
- `components/form/` - Form field components
- `components/core/` - Layout primitives (View, VStack, HStack)
- `components/content/` - Shared UI (Button, Card, Toast, QueryState)
- `hooks/` - 35+ custom hooks, primarily React Query wrappers
- `types/` - TypeScript types; `types/generated/` for OpenAPI output
- `network/` - Prefetching logic (`prefetchAllActiveForecasts.ts`)
- `theme/` - Colors, spacing, shadows
- `lang/` / `compiled-lang/` - i18n (react-intl, English only)

## Code Conventions

### ESLint Rules (enforced)

- **No inline functions in JSX** (`react/jsx-no-bind: error`) - extract callbacks with `useCallback`
- **Absolute imports only** (`absolute-imports/only-absolute-imports: error`) - no relative imports
- **No console.log** (`no-console: error`) - use the logger from `LoggerContext`
- Unused variables prefixed with `_` are allowed

### Prettier

printWidth: 180, single quotes, trailing commas, no bracket spacing, arrow parens: avoid, bracket same line.

### Naming

- Components/files: PascalCase
- Hooks: `use` prefix, camelCase
- Constants: SCREAMING_SNAKE_CASE

## Environment

Copy `.env.sample` to `.env` and populate secrets (Google Maps API keys, Sentry DSN). For Expo Go development, an empty `.env` file works.

Key env vars for development:

- `LOG_LEVEL` - Logger level (default: 'info', set to 'debug' for network logging)
- `LOG_NETWORK` - Enable network logging ('queries', 'requests', 'responses', 'all')
- `EXPO_PUBLIC_DISABLE_PREFETCHING` - Skip startup data preload
- `EXPO_PUBLIC_AUTOFILL_FAKE_OBSERVATION` - Auto-fill observation forms for testing

## CI

GitHub Actions runs prettier, eslint, TypeScript, and tests as separate jobs. Pre-commit hooks via Husky enforce the same checks locally. Run `yarn prettify` before committing.
