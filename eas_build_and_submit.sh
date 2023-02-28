#!/bin/bash

sed -i 's/$IOS_USER_ID/${{ secrets.IOS_USER_ID }}/g' eas.json
sed -i 's/$IOS_TEAM_ID/${{ secrets.IOS_TEAM_ID }}/g' eas.json
sed -i 's/$IOS_APP_ID/${{ secrets.IOS_APP_ID }}/g' eas.json

eas build --non-interactive --platform all --profile production --auto-submit
