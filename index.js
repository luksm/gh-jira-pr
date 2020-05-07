const fs = require("fs");
const readline = require("readline");

const path = "./keys.js";
let keys = { GH_TOKEN: "", FS_CRED: "", FS_URL: "", VOC_CRED: "", VOC_URL: "" };

try {
  fs.stat(path, function (err, stats) {
    if (err) {
      throw new Error("File not found");
    }
    keys = require(path);
  });
} catch (err) {
  console.log("We need to create a file with your different API keys:");

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question("What is your Git Hub Key ? ", function (GH_TOKEN) {
    rl.question("What is your FS Jira Key ? ", function (FS_CRED) {
      rl.question("What is your Kana Jira Key ? ", function (VOC_CRED) {
        keys.FS_CRED = FS_CRED;
        keys.FS_URL = "foreseeresults.atlassian.net";
        keys.VOC_CRED = VOC_CRED;
        keys.VOC_URL = "kanasoftware.jira.com";
        keys.GH_TOKEN = GH_TOKEN;
        console.log(`These are your keys ${JSON.stringify(keys, null, 2)}`);
        rl.close();
      });
    });
  });

  rl.on("close", function () {
    console.log("\nBYE BYE !!!");
    process.exit(0);
  });
}
