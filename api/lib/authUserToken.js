/**
 * authUserToken
 *
 * Looks for a "user-token" in the request header and checks if the provided
 * token matches a user with "user_manager.user-for-token"
 * If this doesn't work will continue to the tenant's default auth method.
 *
 * Add tokens to SITE_TOKEN table with context { username: username }
 */
const passport = require("passport");
const { UniqueTokenStrategy } = require("passport-unique-token");
const authLogger = require("./authLogger.js");

module.exports = {
   init: () => {
      passport.use(
         "token",
         new UniqueTokenStrategy(
            { passReqToCallback: true, tokenHeader: "user-token" },
            (req, token, done) => {
               if (!token) return done();
               req.tenantID = req.ab.tenantID;
               req.serviceRequest(
                  "user_manager.user-for-token",
                  { token },
                  (err, user) => {
                     if (err) {
                        if (err?.code === "EUNKNOWNTOKEN") {
                           authLogger(req, "Token auth FAILED");
                        }
                        done(err);
                        return;
                     }
                     authLogger(req, "Token auth successful");
                     done(null, user);
                  }
               );
            }
         )
      );
   },
};
