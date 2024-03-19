/**
 * API endpoint that simply dumps out a log string onto the console.
 *
 * This is primarily a Testing Feature so we can mark the beginning of a test run
 * in the outgoing logs to aid our debugging of tests.
 */

// This provides the req.ab.* methods.
const utilPolicy = require("../policies/abUtils.js");

const testLog = function (req, res) {
   // if this isn't in the testing environment, 404!
   if (typeof process.env.AB_TESTING == "undefined") {
      return res.notFound();
   }

   let logEntry = req.param("log");
   if (!logEntry) {
      return res.ab.success({ log: "not provided" });
   }

   let delim = Array(logEntry.length).fill("#").join("");

   req.ab.log(`######${delim}######`);
   req.ab.log(`##### ${logEntry} #####`);
   req.ab.log(`######${delim}######`);

   res.ab.success({ done: true });
};

module.exports = function (sails) {
   return {
      routes: {
         // These routes will run before any policies
         before: {
            "POST /testlog": (req, res) => {
               // Manually invoke the AB utils policy
               utilPolicy(req, res, () => {
                  testLog(req, res);
               });
            },
         },
      },
   };
};
