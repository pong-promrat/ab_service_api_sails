/**
 * hooks/telemetry
 * set up telemetry as soon as sails launches
 */
module.exports = function () {
   return {
      initialize: async function () {
         // If we have a SENTRY DSN init telemetry
         if (process.env.SENTRY_DSN) {
            process.env.SENTRY = true;
            const { telemetry } = require("@digiserve/ab-utils");
            const Sentry = require("@sentry/node");
            const { version } = require("../../package");

            telemetry.init("sentry", {
               dsn: process.env.SENTRY_DSN,
               release: version,
               integrations: [
                  new Sentry.Integrations.Http({ tracing: true }),
                  new Sentry.Integrations.Express(),
               ],
            });
         }
      },
   };
};

