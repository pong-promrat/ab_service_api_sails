/**
 * post /auth/login
 *
 * process the provided login email/password and establish a user session
 * if valid.
 *
 */

module.exports = function(req, res) {
   req.ab.log("auth/login():");

   var email = req.param("email");
   var password = req.param("password");

   if (!req.ab.tenantSet()) {
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
