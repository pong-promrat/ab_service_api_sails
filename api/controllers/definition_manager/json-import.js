/**
 * definition_manager/json-import.js
 *
 *
 * url:      /definition/import
 * header:  X-CSRF-Token : [token]
 * params:
 */

const fs = require("fs");

var inputParams = {
   /*    "email": { string:{ email: { allowUnicode: true }}, required:true }   */
   /*                -> NOTE: put .string  before .required                    */
   /*    "param": { required: true } // NOTE: param Joi.any().required();      */
   /*    "param": { optional: true } // NOTE: param Joi.any().optional();      */
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

   req.ab.log(`definition_manager::json-import`);

   // verify your inputs are correct:
   // false : prevents an auto error response if detected. (default: true)
   // valuesToCheck: {obj} a specified subset of the input values to validate.
   //    { [key] : [value] }
   //       [key] = inputParams[key] entry .
   //       [value] = req.param(value)
   //    if no values given, then req.allParams() are evaluated. In some cases
   //    you'll want to only require a certain subset of input values and then
   //    let the rest be evaluated by the destination service.
   // if (!req.ab.validateParameters(inputParams /*, false , valuesToCheck*/)) {
   //    // an error message is automatically returned to the client
   //    // so be sure to return here;
   //    return;
   // }

   req.ab.performance.mark("file.upload");
   req.file("upload").upload(function (err, files) {
      req.ab.performance.measure("file.upload");
      if (err) {
         req.ab.notify.developer(err, {
            context: "api_sails::definition_manager.json-import.js",
         });
         res.send({ status: "error" });
         //res.AD.error(err);
      } else if (!files || !files[0]) {
         // No file uploaded ...
         res.send({ status: "error" });
      } else {
         fs.readFile(files[0].fd, function (err, data) {
            if (err) {
               req.ab.notify.developer(err, {
                  context: "api_sails::definition_manager.json-import.js",
                  message: "error reading uploaded file.",
               });
               res.send({ status: "error" });
               //res.AD.error(err);
            } else {
               try {
                  var json = JSON.parse(data.toString());

                  // create a new job for the service
                  let jobData = {
                     json,
                  };

                  // pass the request off to the uService:
                  req.ab.serviceRequest(
                     "definition_manager.json-import",
                     jobData,
                     (err, results) => {
                        if (err) {
                           req.ab.log("Error in json-import : ", err);
                           res.ab.error(err);
                           return;
                        }
                        res.ab.success({ done: true });
                     }
                  );
               } catch (err) {
                  req.ab.log("json-import parse error", err);
                  err.message = `json parse error : ${err.message}`;
                  res.ab.error(err, 500);
               }
            }
         });
      }
   });
};
