/**
 * auth/reset-password-verify.js
 *
 *
 * url:     post /auth/password/reset
 * header:  X-CSRF-Token : [token]
 * params:
 */

var inputParams = {
   t: { string: true, required: true },
   a: { string: true, required: true },
};

// make sure our BasePath is created:
module.exports = async function (req, res) {
   // Package the Find Request and pass it off to the service

   req.ab.log(`auth::reset-password-verify`);

   // verify your inputs are correct:
   // false : prevents an auto error response if detected. (default: true)
   // valuesToCheck: {obj} a specified subset of the input values to validate.
   //    { [key] : [value] }
   //       [key] = inputParams[key] entry .
   //       [value] = req.param(value)
   //    if no values given, then req.allParams() are evaluated. In some cases
   //    you'll want to only require a certain subset of input values and then
   //    let the rest be evaluated by the destination service.
   if (!req.ab.validateParameters(inputParams /*, false , valuesToCheck*/)) {
      // an error message is automatically returned to the client
      // so be sure to return here;
      return;
   }

   // NOTE: in the /config route, the tenant_manager.config() handler
   // returns "default" if no tenant could be found for the request.
   // this should only happen if we have enabled the ability to access
   // a generic login that lets you choose which tenant to log into:
   if (!req.ab.tenantSet() || req.ab.tenantID == "default") {
      var tenant = req.ab.param("t");
      if (tenant) {
         req.ab.log(`using tenant: ${tenant}`);
         req.ab.tenantID = tenant;
      }
   }

   try {
      var user = await userForAuthToken(req, req.ab.param("a"));

      // authenticate user
      req.session.tenant_id = req.ab.tenantID;
      req.session.user_id = user.uuid;

      let defaultView = `appbuilder-view="auth_login_resetPassword"`;
      req.session.defaultView = defaultView;

      // redirect to our base url
      res.redirect("/");
   } catch (err) {
      if (err.code == "EUNKNOWNTOKEN") {
         return res.notFound();
      }
      res.ab.error(err);
   }
};

async function userForAuthToken(req, token) {
   return new Promise((resolve, reject) => {
      req.ab.serviceRequest(
         "user_manager.user-for-token",
         { token },
         (err, results) => {
            if (err) {
               reject(err);
               return;
            }
            resolve(results);
         }
      );
   });
}
