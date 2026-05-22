# Coding Guide

This guide documents the coding styles, patterns, and conventions used in the Avy codebase. It is intended for contributors to quickly understand how to write code that is consistent with the rest of the project.

## Table of Contents

- [Project Structure](#project-structure)
- [Component Patterns](#component-patterns)
- [Layout and Styling](#layout-and-styling)
- [Data Fetching](#data-fetching)
- [State Management](#state-management)
- [Forms and Validation](#forms-and-validation)
- [TypeScript Conventions](#typescript-conventions)
- [Navigation](#navigation)
- [Testing](#testing)
- [Linting and Formatting](#linting-and-formatting)
- [Imports](#imports)

---

## Project Structure

```
components/
  core/         # Layout primitives: View, VStack, HStack, Center, Divider
  content/      # Shared UI: Button, Card, Toast, QueryState, Outcome
  form/         # Form field components: TextField, DateField, SelectField, etc.
  forecast/     # Avalanche forecast visualization (AvalancheTab, WeatherTab, etc.)
  observations/ # Observation list, detail, and submission
  screens/      # Full screen components (one per tab/route)
  text/         # Typography components: BodySm, Title3Black, Caption1Semibold, etc.
  helpers/      # Shared utility functions (geographic coordinates, etc.)
hooks/          # 30+ custom hooks, primarily React Query wrappers
types/          # TypeScript types; types/generated/ for OpenAPI output
theme/          # Colors, spacing, shadows, radii
network/        # Prefetching logic (prefetchAllActiveForecasts.ts)
routes.ts       # Route type definitions for all navigators
clientContext.ts # API host URLs and requested time context
Preferences.tsx # AsyncStorage-backed user preferences with Zod validation
FeatureFlags.tsx # PostHog feature flags with client-side overrides
loggerContext.ts # Bunyan logger context
```

## Component Patterns

### Functional Components Only

All components are functional. Class components are not used.

```tsx
// Named export (preferred for most components)
export const MyComponent: React.FunctionComponent<MyComponentProps> = ({prop1, prop2}) => {
  return <View>...</View>;
};

// forwardRef when ref forwarding is needed (always set displayName)
export const MyComponent = React.forwardRef<RNView, MyComponentProps>(({children, ...props}, ref) => {
  return (
    <View {...props} ref={ref}>
      {children}
    </View>
  );
});
MyComponent.displayName = 'MyComponent';
```

### Props Typing

Props are defined as interfaces that extend base component props when appropriate:

```tsx
interface MyComponentProps extends ViewProps {
  title: string;
  onAction?: () => void;
}

// PropsWithChildren when children are used explicitly
const Card: React.FunctionComponent<PropsWithChildren<CardProps>> = ({children, ...props}) => { ... };
```

### Exports

- Components use **named exports** (not default exports)
- Hook files export the hook as a named export _and_ a default object with `queryKey`, `fetch`, and `prefetch` methods
- Multiple related components can be exported from the same file (e.g., `QueryState.tsx` exports `QueryState`, `Loading`, `NotFound`, `InternalError`, `ConnectionLost`)

### No Inline Functions in JSX

ESLint enforces `react/jsx-no-bind`. Extract all callbacks with `useCallback`:

```tsx
// BAD
<Button onPress={() => doSomething()} />;

// GOOD
const handlePress = useCallback(() => {
  doSomething();
}, [doSomething]);
<Button onPress={handlePress} />;
```

### Loading and Error States

Use `QueryState` from `components/content/QueryState` to handle loading/error/not-found states from React Query results:

```tsx
const forecastResult = useAvalancheForecast(centerId, zoneId, requestedTime);
const centerResult = useAvalancheCenterMetadata(centerId);

if (incompleteQueryState(forecastResult, centerResult)) {
  return <QueryState results={[forecastResult, centerResult]} />;
}

// At this point, forecastResult.data and centerResult.data are guaranteed to exist
```

`QueryState` handles:

- **Loading**: Shows a centered `ActivityIndicator`
- **Offline**: Shows a "Connection Lost" outcome with retry
- **404/Not Found**: Shows a "No results found" outcome (customizable via `customMessage` prop)
- **Other errors**: Reports to Sentry, shows a generic error outcome

## Layout and Styling

### Layout Primitives

The codebase uses custom layout primitives from `components/core/` instead of raw React Native `View`:

| Component | Description                                                                                                            |
| --------- | ---------------------------------------------------------------------------------------------------------------------- |
| `View`    | Enhanced RN View with style shorthand props (`bg`, `p`, `px`, `py`, `m`, `mx`, etc.) and theme-aware `backgroundColor` |
| `VStack`  | Vertical stack (`flexDirection: 'column'`) with `space` prop for `rowGap`                                              |
| `HStack`  | Horizontal stack (`flexDirection: 'row'`) with `space` prop for `columnGap`                                            |
| `Center`  | Centered flex container                                                                                                |
| `Divider` | Horizontal divider line                                                                                                |

```tsx
<VStack space={8} p={16}>
  <HStack space={4} justifyContent="space-between">
    <Title>Hello</Title>
    <Caption1Semibold>Subtitle</Caption1Semibold>
  </HStack>
  <Divider />
  <BodySm>Content here</BodySm>
</VStack>
```

### View Shorthand Props

The custom `View` component accepts shorthand props for common styles:

| Shorthand                               | Maps to           |
| --------------------------------------- | ----------------- |
| `bg`                                    | `backgroundColor` |
| `p`, `px`, `py`, `pt`, `pl`, `pr`, `pb` | `padding*`        |
| `m`, `mx`, `my`, `mt`, `ml`, `mr`, `mb` | `margin*`         |

The `bg` prop also supports theme color lookups by string key (e.g., `bg="white"`, `bg="primary.background"`).

### Inline Styles with Theme Lookups

Styles are applied inline rather than using separate `StyleSheet.create` calls (though `StyleSheet.create` is used occasionally for complex static styles). Theme colors are accessed via `colorLookup()`:

```tsx
import {colorLookup} from 'theme';

<View borderWidth={2} borderColor={colorLookup('border.base')} borderRadius={8} bg="white" p={16} />;
```

### Typography

Typography components are defined in `components/text/index.tsx`. Each is a thin wrapper around a `TextWrapper` component with preset styles. Naming follows the **SizeWeight** pattern:

```tsx
<Title>Page Title</Title>
<BodySm>Body text, small</BodySm>
<BodySmBlack>Bold body text, small</BodySmBlack>
<Caption1Semibold>Caption</Caption1Semibold>
<AllCapsSm>LABEL</AllCapsSm>
<Title3Semibold>Section Title</Title3Semibold>
```

All text components accept a `color` prop that goes through `colorLookup()`.

### Color System

Colors are defined in `theme/colors.ts` as a flat `Record<string, ColorValue>` using dot-notation keys:

```
primary, primary.hover, primary.active, primary.outline, primary.background
text, text.secondary, text.tertiary
border.base, border.split, border.active
error, error.hover, error.active, error.outline, error.background
success, warning, disabled
```

Colors from design specs with alpha channels are pre-blended against white to produce solid hex values using `tinycolor2`.

## Data Fetching

### React Query Hooks

All API data fetching uses TanStack React Query v4. Custom hooks in `hooks/` wrap `useQuery`:

```tsx
export const useAvalancheForecast = (
  center_id: AvalancheCenterID,
  zone_id: number,
  requestedTime: RequestedTime,
  center?: AvalancheCenter,
): UseQueryResult<ForecastResult, AxiosError | ZodError> => {
  const {nationalAvalancheCenterHost} = React.useContext<ClientProps>(ClientContext);
  const {logger} = React.useContext<LoggerProps>(LoggerContext);
  const key = queryKey(nationalAvalancheCenterHost, center_id, zone_id, requestedTime);
  const [thisLogger] = useState(logger.child({query: key}));

  return useQuery<ForecastResult, AxiosError | ZodError>({
    queryKey: key,
    queryFn: async () => fetchAvalancheForecast(...),
    enabled: !!center,
    cacheTime: 24 * 60 * 60 * 1000, // 24 hours
  });
};
```

Key patterns:

- **Query keys** include the API host and all relevant parameters
- **`enabled`** is used to conditionally run queries (e.g., when dependencies aren't loaded yet)
- **`cacheTime`** is set to 24 hours for most queries; `Infinity` for static metadata
- Error types are `AxiosError | ZodError`
- Each hook file exports a default object with `queryKey`, `fetch`, and `prefetch` for use by prefetching logic
- Child loggers are created per-query with structured metadata for debugging

### Hook File Structure

Each data-fetching hook file follows a 3-part structure:

1. **React hook** (`useX`) - wraps `useQuery` with context access and logging
2. **Query key generator** - pure function returning the cache key array
3. **Default export object** - `{ queryKey, fetch, prefetch }` for reuse in prefetching and composed queries

```tsx
// Part 1: Hook
export const useMyData = (...): UseQueryResult<T, AxiosError | ZodError> => { ... };

// Part 2: Query key
function queryKey(...) {
  return ['my-data', {host, ...params}];
}

// Part 3: Reusable exports
export default {
  queryKey,
  fetch: fetchMyData,
  prefetch: prefetchMyData,
};
```

### QueryClient Configuration

```tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      cacheTime: 24 * 60 * 60 * 1000, // 24 hours
      retry: (failureCount, error) =>
        failureCount <= 3 &&
        !(error instanceof NotFoundError) && // 404s are terminal
        !(error instanceof ZodError), // Schema errors are terminal
    },
  },
});
```

Cache is persisted to AsyncStorage with the git revision as a buster, ensuring automatic cache invalidation on app updates.

### Query Variants

- **`useQuery`**: Standard single queries (most hooks)
- **`useQueries`**: Parallel independent queries (e.g., `useMapLayerAvalancheForecasts` maps features into parallel queries)
- **`useInfiniteQuery`**: Paginated data (e.g., `useNWACObservations` with time-window pagination)

### Safe Fetch Wrapper

All HTTP requests go through `safeFetch()` in `hooks/fetch.ts`, which:

- Uses Axios for HTTP calls
- Throws `NotFoundError` for 404s (used by `QueryState` for "not found" UI)
- Logs warnings for other HTTP errors via the Bunyan logger
- Provides structured error messages

### Zod Schema Validation

API responses are validated at runtime using Zod schemas with `safeParse`:

```tsx
const parseResult = forecastResultSchema.safeParse(data);
if (!parseResult.success) {
  logger.warn({error: parseResult.error}, 'failed to parse');
  Sentry.captureException(parseResult.error, {
    tags: {zod_error: true, center_id, zone_id, url},
  });
  throw parseResult.error;
}
return parseResult.data;
```

Parse failures are reported to Sentry with `zod_error: true` tag.

### API Configuration

API hosts are configured in `clientContext.ts` with production and staging variants:

| API                       | Production                | Staging                      |
| ------------------------- | ------------------------- | ---------------------------- |
| National Avalanche Center | `api.avalanche.org`       | `staging-api.avalanche.org`  |
| NAC WordPress             | `forecasts.avalanche.org` | `devavycenters.wpengine.com` |
| Snowbound (weather)       | `api.snowobs.com`         | `dev.snowobs.com`            |
| NWAC                      | `nwac.us`                 | `staging.nwac.us`            |

The `ClientContext` React context provides these hosts to all hooks.

## State Management

### Context Providers

The app uses React Context for global state (no Redux, Zustand, etc.). Providers are nested in a specific dependency order in `App.tsx`:

```
LoggerContext.Provider          # Lowest level - all children can log
  PersistQueryClientProvider    # React Query + AsyncStorage persistence
    IntlProvider                # i18n (English only)
      ClientContext.Provider    # API hosts + requested time
        PreferencesProvider     # User settings (depends on AsyncStorage)
          PostHogProvider       # Analytics
            FeatureFlagsProvider # Feature flags (depends on PostHog + Preferences)
              NavigationContainer # React Navigation
```

| Context                | Purpose                                               |
| ---------------------- | ----------------------------------------------------- |
| `ClientContext`        | API host URLs, requested time, staging toggle         |
| `PreferencesContext`   | User preferences (AsyncStorage-backed, Zod-validated) |
| `FeatureFlagsProvider` | PostHog feature flags with client-side overrides      |
| `LoggerContext`        | Bunyan logger instance                                |

### Preferences

User preferences use a Zod schema to define shape and defaults:

```tsx
const preferencesSchema = z.object({
  center: avalancheCenterIDSchema.default('NWAC'),
  hasSeenCenterPicker: z.boolean().default(false),
  developerMenuCollapsed: z.boolean().default(true),
  mixpanelUserId: z.string().uuid().optional(),
});

export type Preferences = z.infer<typeof preferencesSchema>;
```

Preferences are loaded from AsyncStorage on mount, merged with defaults via `lodash.merge`, and persisted back on every change. Invalid stored preferences are caught, reported to Sentry, and replaced with defaults.

### Feature Flags

Feature flags are loaded from PostHog and refreshed every 30 minutes (immediate in development). Client-side overrides can be set via the developer menu. Flags are accessed via hooks:

```tsx
const flags = useAllFeatureFlags();
const singleFlag = useOneFeatureFlag('my-flag');
```

### Logging

Use the logger from `LoggerContext`, never `console.log` (enforced by ESLint):

```tsx
const {logger} = React.useContext<LoggerProps>(LoggerContext);
const [thisLogger] = useState(logger.child({query: key}));
thisLogger.debug('initiating query');
```

Child loggers are created with contextual metadata (query keys, URLs, etc.). Log levels:

- `trace`: Detailed data (request/response bodies)
- `debug`: Query initiation, prefetch completion
- `warn`: Parse failures, error responses
- `error`: Unexpected errors, critical failures

Logs are written to a file and attached to Sentry error reports.

## Forms and Validation

### react-hook-form + Zod

Forms use `react-hook-form` with Zod resolvers from `@hookform/resolvers`:

```tsx
const formContext = useForm<ObservationFormData>({
  resolver: zodResolver(formSchema),
  defaultValues: defaultObservationFormData(),
  mode: 'onBlur', // Validate on blur, not on change
  shouldFocusError: false, // Custom scroll-to-error instead
  shouldUnregister: true, // Clean up conditional fields
});
```

Forms are wrapped with `<FormProvider>` to provide form context to nested field components.

### Custom Form Components

Form fields in `components/form/` are tightly integrated with `react-hook-form` via `useController`:

| Component             | Purpose                                                     |
| --------------------- | ----------------------------------------------------------- |
| `TextField`           | Text input with label, error display, focus states          |
| `DateField`           | Date picker (native)                                        |
| `QuickPickDateField`  | Date selection with quick-pick buttons                      |
| `SelectField`         | Dropdown select with optional quick-pick buttons            |
| `CheckboxSelectField` | Multi-select with checkboxes (or radio mode)                |
| `LocationField`       | GPS location picker (modal-based)                           |
| `ImageCaptionField`   | Image upload with captions (array field)                    |
| `SwitchField`         | Segmented control for toggling values                       |
| `Conditional`         | Conditionally show/hide form sections based on field values |

### Type-Safe Field Components

Form components use generics constrained by `FieldPathByValue` to ensure type-safe field names:

```tsx
const _TextField = <TFieldValues extends FieldValues, TFieldName extends FieldPathByValue<TFieldValues, StringFieldValue>>(
  {name, label, ...props}: TextFieldProps<TFieldValues, TFieldName>,
  ref: Ref<RNView>,
) => {
  const {field, fieldState} = useController<TFieldValues, TFieldName>({name});
  // ...
};
```

Type-aliased versions allow inference of field names from the form type:

```tsx
const ObservationTextField = TextField as TextFieldComponent<ObservationFormData>;
<ObservationTextField name="firstName" label="First Name" />; // name is type-checked
```

### Cross-Field Validation

Complex validation rules that depend on multiple fields use Zod's `superRefine`:

```tsx
const schema = z
  .object({
    instability: z.object({
      cracking: z.boolean(),
      cracking_description: z.string().optional(),
    }),
  })
  .superRefine((arg, ctx) => {
    if (arg.instability.cracking && !arg.instability.cracking_description) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'This field is required.',
        path: ['instability', 'cracking_description'],
      });
    }
  });
```

### Conditional Form Sections

The `Conditional` component uses `useWatch` to show/hide form sections based on field values:

```tsx
<Conditional name="instability.avalanches_observed" value={true}>
  <SwitchField name="instability.avalanches_triggered" label="Did you trigger an avalanche?" ... />
</Conditional>
```

Dependent fields are auto-cleared when their parent condition becomes false via `useWatch` + `useEffect`.

### Error Display and Scroll-to-Error

All field components show errors below the field using `fieldState.error.message`. On form submission, a custom scroll-to-first-error handler uses refs and `measureLayout()` to scroll the ScrollView to the first errored field.

## TypeScript Conventions

### Strict Mode

TypeScript is in strict mode (`"strict": true` in tsconfig.json). The project also uses `@typescript-eslint/recommended-requiring-type-checking`.

### Types vs Interfaces

- **Interfaces** for component props and context types (extendable)
- **Type aliases** for Zod-inferred types, union types, and utility types

### Zod Schema / Type Pairing

Zod schemas are defined first, then types are inferred:

```tsx
const forecastResultSchema = z.object({...});
type ForecastResult = z.infer<typeof forecastResultSchema>;
```

### Enum Patterns

The codebase uses two enum patterns:

**Standard TypeScript enums** for simple cases:

```tsx
export enum DangerLevel {
  GeneralInformation = -1,
  None,
  Low,
  Moderate,
  Considerable,
  High,
  Extreme,
}

export enum ProductType {
  Forecast = 'forecast',
  Warning = 'warning',
  // ...
}
```

**`as const` objects with type extraction** for bidirectional mappings:

```tsx
export const Activity = {
  'Skiing/Snowboarding': 'skiing_snowboarding',
  'Snowmobiling/Snowbiking': 'snowmobiling_snowbiking',
  // ...
} as const;

export type Activity = (typeof Activity)[keyof typeof Activity];

// Reverse lookup helper
export const FormatActivity = (value: Activity): string => reverseLookup(Activity, value);
```

### Discriminated Unions

Used extensively with Zod for type-safe data handling:

```tsx
export const mediaItemSchema = z.discriminatedUnion('type', [
  imageMediaSchema,
  videoMediaSchema,
  externalMediaSchema,
  // ...
]);
export type MediaItem = z.infer<typeof mediaItemSchema>;
```

### Higher-Order Zod Schemas

Generic schema factories allow composable, reusable schema templates:

```tsx
export const featureSchema = <T extends z.ZodTypeAny, U extends z.ZodTypeAny>(propertiesSchema: T, idSchema: U) =>
  geoJsonObjectSchema.extend({
    type: z.literal('Feature'),
    geometry: geometrySchema,
    id: idSchema,
    properties: propertiesSchema,
  });
```

### Route Types

Navigation routes are fully typed using React Navigation's type system:

```tsx
export type HomeStackParamList = {
  avalancheCenter: {center_id: AvalancheCenterID; requestedTime: RequestedTimeString};
  forecast: {center_id: AvalancheCenterID; forecast_zone_id: number; requestedTime: RequestedTimeString};
  observation: {id: string};
};
export type HomeStackNavigationProps = NativeStackNavigationProp<HomeStackParamList>;
```

### Unused Variables

Prefix unused variables with `_` (enforced by ESLint):

```tsx
const [_unused, setUseful] = useState(false);
```

### File and Component Naming

- **Components and files**: PascalCase (`ForecastScreen.tsx`, `QueryState.tsx`)
- **Hooks**: `use` prefix, camelCase (`useAvalancheForecast.ts`)
- **Constants**: SCREAMING_SNAKE_CASE
- **Test files**: colocated with source as `*.test.ts` or `*.test.tsx`

## Navigation

### Structure

React Navigation v6 with a bottom tab navigator containing four tabs:

```
TabNavigator
  Home -> HomeStack (MapScreen, ForecastScreen, weather/observation details)
  Observations -> ObservationsStack (portal, list, detail, submit)
  Weather Data -> WeatherStack (station list, detail)
```

Each tab has its own native stack navigator. The forecast detail view uses material top tabs for sub-sections (avalanche, weather, observations, blog).

### Typed Navigation

All navigators use typed param lists from `routes.ts`. Route params are accessed via typed screen props:

```tsx
export const MapScreen = ({route}: NativeStackScreenProps<HomeStackParamList, 'avalancheCenter'>) => {
  const {center_id, requestedTime} = route.params;
};
```

### Deep Linking

The app supports deep linking for NWAC observation URLs. Links with `/observations/` paths are routed to the Observations tab with observation detail screens. Share parameters are injected for link tracking.

## Testing

### Framework

Jest with `jest-expo` preset. Key test dependencies:

- `@testing-library/react-native` for component tests
- `@testing-library/react-hooks` for hook tests
- `timezone-mock` for timezone-sensitive tests
- `jest-transform-stub` for static asset stubbing

### Jest Configuration

Setup files mock common native modules:

- `tests/setupAsyncStorage.ts` - Mocks AsyncStorage
- `tests/mockNetInfo.ts` - Mocks NetInfo with `mockGoOnline()`/`mockGoOffline()` helpers
- `tests/mockSentry.ts` - Mocks Sentry `init` and `captureException`

### Test Patterns

**Unit tests** with `describe`/`it` blocks:

```tsx
describe('apiDateString', () => {
  it('renders into the expected format', () => {
    const d = new Date('2023-01-19T02:00:00Z');
    expect(apiDateString(d)).toEqual('2023-01-19');
  });
});
```

**Component tests** with React Native Testing Library:

```tsx
render(<View width={100} height={'100%'} testID="foo" />);
const view = screen.getByTestId('foo');
expect(view.props.style).toEqual([...]);
```

**Hook tests** with `renderHook`:

```tsx
const {result, waitForNextUpdate} = renderHook(() => usePreferences(), {wrapper: PreferencesProvider});
expect(result.current.preferences.center).toEqual('NWAC');
await waitForNextUpdate();
```

**Parametrized tests** with `test.each`:

```tsx
test.each(['2023-12-14', '2023/12/14', '2023:12:14'])(`should return null for format: %s`, DateTimeOriginal => {
  expect(captureDateFromExif({DateTimeOriginal})).toBeNull();
});
```

**Timezone testing** with setup/teardown:

```tsx
TimezoneMock.register('US/Pacific');
// ... assertions ...
afterEach(() => TimezoneMock.unregister());
```

### Test Locations

Test files are colocated with the code they test:

- `utils/date.test.ts` tests `utils/date.ts`
- `components/core/View.test.tsx` tests the View component
- `types/nationalAvalancheCenter/tests/` for type/schema tests

### Running Tests

```bash
yarn test                 # Run all tests
yarn test <pattern>       # Run specific test (e.g., yarn test date.test)
```

## Linting and Formatting

### ESLint

Config in `.eslintrc.json`. Key rules:

| Rule                                     | Setting | Rationale                                     |
| ---------------------------------------- | ------- | --------------------------------------------- |
| `react/jsx-no-bind`                      | `error` | No inline functions in JSX; use `useCallback` |
| `absolute-imports/only-absolute-imports` | `error` | No relative imports                           |
| `no-console`                             | `error` | Use the logger from `LoggerContext`           |
| `@typescript-eslint/no-unused-vars`      | `warn`  | Allowed with `_` prefix                       |

Extended configs: `eslint:recommended`, `@typescript-eslint/recommended`, `@typescript-eslint/recommended-requiring-type-checking`, `react/recommended`, `react-hooks/recommended`.

CI runs ESLint with `--max-warnings=0`, treating warnings as errors.

### Prettier

Config in `.prettierrc.js`:

```js
{
  arrowParens: 'avoid',
  bracketSameLine: true,
  bracketSpacing: false,
  singleQuote: true,
  trailingComma: 'all',
  printWidth: 180,
}
```

### Pre-commit

Husky runs the full CI suite as a pre-commit hook: prettier, eslint, tsc, and tests. Run `yarn prettify` before committing to auto-fix formatting and lint issues.

### CI

GitHub Actions runs four checks as separate jobs:

1. `yarn ci:prettier` - Formatting
2. `yarn ci:eslint` - Lint rules
3. `yarn ci:tsc` - TypeScript compilation
4. `yarn test` - Jest tests

Run all locally with `yarn ci`.

## Imports

### Absolute Imports Only

The project enforces absolute imports (ESLint rule `absolute-imports/only-absolute-imports`). The `baseUrl` in `tsconfig.json` is set to `./`, and Babel's `module-resolver` plugin resolves them at runtime:

```tsx
// GOOD
import {View, VStack} from 'components/core';
import {colorLookup} from 'theme';
import {safeFetch} from 'hooks/fetch';

// BAD
import {View} from '../core/View';
import {colorLookup} from '../../theme';
```

### Import Organization

Imports are grouped by convention (not enforced):

1. React and React Native
2. Third-party libraries (`@tanstack`, `axios`, `zod`, etc.)
3. Internal modules (components, hooks, types, utils, theme)
