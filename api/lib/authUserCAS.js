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

let passportSession, passportInitialize;

var commonRequest = {};
// {lookupHash} /* user.uuid : Promise.resolves(User) */
// A shared lookup hash to reuse the same user lookup when multiple attempts
// are being attempted in parallel.


module.exports = {

   init: () => {
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
         new CasStrategy(
            {
               casURL: sails.config.cas.baseURL,
               pgtURL: sails.config.cas.pgtURL || sails.config.cas.proxyURL,
               sslCert: sails.config.cas.sslCert || null,
               sslKey: sails.config.cas.sslKey || null,
               sslCA: sails.config.cas.sslCA || null,
               passReqToCallback: true
            },
            function (req, username, profile, done) {
               // Map the site_user.uuid value from the CAS profile
               let uuidKey = sails.config.cas.uuidKey || "id"; // "eaguid"
               let uuid = profile[uuidKey] || username;
               if (Array.isArray(uuid)) {
                  uuid = uuid[0];
               }

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
                                 console.warn("Error from user-find", err.message || err);
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
                        let username = uuid;
                        async.whilst(
                           // while condition
                           (w_cb) => {
                              numTries -= 1;
                              if (numTries == 0) {
                                 w_cb(new Error("Too many tries to create user account"));
                              }
                              else {
                                 w_cb(null, (result == null));
                              }
                           },
                           // do
                           (d_cb) => {
                              reqApi.serviceRequest(
                                 //"user_manager.new-user????",
                                 "appbuilder.model-post",
                                 { 
                                    objectID: "228e3d91-5e42-49ec-b37c-59323ae433a1", // site_user
                                    values:{
                                       uuid,
                                       username,
                                       email,
                                       password: "CAS",
                                       languageCode: language,
                                       isActive: 1
                                    }
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

      passportInitialize = passport.initialize();
      passportSession = passport.session();
   },

   middleware: (req, res, next) => {
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
               let key = null;
               let userID = null;

               // - session: user_id: {SiteUser.uuid}
               if (req.session && req.session.user_id) {
                  req.ab.log("authUser -> session");
                  userID = req.session.user_id;
                  key = `${req.ab.tenantID}-${userID}`;
               }

               // - Relay Header: authorization: 'relay@@@[accessToken]@@@[SiteUser.uuid]'
               if (req.headers && req.headers["authorization"]) {
                  req.ab.log("authUser -> Relay Auth");
                  let parts = req.headers["authorization"].split("@@@");
                  if (
                     parts[0] == "relay" &&
                     parts[1] == sails.config.relay.mcc.accessToken
                  ) {
                     userID = parts[2];
                     key = `${req.ab.tenantID}-${userID}`;
                  } else {
                     // invalid authorization data:
                     let message =
                        "api_sails:authUser:Relay Header: Invalid authorization data";
                     let err = new Error(message);
                     req.ab.notify.developer(err, {
                        context: message,
                        authorization: req.headers["authorization"],
                     });
                     // redirect to a Forbidden
                     return res.forbidden();
                  }
               }

               // User is already authenticated
               if (key) {
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
               } 

               // Authenticate the unknown user now
               else {
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
                           user, info,
                        });
                        return;
                     }
                     if (info instanceof Error) {
                        res.serverError(info);
                        req.ab.notify.developer(info, {
                           context: "CAS authentication (info)",
                           user
                        });
                        return;
                     }
                     // Authentication failed
                     if (!user) {
                        res.unauthorized();
                        let err = new Error("CAS Auth failed");
                        req.ab.notify.developer(err, {
                           context: "CAS authentication failed",
                           user, info
                        });
                        return;
                     }

                     // Success!
                     req.logIn(user, (err) => {
                        // ... or not?
                        if (err) {
                           res.serverError();
                           req.ab.notify.developer(err, {
                              context: "Error performing passport.logIn()",
                              user, info
                           });
                           return;
                        }

                        // Authenticated!
                        // Do we need to do this?
                        req.session.user_id = user.uuid;
                        done();
                     });
                  });
                  auth(req, res, next);
               }
            },
         ],
         (err) => {
            next(err);
         }
      );
   }

};
