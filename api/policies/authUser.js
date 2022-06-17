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


// B. Initializing during Sails.js bootstrap
// (Global `sails` object is not yet defined)
// @see api/hooks/initAuthUser.js
global.AB_AUTHUSER_INIT = (sails) => {
   // CAS auth
   if (typeof sails.config.cas == "object") {
      authCAS.init();
   }
   // Local auth (default)
   else {
      authLocal.init();
   }

   // Clean up to reduce global namespace pollution
   delete global.AB_AUTHUSER_INIT;
};


// C. Responding to requests at runtime
// (Global `sails` object is now ready)
module.exports = (req, res, next) => {
   // CAS auth
   if (typeof sails.config.cas == "object") {
      authCAS.middleware(req, res, next);
   }
   // Local auth (default)
   else {
      authLocal.middleware(req, res, next);
   }
};
