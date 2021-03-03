/**
 * appbuilder/update.js
 *
 *
 * url:     put /app_builder/model/:objID/:ID
 * header:  X-CSRF-Token : [token]
 * params:
 */
const async = require("async");

var inputParams = {
   objID: { string: true, required: true },
   ID: { string: true, required: true },
   /*    "email": { string:{ email: { allowUnicode: true }}, required:true }   */
   /*                -> NOTE: put .string  before .required                    */
   /*    "param": { required: true } // NOTE: param Joi.any().required();      */
};

// make sure our BasePath is created:
module.exports = function (req, res) {
   // Package the Find Request and pass it off to the service

   req.ab.log(`appbuilder::model-update`);

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
   let jobData = {
      objectID: req.ab.param("objID"),
      ID: req.ab.param("ID"),
      values: {},
   };

   // Now collect any remaining Values and use them for the UPDATE data:
   var incomingValues = req.allParams();
   Object.keys(incomingValues).forEach((k) => {
      // skip anything we already validated
      if (validationParams.indexOf(k) == -1) {
         // try {
         //    jobData.values[k] = JSON.parse(incomingValues[k]);
         // } catch (e) {
         //    console.error(e, incomingValues[k]);
         //    req.ab.log(`${k}: ${incomingValues[k]}`);
         jobData.values[k] = incomingValues[k];
         // }
      }
   });

   async.series(
      {
         update: (done) => {
            req.ab.serviceRequest(
               "appbuilder.model-update",
               jobData,
               (err, results) => {
                  done(err, results);
               }
            );
         },

         // trigger : (done) => {}

         // logger : (done) => {}
      },
      (err, results) => {
         if (err) {
            res.ab.error(err);
            return;
         }

         // We want to broadcast the change from the server to the client so all datacollections can properly update
         // Build a payload that tells us what was updated
         var payload = {
            objectId: jobData.objectID,
            data: results.update,
         };

         // Broadcast the update
         sails.sockets.broadcast(
            req.ab.socketKey(jobData.objectID),
            "ab.datacollection.update",
            payload
         );

         req.ab.performance.log();
         res.ab.success(results.update);
      }
   );
};
