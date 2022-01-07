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

currentBranch=$(git rev-parse --abbrev-ref HEAD)

cd ../$REPO
git stash > /dev/null 2> /dev/null
git checkout release/$BRANCH > /dev/null 2> /dev/null
git pull origin release/$BRANCH > /dev/null 2> /dev/null
git checkout master > /dev/null 2> /dev/null
git pull origin master > /dev/null 2> /dev/null
git lg release/$BRANCH...master > ~/workspace/gh-jira-pr/diff
git checkout $currentBranch > /dev/null 2> /dev/null
git stash pop > /dev/null 2> /dev/null
cd ../gh-jira-pr
node release.js > rel
cat rel
