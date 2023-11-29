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
const async = require("async");

// var inputParams = {
//    tenant: { string: true, optional: true },
// };

module.exports = function (req, res) {
   req.ab.log("mobile/app():");

   var user = req.ab.user;
   let appID = req.ab.param("ID");
   let tenantID = req.ab.tenantID;
   if (!tenantID || tenantID == "??") {
      tenantID = req.ab.param("tenantID");
      req.ab.tenantID = tenantID;
   }

   let config = null;
   let definitions = null;

   // create a new job for the service
   let jobData = {
      ID: appID,
   };

   async.parallel(
      [
         (done) => {
            // pass the request off to the uService:
            req.ab.serviceRequest(
               "definition_manager.mobile-config",
               jobData,
               { stringResult: true },
               // stringResult: true reduces the work of parsing the data
               // and then restringifying it back into the res.view()
               // configData here will be the stringify() version of the data
               (err, configData) => {
                  if (err) {
                     done(err);
                     return;
                  }
                  config = configData;
                  done();
               }
            );
         },
         (done) => {
            // pass the request off to the uService:
            req.ab.serviceRequest(
               "definition_manager.export-app",
               jobData,
               { stringResult: true },
               // stringResult: true reduces the work of parsing the data
               // and then restringifying it back into the res.view()
               // definitionData here will be the stringify() version of the data
               (err, definitionData) => {
                  if (err) {
                     done(err);
                     return;
                  }
                  definitions = definitionData;
                  done();
               }
            );
         },
      ],
      (err) => {
         if (err) {
            res.ab.error(err, 500);
            return;
         }

         res.view("mobile_pwa.ejs", {
            layout: false,
            appID,
            tenantID,
            config,
            definitions,
         });
      }
   );
};
