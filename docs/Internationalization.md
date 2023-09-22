# i18n / l10n

_These are very basic docs, please enhance them_

We do the following:

1. **define** messages using instances of `FormattedMessage`
2. **extract** messages from code into JSON in `lang/en.json`
3. (optionally) **translate** messages into other languages, e.g. `lang/fr.json` (maybe this never happens)
4. **compile** messages into a more efficient format in `compiled-lang/en.json`
5. **load** the messages into an `IntlProvider` at the top of the React tree

## 1. Using FormatMessage

Define your string using MessageFormat syntax in a FormattedMessage component

```jsx
<FormattedMessage
  description="How many observations were found"
  defaultMessage="{count, plural,
=0 {No matching observations in this time period}
one {One matching observation in this time period}
other {# matching observations in this time period}}"
  values={{
    count: displayedObservations.length,
  }}
/>
```

## 2. Extract messages

Run `yarn intl:extract`. This scans source looking for FormattedMessage tags and pulls them out to JSON. Check in the result.

## 3. Translate messages

Let's worry about this when we have the problem, but basically you'd send `en.json` off to a translator and get a bunch of `<lang>.json` files back

## 4. Compile messages

Run `yarn intl:compile` to compile all the `lang` JSON files into `compiled-lang`. Check in the result.

## 5. Load messages

Message data is loaded in App.tsx. It's all hard-coded to use the `en` locale for now, but could be dynamic.

---

# Implementation details

We're using [FormatJS](https://formatjs.io). There are [polyfills](https://formatjs.io/docs/polyfills) applied as well in App.tsx. Note that the polyfills are _order-dependent_ with respect to each other, so change them carefully, or don't change them at all.
