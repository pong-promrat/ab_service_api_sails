/**
 * post /auth/login
 *
 * process the provided login email/password and establish a user session
 * if valid.
 *
 */

module.exports = function (req, res) {
   req.ab.log("auth/login():");

   var email = req.param("email");
   var password = req.param("password");

   // NOTE: in the /config route, the tenant_manager.config() handler
   // returns "default" if no tenant could be found for the request.
   // this should only happen if we have enabled the ability to access
   // a generic login that lets you choose which tenant to log into:
   if (!req.ab.tenantSet() || req.ab.tenantID == "default") {
      var tenant = req.param("tenant");
      if (tenant) {
         req.ab.tenantID = tenant;
      }
   }

   req.ab.serviceRequest(
      "user_manager.find.password",
      { email, password },
      (err, user) => {
         if (err) {
            req.ab.log("error logging in:", err);
            res.ab.error(err, 401);
            return;
         }
         req.ab.log("successful auth/login");
         req.session.tenant_id = req.ab.tenantID;
         req.session.user_id = user.uuid;
         res.ab.success({ user });
      }
   );
};
