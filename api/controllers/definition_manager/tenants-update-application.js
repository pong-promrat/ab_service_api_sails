/**
 * definition_manager/tenants-update-application.js
 *
 *
 * url:     post /definition/tenants-update-application
 * header:  X-CSRF-Token : [token]
 * params:
 */
const inputParams = {
   /*    "email": { string:{ email: { allowUnicode: true }}, required:true }   */
   /*                -> NOTE: put .string  before .required                    */
   /*    "param": { required: true } // NOTE: param Joi.any().required();      */
   /*    "param": { optional: true } // NOTE: param Joi.any().optional();      */
};

// make sure our BasePath is created:
module.exports = function (req, res) {
   // Package the Find Request and pass it off to the service

   req.ab.log(`definition_manager::tenants-update-application`);

   // // if this isn't in the testing environment, 404!
   // if (typeof process.env.AB_TESTING == "undefined") {
   //    return res.notFound();
   // }

   // verify your inputs are correct:
   if (
      !(req.ab.validUser(/* false */)) ||
      !(req.ab.validBuilder(/* false */))
   ) {
      // an error message is automatically returned to the client
      // so be sure to return here;
      return;
   }

   const data = req.ab.param("data");

   try {
      // create a new job for the service
      const jobData = {
         data,
      };

      // pass the request off to the uService:
      req.ab.serviceRequest(
         "definition_manager.tenants-update-application",
         jobData,
         (error /*, results */) => {
            if (error) {
               req.ab.log("Error in tenants-update-application : ", error);
               res.ab.error(error);

               return;
            }
            res.ab.success({ done: true });
         }
      );
   } catch (error) {
      req.ab.log("tenants-update-application parse error", error);
      error.message = `json parse error : ${error.message}`;
      res.ab.error(error, 500);
   }
};
