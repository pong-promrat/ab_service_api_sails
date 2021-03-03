/**
 * appbuilder/labelMissing.js
 *
 *
 * url:     post /appbuilder/labelMissing
 * header:  X-CSRF-Token : [token]
 * params:
 */

var inputParams = {
   /*    "email": { string:{ email:true }, required:true }   */
   labels: {
      string: true,
      required: true,
      validate: (value) => {
         var jVal = value;
         var error = null;
         try {
            if (typeof value == "string") {
               jVal = JSON.parse(value);
            }

            // make sure it is an Array
            if (!Array.isArray(jVal)) {
               jVal = [jVal];
            }
         } catch (e) {
            jVal = value;
            error = "unable to parse labels into JSON";
            console.error("Cannot parse labels: ", value);
         }
         return { error, value: jVal };
      },
   },
};

// make sure our BasePath is created:
module.exports = function (req, res) {
   // Package the Find Request and pass it off to the service

   req.ab.log(`appbuilder::labelMissing`);

   // verify your inputs are correct:
   // false : prevents an auto error response if detected. (default: true)
   if (!req.ab.validateParameters(inputParams /*, false */)) {
      // an error message is automatically returned to the client
      // so be sure to return here;
      return;
   }

   var labels = req.ab.param("labels");

   req.ab.log("labels:", labels);

   // create a new job for the service
   let jobData = {
      labels,
   };

   // pass the request off to the uService:
   req.ab.serviceRequest("appbuilder.labelMissing", jobData, (err, results) => {
      if (err) {
         res.ab.error(err);
         return;
      }
      req.ab.performance.log();
      res.ab.success(results);
   });
};
