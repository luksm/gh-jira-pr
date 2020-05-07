const fetch = require("node-fetch");
const base64 = require("Base64");

const fs = require("fs");

const path = "./keys.js";
let keys = { GH_TOKEN: "", FS_CRED: "", FS_URL: "", VOC_CRED: "", VOC_URL: "" };
keys = require(path);

let PR_ID = "";

let QUERY = `query {
  repository(name: "cxs-client", owner: "foreseecode") {
    pullRequests(last: 10, headRefName: "develop", states: OPEN) {
      nodes {
        id
        number
        title
        commits(first: 100) {
          nodes {
            commit {
              messageHeadline
              id
            }
          }
          pageInfo {
            endCursor
            hasNextPage
            hasPreviousPage
            startCursor
          }
        }  
      }
    }
  }
}`;

const MUTATION = ({ PR_ID, PR_BODY }) => `mutation MyMutation {
  updatePullRequest(input: {pullRequestId: \"${PR_ID}\", body: \"${PR_BODY}\"}) {
    pullRequest {
      body
    }
  }
}`;

const data = (query) => `
{
    "query": "${query
      .replace(/\"/g, '\\"')
      .replace(/\n/g, " ")
      .replace(/  /g, " ")
      .replace(/  /g, " ")}"
}
`;

async function postDataGH(data = {}) {
  const response = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      "user-agent": "luksm",
      Authorization: `bearer ${keys.GH_TOKEN}`,
    },
    body: data,
  });
  return response;
}

async function postDataJIRA(ticket = "") {
  let jiraCredential = keys.FS_CRED;
  let jiraUrl = keys.FS_URL;
  let team = "customfield_11825";

  if (ticket.indexOf("VOC") !== -1) {
    jiraCredential = keys.VOC_CRED;
    jiraUrl = keys.VOC_URL;
    team = "customfield_15001";
  }

  const url = `https://${jiraUrl}/rest/api/2/issue/${ticket}?fields=fixVersions,status,${team}`;
  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: "Basic " + base64.btoa(jiraCredential),
      "Content-Type": "application/json",
    },
  });
  return response;
}

function getCommits() {
  return postDataGH(data(QUERY))
    .then((response) => response.json())
    .then((response) => {
      const pr = response.data.repository.pullRequests.nodes[0];
      PR_ID = pr.id;
      console.log(`#${pr.number} ${pr.title}`);
      return pr.commits.nodes;
      // return response.data.repository.pullRequest.commits.nodes;
    })
    .then((data) => data.map((data) => data.commit.messageHeadline));
}

async function getJiraInfo(tickets) {
  const stats = [];
  await tickets.forEach((ticket) => {
    stats.push(
      postDataJIRA(ticket)
        .then((response) => response.json())
        .catch((err) => console.error(err))
    );
  });
  return Promise.all(stats).then((tickets) => {
    return tickets.map((ticket) => {
      const { key, fields = {} } = ticket;
      const { fixVersions = [], status, ...squad } = fields;
      const squadField = Object.keys(squad);
      return {
        key,
        status: status.name,
        fixVersions: fixVersions[0] && fixVersions[0].name,
        squad: squad[squadField].value,
      };
    });
  });
}

function getTicketsFromCommits(commits = []) {
  return commits
    .map((commit) => commit.match(/(?<ticket>([A-Z]+)-([0-9]+))/g))
    .filter((result) => result)
    .map((commit) => {
      if (Array.isArray(commit)) {
        return commit;
      }
      return commit.groups.ticket;
    })
    .flatMap((ticket) => ticket)
    .reduce((acc, ticket) => acc.add(ticket), new Set());
}

function getTicketUrl(ticket) {
  const url = ticket.indexOf("VOC") === -1 ? keys.FS_URL : keys.VOC_URL;
  return `[${ticket}](https://${url}/browse/${ticket})`;
}

function formatTable(tickets) {
  let response = [];
  response.push("Jira Ticket | Fix Version | Status | Squad");
  response.push("----------- | ----------- | ------ | ------");
  tickets.forEach(({ key, status, fixVersions, squad }) =>
    response.push(
      `${getTicketUrl(key)} | ${fixVersions} | ${status} | ${squad}`
    )
  );
  return response;
}

getCommits()
  .then(getTicketsFromCommits)
  // .then(console.log);
  .then(getJiraInfo)
  .then(formatTable)
  .then((commits) => commits.join("\\r\\n"))
  .then((PR_BODY) => MUTATION({ PR_ID, PR_BODY }))
  .then((change) =>
    postDataGH(data(change)).then((response) => response.json())
  )
  .then(console.log);
