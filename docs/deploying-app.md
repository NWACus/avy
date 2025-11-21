# Deploying Updates to a React Native App Using Expo

This guide explains how to deploy updates to Avy's React Native app using **EAS (Expo Application Services)**. It covers when to create a new app version versus when to use an **Over-the-Air (OTA)** update, and the actions involved. 

---

## When to Use OTA Updates vs. New Version

### ✅ OTA Update
Use OTA updates when:
- You are making **JavaScript-only changes** (e.g., UI tweaks, bug fixes, text changes).
- No changes to **native code**, **dependencies**, or **assets that require a new build**.
- The update is compatible with the currently installed binary.

**Example:** Fixing a typo or adjusting styles.

---

### ✅ New Version (New Build)
Create a new version when:
- You update **native dependencies** (e.g., adding a new library that requires native code).
- You change **app.json/app.config.js** settings that affect the build.
- You upgrade **React Native**, **Expo SDK**, or any dependency that impacts the native layer.
- You modify **assets** that are bundled at build time (e.g., fonts, images).

**Example:** Adding a new native module or upgrading Expo SDK.

When adding a new version you must manually bump the version +1 in [app.json](https://github.com/NWACus/avy/blob/main/app.json#L6). This is required to be able to publish a new version on IOS, if the version is not bumped IOS won't let you submit the app for review. 

---

## Prerequisites
Proper contributor access to this repo is all you need to run publish-build or publish-update github actions.

Before running any build or deployment commands locally, ensure you have:
- **Access to the NWAC Expo account**.
- **EAS CLI installed** locally (`npm install -g eas-cli`).
- **Expo credentials** configured (run `eas login`).

---

## Preview app

Currently we have an Avy Preview app which we use specifically for testing. We do not intend to ever submit this app for review on either app stores. The version is hardcoded to always be 1.0.0, only build number gets auto incremented with every update. It is preferred that build numbers on both stores are aligned, occasionally they get out of sync and need to be brought back in sync manually. 

We used to leverage Test Flight on IOS and internal testing within the production Avy app but ultimately decided it was nicer to have a whole different app, since you could only have either the Test flight/Internal Test or the Production app installed. With a separate Preview app, the apps can exist side by side.

---

## Deployment Steps

The usual workflow to get updates and new features released on the app is as follows. Sometimes we check stuff in preview and push to release almost right after, in other cases we may have changes in preview for weeks before they make it into release. 

You can log into expo to see errors or more specific in-progress updates for builds and submissions to stores. 

### 1. Publish OTA (Over-the-Air) or New Build Update to preview

Most commonly, copy changes from main into preview branch first using the following set of commands to ensure preview is pointing to the latest commit we want deployed: 

`git fetch origin; git checkout preview; git reset --hard origin/main; git push origin preview`

Navigate to github actions inside repo and run "publish-update" for an OTA update and "publish-build" for a new Build version. Select "preview" for branch and then press run workflow. 

### 2. Ensure app is working as expected in preview

Wait for the github action to complete, ensure the new version exists on preview, run basic tests to ensure everything in the app is working correctly. 

### 3. Publish OTA (Over-the-Air) or New Build Update to release

Once updates have been tested and verified, you will repeat the exact same process done in step 1, but instead you will be working with the "release" branch. 

When publishing a new build version, a new app submission to both stores will be required. This step is manual and needs to be done once the github action completes. You will need to navigate to Apple and Android stores to complete the submission for review, review usually takes about 1-2 days on average. 

## Logs and Monitoring

We have Sentry sending alerts to Slack for the following two cases:
- send message to #sentry-alerts-all channel for each exception
- send message to a #sentry-alerts-specific channel if an exception is impacting more then 20 users
