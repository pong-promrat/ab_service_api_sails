/**
 * appbuilder/netsuite-table-fields.js
 *
 *
 * url:     get /netsuite/table/:ID
 * header:  X-CSRF-Token : [token]
 * params:
 */

var inputParams = {
   ID: { string: true, required: true },
   credentials: { string: true, required: true },
};

// make sure our BasePath is created:
module.exports = function (req, res) {
   // Package the Find Request and pass it off to the service

   req.ab.log(`appbuilder::netsuite-table-fields`);

   // verify your inputs are correct:
   // false : prevents an auto error response if detected. (default: true)
   // valuesToCheck: {obj} a specified subset of the input values to validate.
   if (
      !(req.ab.validUser(/* false */)) ||
      !(req.ab.validBuilder(/* false */)) ||
      !req.ab.validateParameters(inputParams /*, false , valuesToCheck*/)
   ) {
      // an error message is automatically returned to the client
      // so be sure to return here;
      return;
   }

   // create a new job for the service
   let jobData = {
      ID: req.ab.param("ID"),
      credentials: req.ab.param("credentials"),
   };

   // pass the request off to the uService:
   req.ab.serviceRequest(
      "appbuilder.netsuite-table-fields",
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
