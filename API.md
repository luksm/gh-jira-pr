## Functions

<dl>
<dt><a href="#QUERY">QUERY(after)</a></dt>
<dd><p>Creates the Graphql query with the desired information</p>
<p>In order to page results, add the <code>after</code> param with the starting commit id</p>
</dd>
<dt><a href="#MUTATION">MUTATION(pullRequest)</a></dt>
<dd><p>Creates the Graphql mutation with the desired to update the PR</p>
</dd>
<dt><a href="#data">data(query)</a> ⇒ <code>string</code></dt>
<dd><p>Formats query so we can use it in a request</p>
</dd>
<dt><a href="#postDataGH">postDataGH(data)</a> ⇒ <code>object</code></dt>
<dd><p>Post requests to GH API</p>
<p>Since we are using GH GraphQL API, all of our requests are always POST</p>
</dd>
<dt><a href="#postDataJIRA">postDataJIRA(ticket)</a> ⇒ <code>object</code></dt>
<dd><p>This function is used to fetch data from Jira tickets</p>
<p>We read from keys.js the information to create the URL</p>
</dd>
<dt><a href="#getCommits">getCommits()</a> ⇒</dt>
<dd><p>Get the all the commits present in a Pull Request</p>
</dd>
<dt><a href="#getJiraInfo">getJiraInfo(tickets)</a> ⇒ <code>Array.&lt;object&gt;</code></dt>
<dd><p>Extract information from JIRA request</p>
<p>Here we go through the list of tickets and get all the information we need</p>
</dd>
<dt><a href="#getTicketsFromCommits">getTicketsFromCommits(commits)</a> ⇒ <code>Array.&lt;object&gt;</code></dt>
<dd><p>Moves throught the list of commits in this PR and filter out any that have
the correct structure to so we can get the information from JIRA.</p>
<p>Multiple commits can have the same ticket number, so we create a new set and
return only one instance of each ticket</p>
</dd>
<dt><a href="#formatTable">formatTable(tickets)</a> ⇒ <code>string</code></dt>
<dd><p>Formats a list of tickets into a markdown table</p>
</dd>
</dl>

<a name="QUERY"></a>

## QUERY(after)
Creates the Graphql query with the desired information

In order to page results, add the `after` param with the starting commit id

**Kind**: global function  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| after | <code>string</code> | <code>false</code> | Starting commit id |

<a name="MUTATION"></a>

## MUTATION(pullRequest)
Creates the Graphql mutation with the desired to update the PR

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| pullRequest | <code>object</code> | Pull request information |
| pullRequest.PR_ID | <code>string</code> | Pull Request ID |
| pullRequest.PR_BODY | <code>string</code> | Pull Request Body |

<a name="data"></a>

## data(query) ⇒ <code>string</code>
Formats query so we can use it in a request

**Kind**: global function  
**Returns**: <code>string</code> - formatted query  

| Param | Type |
| --- | --- |
| query | <code>string</code> | 

<a name="postDataGH"></a>

## postDataGH(data) ⇒ <code>object</code>
Post requests to GH API

Since we are using GH GraphQL API, all of our requests are always POST

**Kind**: global function  
**Returns**: <code>object</code> - API Response  

| Param | Type | Description |
| --- | --- | --- |
| data | <code>object</code> | Body data to be posted |

<a name="postDataJIRA"></a>

## postDataJIRA(ticket) ⇒ <code>object</code>
This function is used to fetch data from Jira tickets

We read from keys.js the information to create the URL

**Kind**: global function  
**Returns**: <code>object</code> - API Response  

| Param | Type | Description |
| --- | --- | --- |
| ticket | <code>string</code> | Ticket Key we'll be fetchin data from |

<a name="getCommits"></a>

## getCommits() ⇒
Get the all the commits present in a Pull Request

**Kind**: global function  
**Returns**: list of commit message summaries  
<a name="getJiraInfo"></a>

## getJiraInfo(tickets) ⇒ <code>Array.&lt;object&gt;</code>
Extract information from JIRA request

Here we go through the list of tickets and get all the information we need

**Kind**: global function  
**Returns**: <code>Array.&lt;object&gt;</code> - List with the desired informaton from JIRA  

| Param | Type | Description |
| --- | --- | --- |
| tickets | <code>Array.&lt;string&gt;</code> | List of tickets to get information from |

<a name="getTicketsFromCommits"></a>

## getTicketsFromCommits(commits) ⇒ <code>Array.&lt;object&gt;</code>
Moves throught the list of commits in this PR and filter out any that have
the correct structure to so we can get the information from JIRA.

Multiple commits can have the same ticket number, so we create a new set and
return only one instance of each ticket

**Kind**: global function  
**Returns**: <code>Array.&lt;object&gt;</code> - List of ticket numbers that we'll get information from  

| Param | Type | Description |
| --- | --- | --- |
| commits | <code>Array.&lt;string&gt;</code> | List of all commits that are in the PR |

<a name="formatTable"></a>

## formatTable(tickets) ⇒ <code>string</code>
Formats a list of tickets into a markdown table

**Kind**: global function  
**Returns**: <code>string</code> - Markdown table  

| Param | Type | Description |
| --- | --- | --- |
| tickets | <code>Array.&lt;Object&gt;</code> | List of tickets to format |
| ticket.key | <code>string</code> | Key of the ticket |
| ticket.status | <code>string</code> | Current Status of the Ticket |
| ticket.fixVersions | <code>string</code> | What fix version does this belong to |
| ticket.squad | <code>string</code> | What Squad is working on it |
| ticket.codeLocation | <code>string</code> | Wher is this already deployed |

