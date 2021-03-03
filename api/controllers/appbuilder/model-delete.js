/**
 * appbuilder/model-delete.js
 *
 *
 * url:     delete /app_builder/model/:objID/:ID
 * header:  X-CSRF-Token : [token]
 * params:
 */
const async = require("async");

var inputParams = {
   objID: { string: { uuid: true }, required: true },
   ID: { string: { uuid: true }, required: true },
   /*    "email": { string:{ email: { allowUnicode: true }}, required:true }   */
   /*                -> NOTE: put .string  before .required                    */
   /*    "param": { required: true } // NOTE: param Joi.any().required();      */
};
// { key : {validationObj} }
//   key: the name of the input parameter passed into the api
//   {validationObj} : description of the validation rules
//        An object hash describing the validation checks to use. At
//        the top level the Hash is: { [paramName] : {ruleHash} }
//        Each {ruleHash} follows this format:
//        "parameterName" : {
//           {joi.fn}  : true,  // performs: joi.{fn}();
//            {joi.fn} : {
//              {joi.fn1} : true,   // performs: joi.{fn}().{fn1}();
//              {joi.fn2} : { options } // performs: joi.{fn}().{fn2}({options})
//            }
//            // examples:
//            "required" : {bool},  // default = false
//
//            // custom:
//            "validation" : {fn} a function(value, {allValues hash}) that
//                           returns { error:{null || {new Error("Error Message")} }, result: {normalize(value)}}
//         }
//        (see https://joi.dev/api)

// make sure our BasePath is created:
module.exports = function (req, res) {
   // Package the Find Request and pass it off to the service

   req.ab.log(`appbuilder::model-delete`);

   // verify your inputs are correct:
   // false : prevents an auto error response if detected. (default: true)
   // valuesToCheck: {obj} a specified subset of the input values to validate.
   //    { [key] : [value] }
   //       [key] = inputParams[key] entry .
   //       [value] = req.param(value)
   //    if no values given, then req.allParams() are evaluated. In some cases
   //    you'll want to only require a certain subset of input values and then
   //    let the rest be evaluated by the destination service.
   if (!req.ab.validateParameters(inputParams /*, false , valuesToCheck*/)) {
      // an error message is automatically returned to the client
      // so be sure to return here;
      return;
   }

   // create a new job for the service
   let jobData = {
      objectID: req.ab.param("objID"),
      ID: req.ab.param("ID"),
   };

   async.series(
      {
         delete: (done) => {
            // pass the request off to the uService:
            req.ab.serviceRequest(
               "appbuilder.model-delete",
               jobData,
               (err, results) => {
                  done(err, results);
               }
            );
         },

         // trigger: (done) => {},
         // logger: (done) => {},
      },
      (err, results) => {
         if (err) {
            res.ab.error(err);
            return;
         }

         // We want to broadcast the change from the server to the client so all
         // datacollections can properly update
         // Build a payload that tells us what was deleted
         var payload = {
            objectId: jobData.objectID,
            id: jobData.ID,
         };

         // Broadcast the delete
         sails.sockets.broadcast(
            req.ab.socketKey(jobData.objectID),
            "ab.datacollection.delete",
            payload
         );

         req.ab.performance.log();
         res.ab.success(results.delete);
      }
   );
};
