/**
 * Initialize the authUser Passport.js object.
 * @see api/policies/authUser.js
 */
const passport = require("passport");

const authCAS = require("../lib/authUserCAS.js");
const authLocal = require("../lib/authUserLocal.js");
const authOkta = require("../lib/authUserOkta.js");
const authRelay = require("../lib/authUserRelay.js");
const authToken = require("../lib/authUserToken.js");


module.exports = function (sails) {
   return {
      initialize: async function () {
         passport.serializeUser((user, done) => done(null, user.uuid));
         passport.deserializeUser((req, user, done) => {
            console.log("deserializeUser", user);
            sails.helpers.user
               .findWithCache(req, req.ab.tenantID, user)
               .then((user) => done(null, user));
         });

         // Passport Strategies:
         authLocal.init();
         authToken.init();
         authRelay.init();
         if (sails.config.cas?.enabled) {
            authCAS.init();
         }
         // Okta auth
         if (sails.config.okta?.enabled) {
            authOkta.init();
         }
      },
   };
};
