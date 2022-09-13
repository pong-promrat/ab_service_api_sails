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

module.exports = function (req, res) {
   req.ab.log("auth/logout():");

   req.session.tenant_id = null;
   req.session.user_id = null;

   // passport session logout feature:
   if (req.logout) {
      req.logout();
      if (sails.config.cas.enabled) {
         return res.redirect(
            `${sails.config.cas.baseURL}/logout?service=${req.ab.param(
               "tenantUrl"
            )}`
         );
      }
   }

   res.ab.success({});
};
