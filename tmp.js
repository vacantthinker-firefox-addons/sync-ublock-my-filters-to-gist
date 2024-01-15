'use strict';

async function exeCmd() {
  const {execSync, exec} = require("node:child_process");
  // todo rmdir dist && mkdir dist
  execSync(`IF NOT EXIST "dist" ( mkdir "dist" ) ELSE ( rmdir /s /q "dist" && mkdir "dist" )`);
  execSync("npm run webpack"); // production

  exec("node git-push.js")
}

async function zipFile() {
//*******************************************
  const {zipAlotFileOrDir} = require("./zipFile");
  await zipAlotFileOrDir("dist", null);
  await zipAlotFileOrDir(
    null,
    {append: "--sourcecode"},
    [".zip", "package-lock.json", "yarn.lock"],
    ["dist", "trash", "screenshot", "tmp", 'json', 'test']
  );
  console.log("new Date()=> ", new Date().toLocaleTimeString());
}

exeCmd();
zipFile();