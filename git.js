const { exec } = require("./helper");
const FP = require("functional-promises");
const { resolve } = FP;
const createInPath = cwd => cmd =>
  exec(cmd, { capture: true, echo: true, cwd });
/**
 * {
  code: 0,
  data: '* master\n' +
    '  remotes/origin/HEAD -> origin/master\n' +
    '  remotes/origin/dev\n' +
    '  remotes/origin/master\n' +
    '  remotes/origin/old-dev\n' +
    '  remotes/origin/redux-toolkit-switch\n' +
    '  remotes/origin/rtk-switch-doc-updates\n' +
    '  remotes/origin/styles-rfc\n'
}
 */

// steps
// --------
// git remote -v -- https://github.com/user/repo_name.git (fetch)
// git remote set-url <remote-name> git@gitserver.com:user/repo_name.git
// git pull origin
// add origin2  ${gitlab}
// see all branch
// filter only remotes/origin/xxxxxx
//       - then checkout each branch
//      - git push origin2 -u xxxxxx

// const path = "/Users/greenrenge/github/fitnessfirst-timetable";

module.exports = cwd => {
  const e = createInPath(cwd);

  /**
   * {origin:'https://github.com/xxx/yyy.git'}
   */
  const remoteGetAll = () =>
    resolve(e("git remote -v"))
      .get("data")
      .then(x =>
        x
          .split("\n")
          .filter(a => a)
          .map(s => s.split(/\t/)) //  'origin\thttps://github.com/xxx/yyy.git (fetch)
          .reduce((p, c) => ({ ...p, [c[0]]: c[1].split(" (")[0] }), {})
      );

  const remoteSetUrl = (remoteName, url) =>
    e(`git remote set-url ${remoteName} ${url}`)
  const remoteAdd = (remoteName, url) =>
    e(`git remote add ${remoteName} ${url}`)
  const remoteDel = remoteName => resolve(e(`git remote rm ${remoteName}`));
  const pull = (remoteName, branch) =>
    e(`git pull ${remoteName} ${branch ? branch : ""}`)
  const push = (remoteName, branch) =>
    e(`git push ${remoteName} ${branch ? branch : ""}`)
  const pushCreate = (remoteName, branch) =>
    e(`git push ${remoteName} -u ${branch}`)

  /**
   * ['master','dependabot/npm_and_yarn/eslint-utils-1.4.3']
   * **/
  const remoteGetBranch = remoteName =>
    resolve(e(`git branch -a`))
      .get("data")
      .then(s =>
        s
          .split("\n")
          .map(a => a.trim())
          .filter(
            a => a.startsWith(`remotes/${remoteName}`) && a.indexOf("->") == -1
          )
          .map(a => a.replace(`remotes/${remoteName}/`, ""))
      );

  const checkOutTo = branch => e(`git checkout ${branch}`)
  return {
    exec:e,
    checkOutTo,
    remoteAdd,
    remoteGetBranch,
    pull,
    push,
    pushCreate,
    remoteDel,
    remoteSetUrl,
    remoteGetAll
  };
};

const transformToSSH = https => {
  if(!https.startsWith('https://')) return https
  const tmp1 = https.replace("https://", "git@");
  return (
    tmp1.substring(0, tmp1.indexOf("/")) +
    ":" +
    tmp1.substring(tmp1.indexOf("/") + 1, tmp1.length)
  );
};

module.exports.transformToSSH = transformToSSH;
