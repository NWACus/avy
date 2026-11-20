# Getting involved

Since you have landed on this page, we assume that you want to help us with Avy. Amazing. We love it.

You can start by looking at our list of issues. We do our best to keep the tags on those updated best we can. If you see an issue that you want to tackle, feel free to fork the repo and suggest a PR to fix/add the issues. One of the developers of the project should respond within a few days. If the issue is not assigned to someone, it means no one is currently working on it.

Things to look at and get engaged on:

- [Good first issues](https://github.com/NWACus/avy/labels/good%20first%20issue)
- [Bugs](https://github.com/NWACus/avy/labels/bug)

If you found an issue you'd like to work on but need more context, it is best to ask questions directly in the issue. The repo issues are monitored by volunteers and NWAC staff who would be able to help provide more details when needed.

You can email us at developer@nwac.us to request to be added to our Slack channel where you can sign up to help with larger issues with a more specific timeline and talk with other volunteers who are helping out with Avy.

Lastly, please fill out the form linked at the [bottom of this page](https://nwac.us/technology-volunteer-outreach/) so we know who you are and what you're interested in!

# Development

See [Local development](docs/local-development.md) to get the app running, and [Debugging](docs/debugging.md) for DevTools and logging.

# Working from a fork

Volunteers: please fork the repo, work on a branch in your fork, and open PRs from there against `NWACus/avy`. You don't need access to the Expo project. If you need shared secret values, ask developer@nwac.us or the Slack volunteer channel.

# Checking in code

CI checks formatting, linting, types, and tests, and a pre-commit hook runs the same checks. Before committing, run:

```bash
yarn prettify
```

Open a PR against `NWACus/avy` and fill out the template. NWAC staff or another volunteer will review it.
