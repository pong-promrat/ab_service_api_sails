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
   "appbuilder",
   "bot_manager",
   "log_manager",
   "process_manager",
   "tenant_manager",
   "user_manager",
   "file_processor",
   "relay",
   "notification_email"
];

// This provides the req.ab.* methods.
const utilPolicy = require("../policies/abUtils.js");

/**
 * The healthcheck endpoint handler.
 * "GET /healthcheck"
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
         message: <string>,
         startTime: <Date>,
         endTime: <Date>,
         msElapsed: <int>
      },
      ...
   */
   };
   let statusCode = 200;

   servicesToPing.forEach((service) => {
      results[service] = {
         isHealthy: null,
         message: null,
         startTime: new Date(),
         endTime: null,
         msElapsed: null
      };
      // Ping all services in parallel
      pings.push(new Promise((resolve) => {
         let pingResponse = results[service];
         req.ab.serviceRequest(
            `${service}.healthcheck`,
            {},
            (err, data = "") => {
               pingResponse.endTime = new Date();
               pingResponse.msElapsed = pingResponse.endTime - pingResponse.startTime;
               if (err) {
                  pingResponse.isHealthy = false;
                  pingResponse.message = err.message || err;
                  // 207 Multi-Status: some services are not OK
                  statusCode = 207;
               } else {
                  pingResponse.isHealthy = true;
                  pingResponse.message = data;
               }
               resolve();
            }
         );
      }));
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
