/**
 * authUser (local)
 * authenticate the user with an email and password
 */
const passport = require("passport");
const authLogger = require("./authLogger");
const LocalStrategy = require("passport-local").Strategy;

module.exports = {
   init: () => {
      const strategy = new LocalStrategy(
         { passReqToCallback: true, usernameField: "email" },
         function (req, email, password, done) {
            req.ab.serviceRequest(
               "user_manager.user-find-password",
               { email, password },
               (err, user) => {
                  if (err) {
                     done(err);
                     authLogger(req, "Local auth FAILED");
                     return;
                  }
                  done(null, user);
                  authLogger(req, "Local auth successful");
               }
            );
         }
      );
      passport.use(strategy);
   },
   // Shouldn't happen, but if we recieve GET /auth/login with
   // local auth just redirect back home
   login: (req, res) => {
      res.redirect("/");
   },
};
