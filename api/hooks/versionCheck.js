/**
 * API endpoint that pings every AppBuilder internal service to gather their
 * version information.
 *
 * Authentication is not needed. The response will be the same regardless of
 * the tenant.
 *
 * Services can implement a `*.versionCheck` handler. The handler takes no
 * arguments and returns text representation of their current version: 0.0.0
 *
 * // Example service handler
 * // - ab_service_example
 * // - ./handlers/versioncheck.js
 * module.exports = {
 *    key: "example.versioncheck",
 *    inputValidation: {},
 *    fn: function handler(req, cb) {
 *       cb(null, this.controller.version);
 *    }
 * }
 */

// Add or modify your services here. Each service should have a basic
// handler for <service name>.versioncheck.
const servicesToPing = [
   "appbuilder",
   "custom_reports",
   "definition_manager",
   "file_processor",
   "log_manager",
   "notification_email",
   "process_manager",
   "relay",
   "tenant_manager",
   "user_manager",
];

const PING_TIMEOUT = 30000; // default 30 seconds

// This provides the req.ab.* methods.
const utilPolicy = require("../policies/abUtils.js");

/**
 * The healthcheck endpoint handler.
 * "GET /healthcheck"
 *
 * Optional querystring param:
 *   timeout
 *
 * Sends status code 200 if all services are OK.
 * Sends status code 207 if one or more services are not OK.
 *
 * @param {HTTPRequest} req
 * @param {HTTPResponse} res
 */
const versioncheck = function (req, res) {
   let pings = [];
   let results = {
      /*
      <service> : "<version>"
      */
   };
   let statusCode = 200;
   if (req.ab.tenantID == "??") {
      req.ab.tenantID = "admin";
   }

   servicesToPing.forEach((service) => {
      results[service] = "--";

      // Ping all services in parallel
      pings.push(
         new Promise((resolve) => {
            req.ab.serviceRequest(
               `${service}.versioncheck`,
               {}, // data
               {
                  maxAttempts: 1,
                  timeout: req.query.timeout ?? PING_TIMEOUT,
               },
               (err, data = "") => {
                  // Disabled services are OK.
                  if (err?.message == "Service is disabled.") {
                     results[service] = "disabled.";
                  }
                  // Other errors are not OK.
                  else if (err) {
                     results[service] = err.message || err;
                  }
                  // OK
                  else {
                     results[service] = data;
                  }
                  resolve();
               }
            );
         })
      );
   });

   Promise.all(pings)
      .then(() => {
         req.ab.log("versioncheck", results);
         res.set("Content-Type", "application/json")
            .status(200)
            .send(JSON.stringify(results, null, 2));
      })
      .catch((err) => {
         // This should only happen if there's an error in api_sails
         req.ab.error("Error while running versioncheck");
         req.ab.error(err);
         req.ab.log(results);
         res.serverError(err);
      });
};

module.exports = function (sails) {
   return {
      routes: {
         // These routes will run before any policies
         before: {
            "GET /versioncheck": (req, res) => {
               // Manually invoke the AB utils policy
               utilPolicy(req, res, () => {
                  versioncheck(req, res);
               });
            },
         },
      },
   };
};
