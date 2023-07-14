/**
 * mobile/favicon.js
 * @apiDescription Respond with the favicon.png of the Mobile PWA
 *
 * @api {get} /mobile/app/:ID/favicon.png
 * @apiGroup Mobile
 * @apiPermission None
 * @apiUse successRes
 * @apiSuccess (200) {png}
 */
// const authLogger = require("../../lib/authLogger.js");

// var inputParams = {
//    tenant: { string: true, optional: true },
// };

module.exports = function (req, res) {
   req.ab.log("mobile/favicon():");

   var user = req.ab.user;
   if (!user) {
      res.ab.reauth();
      return;
   }
   var url;
   // if (req.ab.tenantSet()) {
   //    url = `/assets/tenant/${req.ab.tenantID}/favicon.ico`;
   // } else {
   url = "/assets/tenant/default/favicon.ico";
   // }
   req.ab.log("/favicon.ico : resolving to :" + url);
   res.redirect(url);
};
