/**
 * definition_manager/information-object.js
 *
 *
 * url:     get / /definition/info/object/:ID
 * header:  X-CSRF-Token : [token]
 * params:
 */
/**
 * @api {get} /definition/info/object/:ID Request DB Information of an object
 * @apiGroup AppBuilder
 * @apiPermission User
 * @apiParam {string} ID
 */

var inputParams = {
   ID: { string: { uuid: true }, required: true },
};

// make sure our BasePath is created:
module.exports = function (req, res) {
   req.ab.log(`definition_manager::information-object`);

   // verify your inputs are correct:
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
   };

   // pass the request off to the uService:
   req.ab.serviceRequest(
      "definition_manager.information-object",
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
