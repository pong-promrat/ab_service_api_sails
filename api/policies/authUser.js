/*
 * authUser
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
const async = require("async");
const AB = require("ab-utils");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;

var commonRequest = {};
// {lookupHash} /* user.uuid : Promise.resolves(User) */
// A shared lookup hash to reuse the same user lookup when multiple attempts
// are being attempted in parallel.

/*
 * this is a common req.ab instance for performing user lookups:
 */
const reqApi = AB.reqApi({}, {});
reqApi.jobID = "authUser";

/*
 * Passport Initialization:
 */
passport.serializeUser(function (user, done) {
   done(null, user.uuid);
});
passport.deserializeUser(function (uuid, done) {
   reqApi.serviceRequest("user_manager.user-find", { uuid }, (err, user) => {
      if (err) {
         done(err);
         return;
      }
      done(null, user);
   });
});

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

const passportInitialize = passport.initialize();
const passportSession = passport.session();

module.exports = (req, res, next) => {
   async.series(
      [
         (done) => {
            passportInitialize(req, res, (err) => {
               done(err);
            });
         },
         (done) => {
            passportSession(req, res, (err) => {
               done(err);
            });
         },
         (done) => {
            // there are several ways a User can be specified:

            // - session: user_id: {SiteUser.uuid}
            if (req.session && req.session.user_id) {
               req.ab.log("authUser -> session");
               let userID = req.session.user_id;
               let key = `${req.ab.tenantID}-${userID}`;

               // make sure we have a Promise that will resolve to
               // the user created for this userID
               if (!commonRequest[key]) {
                  commonRequest[key] = new Promise((resolve, reject) => {
                     req.ab.serviceRequest(
                        "user_manager.user-find",
                        { uuid: userID },
                        (err, user) => {
                           if (err) {
                              reject(err);
                              return;
                           }
                           resolve(user);
                        }
                     );
                  });
                  commonRequest[key].__count = 0;
               }

               // now use this Promise and retrieve the user
               commonRequest[key].__count++;
               commonRequest[key]
                  .then((user) => {
                     req.ab.user = user;

                     if (commonRequest[key]) {
                        req.ab.log(
                           `authUser -> lookup shared among ${commonRequest[key].__count} requests.`
                        );
                        // we can remove the Promise now
                        delete commonRequest[key];
                     }

                     done(null, user);
                  })
                  .catch((err) => {
                     done(err);
                  });

               return;
            } else {
               // the user is unknown at this point.
               // they should be initialized on the initial "post /login" route

               // we will assign the passport to the req.ab obj,
               // then let later processing decide what to do with
               // an unknown user.
               req.ab.log("unknown user");
               req.ab.passport = passport;
               done();
            }
         },
      ],
      (err) => {
         next(err);
      }
   );
};
