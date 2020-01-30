const { exec } = require("./helper");
const yargs = require("yargs");
const fs = require("fs");
const FP = require("functional-promises");
const { chain, resolve } = FP;
const path = require("path");
const createGitCommand = require("./git");
const { transformToSSH } = createGitCommand;
const p = require("util").promisify;
const {
  dirPredicate,
  filePredicate,
  fsFilesAndFolders,
  fsFilesAndFoldersPath
} = require("./file");

// CONFIG
const json = require("./repo.json");
const jsonMap = json.reduce((p, c) => ({ ...p, [c.name]: c.remote }), {});
console.log(jsonMap);

const argv = yargs
  .usage(`Usage: $0 <full-path-to-folder> [options]`) // help "Usage" description
  .demandCommand(1) // requiring 1 argument to be passed
  //   .option("skip-build", {
  //     describe: "To skip build process"
  //   })
  .help().argv; // for --help and -h to work
const PATH = argv._[0].startsWith("./")
  ? path.join(__dirname, argv._[0])
  : argv._[0];
const onlyGitRepositoryPredicate = fullPath =>
  resolve(fsFilesAndFolders(fullPath)).then(files =>
    files.some(f => f === ".git")
  );

// steps
// --------
// git remote -v -- https://github.com/user/repo_name.git (fetch)
// git remote set-url <remote-name> git@gitserver.com:user/repo_name.git
// git pull origin
// add origin2  ${gitlab}
// see all branch
// filter only remotes/origin/xxxxxx
//       - then checkout each branch
//       - then pull origin
//      - git push origin2 -u xxxxxx
const error = l => {
  console.error("ERROR", l);
  p(fs.appendFile)("./error.log", `${l}\n`);
};

const done = l => {
  console.log("DONE", l);
  p(fs.appendFile)("./done.log", `${l}\n`);
};

const log = l => {
  console.log("LOG", l);
  p(fs.appendFile)("./info.log", `${l}\n`);
};

const createGitCommandMap = fullPath => {
  return {
    path: fullPath,
    cmd: createGitCommand(fullPath)
  };
};

const migration = async ({ path, cmd }) => {
  const {
    checkOutTo,
    remoteAdd,
    remoteGetBranch,
    pull,
    push,
    pushCreate,
    remoteDel,
    remoteSetUrl,
    remoteGetAll,
    exec:ex,
  } = cmd;

  const source = "origin";
  const dest = "gitlab";
  const folderName = path.substring(path.lastIndexOf("/") + 1, path.length);
  // not found config
  if (!jsonMap[folderName]) {
    error(`not found config json for ${path}`);
    return;
  }

  await ex('rm -f .git/index')
  await ex('git reset')

  const remotes = await remoteGetAll();

  // not found origin
  if (!remotes[source]) {
    error(`not found origin for ${path}`);
    return;
  }

  const newOrigin = transformToSSH(remotes[source]);
  await remoteSetUrl(source, newOrigin);

  log(`${folderName} : set new url to ${newOrigin}`);
  const branches = await remoteGetBranch(source);
  log(`${folderName} : remote branch is ${branches}`);

  await remoteAdd(dest, jsonMap[folderName]);

  for (const b of branches) {
    try {
      await checkOutTo(b);
      await pull(source);
      await pushCreate(dest, b);
      log(`${folderName} : BRANCH CREATED ${b}`);
    } catch (err) {
      error(`${folderName} : BRANCH FAILED ${err.toString()}`)
    }
  }
  done(`===========DONE========${folderName}`);
};

async function main() {
  const gitFolders = await fsFilesAndFoldersPath(PATH)
    .filter(dirPredicate)
    .filter(onlyGitRepositoryPredicate);

  resolve(gitFolders)
    .map(createGitCommandMap)
    .concurrency(5)
    .map(migration)
    .catch(err => {
      error(`MAIN ERROR ${err.toString()}`);
      throw err;
    });
}

main()
  .then(() => console.log("MAIN DONE"))
  .catch(err => console.error("MAIN ERROR", err.toString()));

  process.on('unhandledRejection',(reason,promise)=>{
    console.error('UN-HANDLED-REJECTION!')
    console.error(reason)
    console.error(promise)
    process.exit(1)
  })