/**
 * authRelay
 *
 * Checks for and validates a Relay Header:
 * - authorization: 'relay@@@[accessToken]@@@[SiteUser.uuid]'
 *
 */
const passport = require("passport");
const { Strategy } = require("passport-trusted-header");
const authLogger = require("./authLogger.js");

module.exports = {
   init: () => {
      passport.use(
         "relay",
         new Strategy(
            { passReqToCallback: true, headers: ["authorization"] },
            (req, { authorization }, done) => {
               console.log("Auth Relay");
               if (!authorization)
                  return done(new Error("Missing `authorization` header"));
               const [relay, token, user] = authorization.split("@@@");
               if (
                  relay === "relay" &&
                  sails.config.relay?.mcc?.enabled &&
                  token === sails.config.relay.mcc.accessToken
               ) {
                  sails.helpers.user
                     .findWithCache(req, req.ab.tenantID, user)
                     .catch((err) => done(err))
                     .then((user) => done(null, user));
               } else {
                  // invalid authorization data:
                  const message =
                     "api_sails:authUser:Relay Header: Invalid authorization data";
                  const err = new Error(message);
                  done(err);
                  // req.ab.notify.developer(err, {
                  // context: message,
                  // authorization: req.headers["authorization"],
                  // });
                  // authLogger(req, "Relay auth FAILED");
               }
            }
         )
      );
   },
};
