#!/bin/bash





MONTH=$(date -d '+1 months' +%-m)
YEAR=$(date -d '+1 months' +%-y)

defaultRepo="cxs-client"
defaultRelease="$YEAR.$MONTH"

echo "Release Log Generator"
echo ""

read -p "What is your project [$defaultRepo]: " REPO
: ${REPO:=$defaultRepo}

read -p "What is the release branch release/[$defaultRelease]: " BRANCH
: ${BRANCH:=$defaultRelease}

echo "Let's check $REPO @ release/$BRANCH"

cd ../cxs-client
git lg release/$BRANCH...master > ~/workspace/gh-jira-pr/diff
cd ../gh-jira-pr
node release.js > rel
cat rel


