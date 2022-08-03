/*
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

module.exports = {
   init: (reqApi) => {
      passport.use(
         "token",
         new UniqueTokenStrategy(
            { passReqToCallback: true, tokenHeader: "user-token" },
            (req, token, done) => {
               console.log("Verify token", token);
               if (!token) return done();
               reqApi.tenantID = req.ab.tenantID;
               reqApi.serviceRequest(
                  "user_manager.user-for-token",
                  { token },
                  (err, user) => {
                     if (err) {
                        done(err);
                        return;
                     }
                     done(null, user);
                  }
               );
            }
         )
      );
   },

   middleware: (req, res, next) => {
      // the user is unknown at this point.
      return new Promise((resolve) => {
         const auth = passport.authenticate("token", (err, user, info) => {
            if (user) {
               // If the token yielded a valid user we can call next and allow the
               // request. We don't save as user to session with Token Auth.
               req.ab.user = user;
               next();
               return resolve(true);
            }
            return resolve(false);
         });
         auth(req, res, next);
      });
   },
};
