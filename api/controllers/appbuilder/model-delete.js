/**
 * appbuilder/model-delete.js
 * Perform a Delete operation on the data managed by a specified ABObject.
 *
 * url:     delete /app_builder/model/:objID/:ID
 * header:  X-CSRF-Token : [token]
 * return:  { numRows: {integer} }
 * params:
 */
var inputParams = {
   objID: { string: { uuid: true }, required: true },
   ID: { string: { uuid: true }, required: true },
   /*    "email": { string:{ email: { allowUnicode: true }}, required:true }   */
   /*                -> NOTE: put .string  before .required                    */
   /*    "param": { required: true } // NOTE: param Joi.any().required();      */
};

// make sure our BasePath is created:
module.exports = function (req, res) {
   // Package the Find Request and pass it off to the service

   req.ab.log(`appbuilder::model-delete`);

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

   // pass the request off to the uService:
   req.ab.serviceRequest("appbuilder.model-delete", jobData, (err, results) => {
      if (err) {
         req.ab.log("Error model-delete:", err);
         res.ab.error(err);
         return;
      }

      res.ab.success(results);
   });
};
