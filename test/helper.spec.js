const { exec } = require("../helper");
const { describe, Try } = require("riteway");

describe("exec", async assert => {
  const files = await exec("ls", { capture: true, cwd: __dirname });
  const isExist =
    files.data.indexOf("helper.spec.js") !== -1 ? "exists" : "not exists";

  assert({
    given: "ls with current pwd as cmd",
    should: "resolve promise with this file test",
    actual: isExist,
    expected: "exists"
  });

  let result
  try {
    const fails = await exec("lsx", { capture: true, cwd: __dirname });
     result = 'resolve'
  } catch (err) {
      console.error(err)
      result = 'throws error' 
  }

  assert({
    given: "failed existing command",
    should: "reject promise with this file test",
    actual: result,
    expected: "throws error"
  });
});
