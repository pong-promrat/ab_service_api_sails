/**
 * definition_manager/definition-allapplications.js
 *
 *
 * url:     get /definition/allapplications
 * header:  X-CSRF-Token : [token]
 * params:
 */

var inputParams = {
   /*    "email": { string:{ email: { allowUnicode: true }}, required:true }   */
   /*                -> NOTE: put .string  before .required                    */
   /*    "param": { required: true } // NOTE: param Joi.any().required();      */
   /*    "param": { optional: true } // NOTE: param Joi.any().optional();      */
};

// make sure our BasePath is created:
module.exports = function (req, res) {
   // Package the Request and pass it off to the service

   req.ab.log(`definition_manager::definition-allapplications`);

   // verify User is able to access service:
   if (
      !(req.ab.validUser(/* false */)) ||
      !(req.ab.validBuilder(/* false */))
   ) {
      // an error message is automatically returned to the client
      // so be sure to return here;
      return;
   }

   // create a new job for the service
   let jobData = {};

   // pass the request off to the uService:
   req.ab.serviceRequest(
      "definition_manager.export-all",
      jobData,
      (err, result) => {
         if (err) {
            res.ab.error(err);
            return;
         }

         res.json(result.definitions);
      }
   );
};
