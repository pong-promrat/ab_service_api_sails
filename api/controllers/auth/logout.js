/**
 * auth/login.js
 * Process the provided login email/password and establish a user session
 * if valid.
 *
 * url:     post /auth/login
 * header:  X-CSRF-Token : [token]
 * return:  { user }
 * params:
 */
// var inputParams = {
//    email: { string: { email: true }, required: true },
//    password: { string: true, required: true },
//    tenant: { string: true, optional: true },
// };
const CasStrategy = require("passport-cas2").Strategy;

module.exports = function (req, res) {
   req.ab.log("auth/logout():");

   req.session.tenant_id = null;
   req.session.user_id = null;

   // passport session logout feature:
   if (req.logout) {
      if (sails.config.cas.enabled) {
         var cas = new CasStrategy({
            casURL: sails.config.cas.baseURL,
            pgtURL: sails.config.cas.pgtURL || sails.config.cas.proxyURL,
            sslCert: sails.config.cas.sslCert || null,
            sslKey: sails.config.cas.sslKey || null,
            sslCA: sails.config.cas.sslCA || null,
            passReqToCallback: true,
         });
         cas.logout(
            req,
            res,
            `${sails.config.cas.baseURL}/logout?service=${req.tenantUrl}`
         );
      } else {
         req.logout();
      }
   }

   res.ab.success({});
};
