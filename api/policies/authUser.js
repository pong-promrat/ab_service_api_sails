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

// A. Importing code while node.js starts up
const authCAS = require(__dirname + "/../lib/authUserCAS.js");
const authLocal = require(__dirname + "/../lib/authUserLocal.js");
const authOkta = require(__dirname + "/../lib/authUserOkta.js");


// B. Initializing during Sails.js bootstrap
// (Global `sails` object is not yet defined)
// @see api/hooks/initPassport.js
global.AB_AUTHUSER_INIT = (sails) => {
   // CAS auth
   if (typeof sails.config.cas == "object" && sails.config.cas.enabled) {
      authCAS.init();
   }
   // Okta auth
   else if (typeof sails.config.okta == "object" && sails.config.okta.enabled) {
      authOkta.init();
   }
   // Local auth (default)
   else {
      authLocal.init();
   }

   // Clean up to reduce global namespace pollution
   delete global.AB_AUTHUSER_INIT;
};


// C. Responding to requests at runtime

var commonRequest = {};
// {lookupHash} /* user.uuid : Promise.resolves(User) */
// A shared lookup hash to reuse the same user lookup when multiple attempts
// are being attempted in parallel.

const isUserKnown = (req, res, next) => {
   // Question: why don't we check req.session.passport.user?
   // Or use req.isAuthenticated()?

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

            next(null, user);
         })
         .catch((err) => {
            next(err);
         });

      return true;
   }

   // User is not authenticated
   return false;
}

module.exports = (req, res, next) => {
   // (Global `sails` object is now ready)
   // CAS auth
   if (typeof sails.config.cas == "object" && sails.config.cas.enabled) {
      authCAS.middleware(isUserKnown, req, res, next);
   }
   // Okta auth
   else if (typeof sails.config.okta == "object" && sails.config.okta.enabled) {
      authOkta.middleware(isUserKnown, req, res, next);
   }
   // Local auth (default)
   else {
      authLocal.middleware(isUserKnown, req, res, next);
   }
};
