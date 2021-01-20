/**
 * appbuilder/model-get.js
 *
 *
 * url:     get appbuilder/model/:ID
 * header:  X-CSRF-Token : [token]
 * params:
 */

var inputParams = {
   ID: { string: true, required: true },
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

   req.ab.log(`appbuilder::model-get`);

   // verify your inputs are correct:
   // false : prevents an auto error response if detected. (default: true)
   if (!req.ab.validateParameters(inputParams /*, false */)) {
      // an error message is automatically returned to the client
      // so be sure to return here;
      return;
   }

   console.log(req.allParams());

   // create a new job for the service
   let jobData = {
      objectID: req.ab.param("ID"),
      // param : req.ab.param("param");
   };

   var fields = ["where", "sort", "offset", "limit"];
   fields.forEach((f) => {
      var val = req.param(f);
      if (val) {
         jobData[f] = val;
      }
   });

   // verify that the request is from a socket not a normal HTTP
   if (req.isSocket) {
      // Subscribe socket to a room with the name of the object's ID
      sails.sockets.join(req, jobData.objectID);
   }

   // pass the request off to the uService:
   req.ab.serviceRequest("appbuilder.model-get", jobData, (err, results) => {
      if (err) {
         res.ab.error(err);
         return;
      }
      res.ab.success(results);
   });
};
