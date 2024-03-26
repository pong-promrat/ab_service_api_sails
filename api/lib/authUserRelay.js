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
               if (!authorization) return done();
               req.ab.log("authUser -> Relay Auth");
               const [relay, token, user] = authorization.split("@@@");
               if (
                  relay === "relay" &&
                  sails.config.relay?.mcc?.enabled &&
                  token === sails.config.relay.mcc.accessToken
               ) {
                  sails.helpers.user
                     .findWithCache(req, req.ab.tenantID, user)
                     .catch((err) => done(err))
                     .then((user) => {
                        done(null, user);
                        authLogger(req, "Relay auth successful");
                     });
               } else {
                  // invalid authorization data:
                  const message =
                     "api_sails:authUser:Relay Header: Invalid authorization data";
                  const err = new Error(message);
                  done(err);
                  req.ab.notify.developer(err, {
                     context: message,
                     authorization,
                  });
                  authLogger(req, "Relay auth FAILED");
               }
            }
         )
      );
   },
};
