# Getting involved

Since you have landed on this page, we assume that you want to help us with Avy. Amazing. We love it. 

You can start by looking at our list of issues. We do our best to keep the tags on those updated best we can. If you see an issue that you want to tackle, feel free to fork the repo and suggest a PR to fix/add the issues. One of the developers of the project should respond within a few days. If the issue is not assigned to someone, it means no one is currently working on it. 

Things to look at and get engaged on: 
- [Good first issues](https://github.com/NWACus/avy/labels/good%20first%20issue)
- [Bugs](https://github.com/NWACus/avy/labels/bug)

If you found an issue you'd like to work on but need more context, it is best to ask questions directly in the issue. The repo issues are monitored by volunteers and NWAC staff who would be able to help provide more details when needed.

You can request to be added to our where you can ask questions, sign up to help with larger issues with a more specific timeline and talk with other volunteers who are helping out with Avy. 

Lastly, please fill out the form linked at the [bottom of this page](https://nwac.us/technology-volunteer-outreach/) so we know who you are and what you're interested in!

# Developer Environment

This project uses the Expo framework; follow their excellent [installation guide](https://docs.expo.dev/get-started/installation/) to get a development environment set up. 

If you plan to build the app to run outside of expo go or will need to particiapte in the app publishing process, you'll need to [sign up for an account](https://expo.dev/signup) and get invited to the [project](https://expo.dev/accounts/steve.kuznetsov/projects/avalanche-forecast). If you do not need to do either of those things, you will not need access to the project to proceed with development. 

We use the following global packages:

```
npm install -g npm@8.19.3 yarn@1.22.10
```

Currently the team primarily uses expo go when debugging/testing issues inside an Android emulator. We have a test app set on both Anroid and Apple up for changes that cannot be tested inside the expo go enviorment. 

## Local Secrets

For development, you will need a number of environment variables set to secret values. The canonical approach is to store them in a `.env` file at the root of the repository. Make sure to provide the following values:

- `ANDROID_GOOGLE_MAPS_API_KEY`
- `IOS_GOOGLE_MAPS_API_KEY`
- `SENTRY_API_TOKEN`
- `EXPO_PUBLIC_SENTRY_DSN`

These secrets can be uploaded to the Expo servers if they ever become out-of-sync with:

```shell
eas secret:push --env-file=.env
```

If you do not wish to populate your own values, reach out to developer@nwac.us for our test values or reach out to us through our slack volunteer channel. 

## Logging

The log level for our logger is set with `$LOG_LEVEL`, the default is `'info'` but it needs to be `'debug'` for the below network bits.

Runtime logging can be enabled in development mode by running `npx expo start` with the following environment variables set:

`$LOG_NETWORK`:

- `'queries'`: queries issues to `react-query` will be logged along with their query keys; note that these may be fulfilled by the cache
- `'requests'`: outgoing requests using `axios` will be logged
- `'responses'`: incoming responses using `axios` will be logged along with their result status code
- `'response-bodies'`: incoming response bodies using `axios` will be logged
- `'all'`: all of the above will be logged

`$LOG_NETWORK_MATCHING`: the value of this variable will be used to filter what is logged, using simple sub-string matches on the formatted URL with query parameters (e.g. `url.includes(log_network_matching)`).

# NAC Staging Access

This is not required to do development on the app, however if you are going to working with someting that involves the NAC API, for example Observation submission, it would be important to have access to this. Before requesting for NAC staging access, check with someone at NWAC that it makes sense for you to do so.
