
//=============================================================================
const path = require("path");

const fs = require("fs");
const CopyPlugin = require("copy-webpack-plugin");
let pathDirSrc = path.join(__dirname, "addons");

let pathDirDest = path.join(__dirname, "dist");
let arr = [
  { type: "file", name: "background" },
  { type: "file", name: `popup-browser-act` },
];

let entry = geneEntry(arr, pathDirSrc);
const patterns = geneCopyPatterns(
  [
    "popup-browser-act.html",

    "_locales", //
    "icons", // icon
    "background.html", //

    "LICENSE", //
    "manifest.json", //
  ],
  pathDirSrc,
  pathDirDest
);


//************************************************************************
//************************************************************************
//************************************************************************
//************************************************************************

// entry only support js file
module.exports = {
  mode: "production", // production
  entry: entry,
  output: {
    path: pathDirDest,
    filename: "[name]",
  },
  experiments: {
    topLevelAwait: true,
  },
  plugins: [new CopyPlugin({ patterns: patterns })],
};

function geneEntry(arr, pathBase) {
  const path = require("path");
  const fs = require("fs");
  let reduce = arr.reduce((result, item) => {
    let { type, name } = item;

    if (String(type).includes("file")) {
      let filename = `${name}.js`;
      result[filename] = path.join(pathBase, filename);
    }
    if (String(type).includes("dir")) {
      let strings = fs.readdirSync(path.join(pathBase, name));
      strings
        .filter((value) => value.endsWith(".js"))
        .forEach((filename) => {
          let key_ = `${name}/${filename}`;
          result[key_] = path.join(pathBase, name, filename);
        });
    }

    return result;
  }, {});

  console.log(`meslog reduce=\n`, reduce);

  return reduce;
}

/**
 *
 * @param arr{Array} src file/dir arr
 * @param src{String} src path
 * @param dest{String} dest path
 * @return Array
 */
function geneCopyPatterns(arr, src, dest) {
  const path = require("path");
  const fs = require("fs");
  return arr.reduce((result, value) => {
    let a = path.join(src, value);
    let b = path.join(dest, value);
    let obj = { from: a, to: b };
    result.push(obj);
    return result;
  }, Array.from([]));
}
