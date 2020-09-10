const fetch = require("node-fetch");
const base64 = require("Base64");

const path = "./keys.js";
let keys = { GH_TOKEN: "", FS_CRED: "", FS_URL: "", VOC_CRED: "", VOC_URL: "" };
keys = require(path);

let PR_ID = "";

const originBranch = process.argv[2] || "develop";
const reppo = process.argv[3] || "cxs-client";

const QUERY = (after = false) => `{
  repository(name: "${reppo}", owner: "foreseecode") {
    pullRequests(last: 1, headRefName: "${originBranch}", states: OPEN) {
      nodes {
        id
        number
        title
        commits(first: 100${after ? `, after: "${after}"` : ""}) {
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

const data = (query) =>
  `{ "query": "${query
    .replace(/\"/g, '\\"')
    .replace(/\n/g, " ")
    .replace(/  /g, " ")
    .replace(/  /g, " ")}" }`;

async function postDataGH(data = {}) {
  const options = {
    method: "POST",
    headers: {
      "user-agent": "luksm",
      Authorization: `bearer ${keys.GH_TOKEN}`,
    },
    body: data,
  };
  const response = await fetch("https://api.github.com/graphql", options);
  return response;
}

async function postDataJIRA(ticket = "") {
  jiraCredential = keys.VOC_CRED;
  jiraUrl = keys.VOC_URL;
  team = keys.VOC.team;
  codeLocation = keys.VOC.codeLocation;

  const url = `https://${jiraUrl}/rest/api/2/issue/${ticket}?fields=fixVersions,status,${team},${codeLocation}`;
  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: "Basic " + base64.btoa(jiraCredential),
      "Content-Type": "application/json",
    },
  });
  return response;
}

async function getCommits() {
  const handleFetch = async (after) => {
    return postDataGH(data(QUERY(after)))
      .then((response) => response.json())
      .then(async (response) => {
        const pr = response.data.repository.pullRequests.nodes[0];
        PR_ID = pr.id;
        console.log(`#${pr.number} ${pr.title}`);
        if (pr.commits.pageInfo.hasNextPage) {
          const moreNodes = await handleFetch(pr.commits.pageInfo.endCursor);
          return [...pr.commits.nodes, ...moreNodes];
        }
        return pr.commits.nodes;

        // return response.data.repository.pullRequest.commits.nodes;
      });
  };

  const commits = await handleFetch();

  return commits.map((data) => data.commit.messageHeadline);
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
      const {
        fixVersions = [{ name: "" }],
        status = { name: "" },
        [keys.VOC.team]: team = { value: "" },
        [keys.VOC.codeLocation]: codeLocation = { value: "" },
      } = fields;
      return {
        key,
        status: status.name,
        fixVersions: fixVersions.map((version) => version.name).join(","),
        squad: team.value,
        codeLocation: codeLocation.value,
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
  const url = keys.VOC_URL;
  return `[${ticket}](https://${url}/browse/${ticket})`;
}

function formatTable(tickets) {
  let response = [];
  response.push("Jira Ticket | Fix Version | Status | Squad | Code Location");
  response.push("----------- | ----------- | ------ | ----- | -------------");
  tickets.forEach(({ key, status, fixVersions, squad, codeLocation }) =>
    response.push(
      `${getTicketUrl(
        key
      )} | ${fixVersions} | ${status} | ${squad} | ${codeLocation}`
    )
  );
  return response;
}

console.log(new Date().toString());
getCommits()
  .then(getTicketsFromCommits)
  .then(getJiraInfo)
  .then(formatTable)
  .then((commits) => commits.join("\\r\\n"))
  .then((PR_BODY) => MUTATION({ PR_ID, PR_BODY }))
  .then((change) =>
    postDataGH(data(change)).then((response) => response.json())
  );
