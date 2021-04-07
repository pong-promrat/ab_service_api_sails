/**
 * process_manager/inbox-update.js
 *
 *
 * url:     put /process/inbox/:ID
 * header:  X-CSRF-Token : [token]
 * params:
 */

var inputParams = {
   ID: { string: true, required: true },
   response: { string: true, required: true },
   /*    "email": { string:{ email: { allowUnicode: true }}, required:true }   */
   /*                -> NOTE: put .string  before .required                    */
   /*    "param": { required: true } // NOTE: param Joi.any().required();      */
   /*    "param": { optional: true } // NOTE: param Joi.any().optional();      */
};

// make sure our BasePath is created:
module.exports = function (req, res) {
   // Package the Find Request and pass it off to the service

   req.ab.log(`process_manager::inbox-update`);

   if (!req.ab.validateParameters(inputParams /*, false , valuesToCheck*/)) {
      // an error message is automatically returned to the client
      // so be sure to return here;
      return;
   }

   // create a new job for the service
   let jobData = {
      uuid: req.ab.param("ID"),
      response: req.ab.param("response"),
      user: req.ab.userDefaults().username,
   };

   // pass the request off to the uService:
   req.ab.serviceRequest(
      "process_manager.inbox-update",
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
