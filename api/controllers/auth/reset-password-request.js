/**
 * auth/reset-request.js
 *
 *
 * url:     post /auth/login/reset
 * header:  X-CSRF-Token : [token]
 * params:
 */

var inputParams = {
   email: { string: { email: { allowUnicode: true } }, required: true },
   tenant: { string: true, optional: true },
   url: { string: true, required: true },
};

// make sure our BasePath is created:
module.exports = function (req, res) {
   // Package the Find Request and pass it off to the service

   req.ab.log(`auth::reset-request`);

   // verify your inputs are correct:
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
      var tenant = req.ab.param("tenant");
      if (tenant) {
         req.ab.tenantID = tenant;
      }
   }

   // create a new job for the service
   let jobData = {
      email: req.ab.param("email"),
      url: req.ab.param("url"),
   };

   // pass the request off to the uService:
   req.ab.serviceRequest(
      "user_manager.user-password-reset-request",
      jobData,
      (err, results) => {
         if (err) {
            res.ab.error(err);
            return;
         }
         res.ab.success(results);
      }
   );
};
