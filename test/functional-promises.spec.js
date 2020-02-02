const { resolve,reject } = require("functional-promises");
const { describe, Try } = require("riteway");

describe("resolve", async assert => {

  assert({
    given: "a resolve promise",
    should: "resolve with result",
    actual: await resolve(Promise.resolve('value')),
    expected: "value"
  });
 


  let rejectResult 
  try {
     await resolve().then(()=>Promise.reject('rejectja'))
     console.log('what')
     rejectResult = 'resolve'
  } catch (error) {
     console.log('error')
     rejectResult = 'reject'
  }

  assert({
    given: "a reject promise",
    should: "reject with error",
    actual: rejectResult,
    expected: "reject"
  });
});
