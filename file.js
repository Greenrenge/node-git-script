const fs = require("fs");
const FP = require("functional-promises");
const { chain, resolve } = FP;
const path = require("path");
const p = require("util").promisify;
const fsFileStat = path => p(fs.lstat)(path);

const fsFilesAndFolders = fullPath =>
  resolve(fsFileStat(fullPath)).thenIf(
    s => s.isDirectory(),
    () => resolve(p(fs.readdir)(fullPath)),
    () => []
  );

const fsFilesAndFoldersPath = fullPath =>
  resolve(fsFilesAndFolders(fullPath)).map(file =>
    path.join(fullPath, `./${file}`)
  );

const fileOrDirectoryFilter = isDirectory => path =>
  resolve(fsFileStat(path)).then(stat => stat.isDirectory() === isDirectory);

const dirPredicate = fileOrDirectoryFilter(true);
const filePredicate = fileOrDirectoryFilter(false);

module.exports = {
  fsFilesAndFolders,
  fsFilesAndFoldersPath,
  fsFileStat,
  filePredicate,
  dirPredicate
};
