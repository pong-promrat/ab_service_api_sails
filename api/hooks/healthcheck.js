/**
 * API endpoint that pings every AppBuilder internal service to check if they
 * are all healthy. 
 * 
 * Authentication is not needed. The response will be the same regardless of
 * the tenant.
 * 
 * Services must implement a `*.healthcheck` handler. The handler takes no
 * arguments and returns an optional message with its ping response.
 * 
 * // Example service handler
 * // - ab_service_example
 * // - ./handlers/healthcheck.js
 * module.exports = {
 *    key: "example.healthcheck",
 *    inputValidation: {},
 *    fn: function handler(req, cb) {
 *       ABBootstrap.init(req)
 *          .then((AB) => {
 *             // Perform any internal checks if needed.
 *             // - check DB connection?
 *             // - check mail server?
 *             // - check relay server?
 *             // - throw Error("Your example message") if something is wrong
 *             // ...
 *             let message = "OK";
 *             cb(null, message);
 *          })
 *          .catch((err) => {
 *             cb(err);
 *          });
 *    }
 * }
 */

const servicesToPing = [
   {
      name: "bot_manager",
   },
   {
      name: "file_processor",
   },
   {
      name: "relay",
   },
   {
      name: "notification_email",
   },
   { 
      name: "appbuilder",
      test: {
         request: "appbuilder.model-get",
         params: { objectID: "228e3d91-5e42-49ec-b37c-59323ae433a1" }
      }
   },
   {
      name: "definition_manager",
      test: {
         request: "definition_manager.definitions-check-update",
         params: {}
      }
   },
   {
      name: "log_manager",
      test: {
         request: "log_manager.rowlog-find",
         params: { objectID: "228e3d91-5e42-49ec-b37c-59323ae433a1" }
      }
   },
   {
      name: "process_manager",
      test: {
         request: "process_manager.inbox.find",
         params: { users: ["admin"] }
      }
   },
   {
      name: "tenant_manager",
      test: {
         request: "tenant_manager.find",
         params: { key: "admin" }
      }
   },
   {
      name: "user_manager",
      test: {
         request: "user_manager.find",
         params: { username: "admin" }
      }
   },
   {
      name: "custom_reports",
      test: {
         request: "custom_reports.report",
         params: { reportKey: "hello-world" }
      }
   },
];

const PING_TIMEOUT = 10000; // 10 seconds

// This provides the req.ab.* methods.
const utilPolicy = require("../policies/abUtils.js");

/**
 * The healthcheck endpoint handler.
 * "GET /healthcheck"
 * 
 * Sends status code 200 if all services are OK.
 * Sends status code 207 if one or more services are not OK.
 * 
 * @param {HTTPRequest} req
 * @param {HTTPResponse} res
 */
const healthcheck = function(req, res) {
   let pings = [];
   let results = {
   /*
      <service>: { 
         isHealthy: <boolean>,
         ping: {
            message: <string>,
            time: <int>,
         },
         test: {
            message: <string>,
            time: <int>
         }
      },
      ...
   */
   };
   let statusCode = 200;
   if (req.ab.tenantID == "??") {
      req.ab.tenantID = "admin";
   }

   servicesToPing.forEach((service) => {
      results[service.name] = {
         isHealthy: true,
         ping: {
            message: null,
            time: null,
         },
         test: {
            message: null,
            time: null
         }
      };

      // Ping all services in parallel
      pings.push(new Promise((resolve) => {
         let response = results[service.name];
         let startTime = new Date();
         req.ab.serviceRequest(
            `${service.name}.healthcheck`,
            {}, // data
            { maxAttempts: 1, timeout: PING_TIMEOUT }, // options
            (err, data = "") => {
               let endTime = new Date();
               response.ping.time = endTime - startTime;
               if (err) {
                  response.isHealthy = false;
                  response.ping.message = err.message || err;
                  // 207 Multi-Status: some services are not OK
                  statusCode = 207;
               } else {
                  response.ping.message = data;
               }
               resolve();
            }
         );
      }));

      // Some services can be tested with with real requests
      if (service.test) {
         pings.push(new Promise((resolve) => {
            let response = results[service.name];
            let startTime = new Date();
            req.ab.serviceRequest(
               service.test.request,
               service.test.params,
               { maxAttempts: 1, timeout: PING_TIMEOUT },
               (err, data) => {
                  let endTime = new Date();
                  response.test.time = endTime - startTime;
                  if (err) {
                     response.isHealthy = false;
                     statusCode = 207;
                     response.test.message = err.message || err;
                  } else {
                     response.test.message = "OK";
                     // Don't send the `data` in the response because it
                     // might contain user data. This healthcheck is accessible
                     // with no authentication.
                  }
                  resolve();
               }
            );
         }));
      }
   });

   Promise.all(pings)
      .then(() => {
         res.status(statusCode).json(results);
      })
      .catch((err) => {
         // This should only happen if there's an error in api_sails
         req.ab.error("Error while running healthcheck");
         req.ab.error(err);
         req.ab.log(results);
         res.serverError(err);
      });   
}


module.exports = function (sails) {
   return {
      routes: {
         // These routes will run before any policies
         before: {

            "GET /healthcheck": (req, res) => {
               // Manually invoke the AB utils policy
               utilPolicy(req, res, () => {
                  healthcheck(req, res);
               });
            },

         },
      },
   };
};
