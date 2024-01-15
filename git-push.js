/**
 *
 * @returns {string} eg: 2024-1-12-19-03-49
 */
function getDateCurrent() {
  let date = new Date();
  let localeDateString = date.toLocaleDateString().replace(/\//g, '-');
  let localeTimeString = date.toLocaleTimeString().replace(/\:/g, '-');
  let dateCurrent = `${localeDateString}-${localeTimeString}`
  return dateCurrent;
}

function pushAll(){
  const {execSync} = require("node:child_process");

  let dateCurrent = getDateCurrent();
  let message = `${dateCurrent}`
  const arr = [
    `git reset --soft HEAD~1`,
    `git add .`,
    `git commit -m ${message}`,
    `git push --force`
  ]
  arr.forEach(value => execSync(value))
}

pushAll()