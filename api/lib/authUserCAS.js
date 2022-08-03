/*
 * authUser (CAS)
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
 *
 * Add this to your config/local.js:
 * cas: {
 *    baseURL: "https://signin.example.com/cas",  // your CAS server URL
 *    uuidKey: "guid", // CAS profile attribute to become your user UUID
 *    siteURL: "http://localhost:1337"  // the external URL of AppBuilder
 * }
 *
 */
const url = require("url");
const async = require("async");
const AB = require("ab-utils");
const passport = require("passport");
const CasStrategy = require("passport-cas2").Strategy;

module.exports = {
   init: (reqApi) => {
      passport.use(
         new CasStrategy(
            {
               casURL: sails.config.cas.baseURL,
               pgtURL: sails.config.cas.pgtURL || sails.config.cas.proxyURL,
               sslCert: sails.config.cas.sslCert || null,
               sslKey: sails.config.cas.sslKey || null,
               sslCA: sails.config.cas.sslCA || null,
               passReqToCallback: true,
            },
            function (req, username, profile, done) {
               // Map the site_user.uuid value from the CAS profile
               let uuidKey = sails.config.cas.uuidKey || "id"; // "eaguid"
               let uuid = profile[uuidKey] || username;
               if (Array.isArray(uuid)) {
                  uuid = uuid[0];
               }

               // Result is the final user object that Passport will use
               let result = null;
               reqApi.tenantID = req.ab.tenantID;

               async.series(
                  [
                     // Find user account
                     (ok) => {
                        reqApi.serviceRequest(
                           "user_manager.user-find",
                           { uuid },
                           (err, user) => {
                              if (err) {
                                 console.warn(
                                    "Error from user-find",
                                    err.message || err
                                 );
                                 //ok(err);
                                 ok();
                                 return;
                              }
                              if (user) {
                                 result = user;
                              }
                              ok();
                           }
                        );
                     },
                     // Create new user entry if needed
                     (ok) => {
                        // Skip this step if user already exists
                        if (result) return ok();

                        let email = profile.email || profile.emails || uuid;
                        if (Array.isArray(email)) {
                           email = email[0];
                        }

                        let language = profile.language || profile.languages;
                        if (Array.isArray(language)) {
                           language = language[0];
                        }

                        // It may take several tries to create the user account entry
                        let numTries = 5;

                        async.whilst(
                           // while condition
                           (w_cb) => {
                              numTries -= 1;
                              if (numTries == 0) {
                                 w_cb(
                                    new Error(
                                       "Too many tries to create user account"
                                    )
                                 );
                              } else {
                                 w_cb(null, result == null);
                              }
                           },
                           // do
                           (d_cb) => {
                              reqApi.serviceRequest(
                                 //"user_manager.new-user????",
                                 "appbuilder.model-post",
                                 {
                                    objectID:
                                       "228e3d91-5e42-49ec-b37c-59323ae433a1", // site_user
                                    values: {
                                       uuid,
                                       username,
                                       email,
                                       password: "CAS",
                                       languageCode: language,
                                       isActive: 1,
                                    },
                                 },
                                 (err, user) => {
                                    // Duplicate user name
                                    if (err && err.code == "ER_DUP_ENTRY") {
                                       // Change username and try again
                                       username = `${uuid}-${AB.uuid()}`;
                                       d_cb();
                                    }
                                    // Some other error
                                    else if (err) {
                                       d_cb(err);
                                    }
                                    // Success
                                    else {
                                       result = user;
                                       d_cb();
                                    }
                                 }
                              );
                           },
                           // finished
                           (err) => {
                              if (err) ok(err);
                              else ok();
                           }
                        );
                     },
                  ],
                  (err) => {
                     if (err) done(err);
                     else done(null, result);
                  }
               );
            }
         )
      );
   },

   middleware: (req, res, next) => {
      // Authenticate the unknown user now

      if (sails.config.cas.siteURL) {
         // Inject the AppBuilder site URL from the config into
         // the headers so that Passport CAS will know where to
         // redirect back to.
         let siteURL = url.parse(sails.config.cas.siteURL);
         req.headers["x-forwarded-proto"] = siteURL.protocol;
         req.headers["x-forwarded-host"] = siteURL.host;
      }
      let auth = passport.authenticate("cas", (err, user, info) => {
         // Server errors
         if (err) {
            res.serverError(err);
            req.ab.notify.developer(err, {
               context: "CAS authentication (err)",
               user,
               info,
            });
            return;
         }
         if (info instanceof Error) {
            res.serverError(info);
            req.ab.notify.developer(info, {
               context: "CAS authentication (info)",
               user,
            });
            return;
         }
         // Authentication failed
         if (!user) {
            res.unauthorized();
            let err = new Error("CAS Auth failed");
            req.ab.notify.developer(err, {
               context: "CAS authentication failed",
               user,
               info,
            });
            return;
         }

         // CAS auth succeeded
         req.logIn(user, (err) => {
            // ... but the site did not?
            if (err) {
               res.serverError();
               req.ab.notify.developer(err, {
                  context: "Error performing passport.logIn()",
                  user,
                  info,
               });
               return;
            }

            // Authenticated!
            req.session.user_id = user.uuid;
            req.session.tenant_id = req.ab.tenantID;
            req.ab.user = user;
         });
      });
      auth(req, res, next);
   },
};
