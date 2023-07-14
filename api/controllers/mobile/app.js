/**
 * mobile/app.js
 * @apiDescription Respond with the index.html of the Mobile PWA
 *
 * @api {get} /mobile/app/:ID
 * @apiGroup Mobile
 * @apiPermission None
 * @apiUse successRes
 * @apiSuccess (200) {html}
 */
// const authLogger = require("../../lib/authLogger.js");

// var inputParams = {
//    tenant: { string: true, optional: true },
// };

module.exports = function (req, res) {
   req.ab.log("mobile/app():");

   var user = req.ab.user;
   if (!user) {
      res.ab.reauth();
      return;
   }
   let appID = req.ab.param("ID");
   let tenantID = req.ab.tenantID;

   res.view("mobile_pwa.ejs", { layout: false, appID, tenantID });
};
