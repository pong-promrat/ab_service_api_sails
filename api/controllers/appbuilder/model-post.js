/**
 * appbuilder/model-post.js
 *
 *
 * url:     post /app_builder/model/:ID
 * header:  X-CSRF-Token : [token]
 * params:
 */

const async = require("async");

var inputParams = {
   ID: { string: { uuid: true }, required: true },
   /*    "email": { string:{ email: { allowUnicode: true }}, required:true }   */
   /*                -> NOTE: put .string  before .required                    */
   /*    "param": { required: true } // NOTE: param Joi.any().required();      */
};

// make sure our BasePath is created:
module.exports = function (req, res) {
   // Package the Find Request and pass it off to the service

   req.ab.log(`appbuilder::model-post`);

   var validationParams = Object.keys(inputParams);

   // in our preparations for the service, we only validate the required ID
   // param.
   var validateThis = {};
   (validationParams || []).forEach((p) => {
      validateThis[p] = req.param(p);
   });

   // verify your inputs are correct:
   // false : prevents an auto error response if detected. (default: true)
   if (!req.ab.validateParameters(inputParams, true, validateThis)) {
      // an error message is automatically returned to the client
      // so be sure to return here;
      return;
   }

   // create a new job for the service
   // start with our expected required inputs
   let jobData = {
      objectID: req.ab.param("ID"),
      values: {},
      // relocate the rest of the params as .values
   };

   // add in anything else we just want to pass along:
   var allParams = req.allParams();
   (Object.keys(allParams) || []).forEach((k) => {
      if (validationParams.indexOf(k) == -1) {
         jobData.values[k] = allParams[k];
      }
   });

   async.series(
      {
         create: (done) => {
            req.ab.serviceRequest(
               "appbuilder.model-post",
               jobData,
               (err, newItem) => {
                  done(err, newItem);
               }
            );
         },
         // trigger: (done) => {},
         // logger: (done) => {}
      },
      (err, results) => {
         if (err) {
            req.ab.log("api_sails:model-post:error:", err);
            res.ab.error(err);
            return;
         }

         // We want to broadcast the change from the server to the client so all datacollections can properly update
         // Build a payload that tells us what was updated
         var payload = {
            objectId: jobData.objectID,
            data: results.create,
         };

         // Broadcast the create
         sails.sockets.broadcast(
            req.ab.socketKey(jobData.objectID),
            "ab.datacollection.create",
            payload
         );

         req.ab.performance.log();
         res.ab.success(results.create);
      }
   );
};
