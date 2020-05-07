const fetch = require("node-fetch");
const base64 = require("Base64");

function log(message) {
  return false;
  //   console.log(message);
}

const path = "./keys.js";
let keys = { GH_TOKEN: "", FS_CRED: "", FS_URL: "", VOC_CRED: "", VOC_URL: "" };
keys = require(path);

async function getJIRASprint({ jiraCredential, jiraUrl, boardId }) {
  let url = `https://${jiraUrl}/rest/agile/1.0/board/${boardId}/sprint?state=ACTIVE`;
  return await fetch(url, {
    method: "GET",
    headers: {
      Authorization: "Basic " + base64.btoa(jiraCredential),
      "Content-Type": "application/json",
    },
  })
    .then((response) => {
      //   console.log(response.status, url);
      return response.json();
    })
    .then((response) => response.values[0].id);
}

async function getJIRATickets({
  jiraCredential,
  jiraUrl,
  team,
  sprint,
  qa,
  storypoints,
  startAt = 0,
}) {
  let url = `https://${jiraUrl}/rest/api/3/search?jql=Sprint=${sprint}&startAt=${startAt}&maxResults=100&fields=key,summary,assignee,${qa},status,${storypoints},fixVersions,${team}`;
  return fetch(url, {
    method: "GET",
    headers: {
      Authorization: "Basic " + base64.btoa(jiraCredential),
      "Content-Type": "application/json",
    },
  })
    .then((response) => {
      log(response.status, url);
      return response.json();
    })
    .then(async (response) => {
      log(
        `Do we need more ? There are ${response.total} issues and we are at ${
          response.startAt + response.maxResults
        }`
      );
      if (response.startAt + response.maxResults < response.total) {
        const more = await getJIRATickets({
          jiraCredential,
          jiraUrl,
          team,
          sprint,
          qa,
          storypoints,
          startAt: response.maxResults + 1,
        });
        return {
          ...response,
          issues: [...response.issues, ...more.issues],
        };
      }
      return response;
    });
}

function standardizeFields(tickets, { jiraUrl, team, qa, storypoints }) {
  return tickets.map((ticket) => ({
    key: ticket.key,
    link: `https://${jiraUrl}/browse/${ticket.key}`,
    summary: ticket.fields.summary,
    assignee: ticket.fields.assignee && ticket.fields.assignee.displayName,
    qa: ticket.fields[qa] && ticket.fields[qa].displayName,
    status: ticket.fields.status && ticket.fields.status.name,
    storypoints: ticket.fields[storypoints],
    fixVersions: ticket.fields.fixVersions.length
      ? ticket.fields.fixVersions[ticket.fields.fixVersions.length - 1].name
      : "",
    team: ticket.fields[team] && ticket.fields[team].value,
  }));
}

function toMarkDown(response) {
  const res = [Object.keys(response[0]).join(" | ")];
  res.push(
    `| ${Object.keys(response[0])
      .map(() => " -- |")
      .join("")}`
  );
  response.forEach((element) => {
    res.push(Object.values(element).join(" | "));
  });
  console.log(res.join("\n"));
}

function toHtml(response) {
  const res = [
    `<table data-layout=\"wide\"><thead><tr><th><strong>${[
      [
        "Key",
        "Summary",
        "Assignee",
        "QA",
        "Status",
        "Story Points",
        "Fixed Version",
      ].join("</strong></th><th><strong>"),
    ]}</strong></th></tr></thead><tbody>`,
  ];
  response.forEach((element) => {
    const { link, key, team, ...rest } = element;
    res.push(
      `<tr><td>${[`<a href="${link}">${key}</a>`, ...Object.values(rest)].join(
        "</td><td>"
      )}</td></tr>`
    );
  });
  res.push("</tbody></table>");
  console.log(res.join("").replace(/\"/g, '\\"'));
}

async function main() {
  Promise.all([
    getJIRATickets({
      sprint: await getJIRASprint(keys.FS),
      ...keys.FS,
    }).then((response) => standardizeFields(response.issues, keys.FS)),
    getJIRATickets({
      sprint: await getJIRASprint(keys.VOC),
      ...keys.VOC,
    }).then((response) => standardizeFields(response.issues, keys.VOC)),
  ])
    .then((response) => response.flatMap((res) => res))
    // .then(toMarkDown);
    .then(toHtml);
  // .then((response) => console.log(JSON.stringify(response)));
}

main();
