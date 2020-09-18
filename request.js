const fetch = require("node-fetch");
const base64 = require("Base64");

const path = "./keys.js";
let keys = { GH_TOKEN: "", VOC_CRED: "", VOC_URL: "" };
keys = require(path);

let PR_ID = "";

const originBranch = process.argv[2] || "develop";
const reppo = process.argv[3] || "cxs-client";

/**
 * Creates the Graphql query with the desired information
 *
 * In order to page results, add the `after` param with the starting commit id
 *
 * @param {string} after - Starting commit id
 */
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

/**
 * Creates the Graphql mutation with the desired to update the PR
 *
 * @param {object} pullRequest - Pull request information
 * @param {string} pullRequest.PR_ID - Pull Request ID
 * @param {string} pullRequest.PR_BODY -  Pull Request Body
 */
const MUTATION = ({ PR_ID, PR_BODY }) => `mutation MyMutation {
  updatePullRequest(input: {pullRequestId: \"${PR_ID}\", body: \"${PR_BODY}\"}) {
    pullRequest {
      body
    }
  }
}`;

/**
 * Formats query so we can use it in a request
 *
 * @param {string} query
 * @returns {string} formatted query
 */
const data = (query) =>
  `{ "query": "${query
    .replace(/\"/g, '\\"')
    .replace(/\n/g, " ")
    .replace(/  /g, " ")
    .replace(/  /g, " ")}" }`;

/**
 * Post requests to GH API
 *
 * Since we are using GH GraphQL API, all of our requests are always POST
 *
 * @param {object} data - Body data to be posted
 * @returns {object} API Response
 */
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

/**
 * This function is used to fetch data from Jira tickets
 *
 * We read from keys.js the information to create the URL
 *
 * @param {string} ticket - Ticket Key we'll be fetchin data from
 * @returns {object} API Response
 */
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

/**
 * Get the all the commits present in a Pull Request
 *
 * @returns list of commit message summaries
 */
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

/**
 * Extract information from JIRA request
 *
 * Here we go through the list of tickets and get all the information we need
 *
 * @param {string[]} tickets - List of tickets to get information from
 * @returns {object[]} List with the desired informaton from JIRA
 */
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
        codeLocation: codeLocation !== null ? codeLocation.value : "",
      };
    });
  });
}

/**
 * Moves throught the list of commits in this PR and filter out any that have
 * the correct structure to so we can get the information from JIRA.
 *
 * Multiple commits can have the same ticket number, so we create a new set and
 * return only one instance of each ticket
 *
 * @param {string[]} commits - List of all commits that are in the PR
 * @returns {object[]} List of ticket numbers that we'll get information from
 */
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

/**
 * Formats a list of tickets into a markdown table
 * @param {Object[]} tickets - List of tickets to format
 * @param {string} ticket.key - Key of the ticket
 * @param {string} ticket.status - Current Status of the Ticket
 * @param {string} ticket.fixVersions - What fix version does this belong to
 * @param {string} ticket.squad - What Squad is working on it
 * @param {string} ticket.codeLocation - Wher is this already deployed
 * @returns {string} Markdown table
 */
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
