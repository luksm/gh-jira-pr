# GH Jira Pull Request Updater

This is a script that scrapes a pull request for commits wiht JIRA tickets, gets information from JIRA and updates the pull request body with that information.

## Installation


```bash
npm install
sh setup.sh
```

## Usage

There are 3 different ways we can use this script, by default it will look into project `cxs-client` and branch `develop`.

```bash
node request.js 
```

To look at a different branch you can use

```bash
node request.js branch
```

Also to look at a specific repository

```bash
node request.js branch project
```

## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.

## License
[MIT](https://choosealicense.com/licenses/mit/)