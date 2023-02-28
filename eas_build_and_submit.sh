#!/bin/bash

sed -i 's/IOS_USER_ID/${IOS_USER_ID}/g' eas.json
sed -i 's/IOS_TEAM_ID/${IOS_TEAM_ID}/g' eas.json
sed -i 's/IOS_APP_ID/${IOS_APP_ID}/g' eas.json

eas build --non-interactive --platform all --profile ${GITHUB_REF##*/} --auto-submit
