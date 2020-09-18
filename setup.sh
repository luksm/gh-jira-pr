#!/bin/bash

echo "Please enter your credentials"
echo ""
echo "What is your Git Hub API Key"
read GH_KEY

echo "What is the JIRA URL"
read JIRA_URL

echo "What is your JIRA API User"
read JIRA_USER

echo "What is your JIRA API Key"
read JIRA_KEY

echo """
const GH_TOKEN = \"$GH_KEY\";
const VOC_CRED = \"$JIRA_USER:$JIRA_KEY\";
const VOC_URL = \"$JIRA_URL\";

module.exports = {
  GH_TOKEN: GH_TOKEN || \"\",
  VOC_CRED: VOC_CRED || \"\",
  VOC_URL: VOC_URL || \"\",
  VOC: {
    jiraCredential: VOC_CRED,
    jiraUrl: VOC_URL,
    team: \"customfield_15001\",
    qa: \"customfield_10296\",
    storypoints: \"customfield_11211\",
    codeLocation: \"customfield_18106\",
  },
};
""" > keys.js
