# Developer Environment

This project uses the Expo framework; follow their excellent [installation guide](https://docs.expo.dev/get-started/installation/) to get a development environment set up. You'll need to [sign up for an account](https://expo.dev/signup) and get invited to the [project](https://expo.dev/accounts/steve.kuznetsov/projects/avalanche-forecast).

We use the following global packages:

```
npm install -g npm@8.19.3 yarn@1.22.10
```

## Local Secrets

For development, you will need a number of environment variables set to secret values. The canonical approach is to store them in a `.env` file at the root of the repository. Make sure to provide the following values:

- `ANDROID_GOOGLE_MAPS_API_KEY`
- `IOS_GOOGLE_MAPS_API_KEY`
- `SENTRY_API_TOKEN`
- `SENTRY_DSN`

# NAC Staging Access

Register for a new account at http://centers.avalanche.org/ under the NWAC center, forward this request to Chris Lundy.

Then, that dashboard will allow for full write and read access to the staging dataset for the NWAC center.
