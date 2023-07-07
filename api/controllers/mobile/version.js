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
   if (user) {
      res.ab.success({ version: "1.0.0" });
   } else {
      res.ab.reauth();
   }
};
