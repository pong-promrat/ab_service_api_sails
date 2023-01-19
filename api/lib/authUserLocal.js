/**
 * authUser (local)
 * attempt to resolve which user this route is trying to work with.
 * When this step is completed, there should be 1 of 3 conditions:
 *    1) A User has not been resolved:
 *       req.ab.passport : {Passport}
 *       req.session.user_id : {null or undefined}
 *       req.ab.user : {null or undefined}
 *
 *    2) A User is defined in the session info:
 *       This means the User has been looked up via the session info
 *       req.session.user_id : {SiteUser.uuid}
 *       req.ab.user : {json of SiteUser entry}
 *
 * The only time the session info is set is during the auth/login.js
 * routine.  After a successful login, the session.user_id is set.
 */
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;

module.exports = {
   init: (reqApi) => {
      passport.use(
         new LocalStrategy(function (email, password, done) {
            reqApi.serviceRequest(
               "user_manager.user-find-password",
               { email, password },
               (err, user) => {
                  if (err) {
                     done(err);
                     return;
                  }
                  done(null, user);
               }
            );
         })
      );
   },

   middleware: (req, res, next) => {
      // the user is unknown at this point.
      // they should be initialized on the initial "post /login" route

      // we will assign the passport to the req.ab obj,
      // then let later processing decide what to do with
      // an unknown user.
      req.ab.log("unknown user");
      req.ab.passport = passport;

      // In other words, AppBuilder will display a login screen.

      next();
   },
};
