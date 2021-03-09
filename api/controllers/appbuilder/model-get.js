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
      objectID: req.ab.param("ID"),
      cond: {},
      // param : req.ab.param("param");
   };

   var fields = ["where", "sort", "skip", "offset", "limit", "populate"];
   fields.forEach((f) => {
      var val = req.param(f);
      if (val) {
         try {
            jobData.cond[f] = JSON.parse(val);
         } catch (e) {
            req.ab.log(e);
            jobData.cond[f] = val;
         }
      }
   });

   // move "skip" => "offset"
   if (jobData.cond.skip) {
      jobData.cond.offset = jobData.cond.skip;
      delete jobData.cond.skip;
   }

   // verify that the request is from a socket not a normal HTTP
   if (req.isSocket) {
      // Subscribe socket to a room with the name of the object's ID
      sails.sockets.join(req, req.ab.socketKey(jobData.objectID));
   }

   // pass the request off to the uService:
   req.ab.serviceRequest("appbuilder.model-get", jobData, (err, results) => {
      if (err) {
         req.ab.log("api_sails:model-get:error:", err);
         res.ab.error(err);
         return;
      }
      // req.ab.log(JSON.stringify(results));
      res.ab.success(results);
   });
};
