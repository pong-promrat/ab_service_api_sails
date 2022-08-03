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
 * okta: {
 *    domain: "example.okta.com",  // Okta server domain name
 *    clientID: "ABCABCABCABCABC", // Okta client ID
 *    clientSecret: "DEFDEFDEFDE", // Okta client secret
 *    siteURL: "http://localhost:1337"  // the external URL of AppBuilder
 * }
 *
 */
const async = require("async");
const AB = require("ab-utils");
const passport = require("passport");
const OktaStrategy = require("passport-openidconnect").Strategy;
// const { Issuer, Strategy } = require("openid-client");

module.exports = {
   init: (reqApi) => {
      passport.use(
         "oidc",
         new OktaStrategy(
            {
               issuer: `https://${sails.config.okta.domain}/oauth2/default`,
               authorizationURL: `https://${sails.config.okta.domain}/oauth2/default/v1/authorize`,
               tokenURL: `https://${sails.config.okta.domain}/oauth2/default/v1/token`,
               userInfoURL: `https://${sails.config.okta.domain}/oauth2/default/v1/userinfo`,
               clientID: sails.config.okta.clientID,
               clientSecret: sails.config.okta.clientSecret,
               // callbackURL: `${sails.config.okta.siteURL}/authorization-code/callback/`,
               scope: "openid profile",
               skipUserProfile: false,
               passReqToCallback: true,
            },
            function (req, issuer, profile, done) {
               console.log("inside now");
               // Username from Okta is the email address
               let email = profile.username;
               // There is also a separate display name
               let username = profile.displayName || email;
               console.log("profile", profile);
               // Result is the final user object that Passport will use
               let result = null;
               reqApi.tenantID = req.ab.tenantID;

               async.series(
                  [
                     // Find user account
                     (ok) => {
                        reqApi.serviceRequest(
                           "user_manager.user-find",
                           { email },
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
                                       uuid: AB.uuid(),
                                       username,
                                       email,
                                       password: "Okta",
                                       languageCode: "en",
                                       isActive: 1,
                                    },
                                 },
                                 (err, user) => {
                                    // Duplicate user name
                                    if (err && err.code == "ER_DUP_ENTRY") {
                                       // Change username and try again
                                       username = `${username}-${AB.uuid()}`;
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
   // Authenticate the unknown user now
   middleware: (req, res, next) => {
      const callbackURL = `${sails.config.okta.siteURL}/authorization-code/callback/${req.ab.tenantID}`;
      // Save the original URL that the user was trying to reach.
      req.session.okta_original_url = req.url;
      // Send the user to the Okta site to sign in.
      let auth = passport.authenticate("oidc", { callbackURL });
      auth(req, res, next);

      // @see api/hooks/initPassport.js :: routes
   },
};
