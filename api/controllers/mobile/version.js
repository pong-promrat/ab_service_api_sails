/**
 * mobile/version.js
 * @apiDescription Respond with the current version # of the provided mobile app
 *
 * @api {get} /mobile/version/:ID
 * @apiGroup Mobile
 * @apiPermission None
 * @apiUse successRes
 * @apiSuccess (200) {object} data
 * @apiSuccess (200) {object} data.version
 */
// const authLogger = require("../../lib/authLogger.js");

// var inputParams = {
//    tenant: { string: true, optional: true },
// };

module.exports = function (req, res) {
   req.ab.log("mobile/version():");

   var user = req.ab.user;
   if (!user) res.ab.reauth();

   let appID = req.ab.param("ID");
   // create a new job for the service
   let jobData = {
      ID: appID,
   };

   // pass the request off to the uService:
   req.ab.serviceRequest(
      "definition_manager.mobile-config",
      jobData,
      (err, configData) => {
         if (err) {
            res.ab.error(err, 500);
            return;
         }
         res.ab.success({ version: configData.version });
      }
   );
};
