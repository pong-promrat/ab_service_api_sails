/**
 * file_processor/file-upload.js
 *
 *
 * @api {post} /file/upload/:objID/:fieldID Upload
 * @apiGroup File
 * @apiPermission User
 * @apiUse objID
 * @apiParam {string} fieldID
 * @apiQuery {string} [file_fullpath]
 * @apiUse successRes
 * @apiSuccess (200) {Object} data
 * @apiSuccess (200) {string} data.uuid
 * @apiSuccess (200) {string} data.status `"server"` if using a webix uploader
 */

const async = require("async");
const { error } = require("console");

var inputParams = {
   file: { string: true, required: true },
   photoID: { string: true, required: true }, // this is what the mobile expects the param to be called
   objID: { string: true, required: true },
   fieldID: { string: true, required: true },
   uploadedBy: { string: true, optional: true },
   size: { number: true, optional: true },
   type: { string: true, optional: true },
   fileName: { string: true, optional: true },
   /*    "email": { string:{ email: { allowUnicode: true }}, required:true }   */
   /*                -> NOTE: put .string  before .required                    */
   /*    "param": { required: true } // NOTE: param Joi.any().required();      */
   /*    "param": { optional: true } // NOTE: param Joi.any().optional();      */
};

// make sure our BasePath is created:
module.exports = function (req, res) {
   // Package the Find Request and pass it off to the service

   req.ab.log(`file_processor::file-upload-base64`);

   // verify your inputs are correct:
   if (
      !(req.ab.validUser(/* false */)) ||
      !req.ab.validateParameters(inputParams /*, false , valuesToCheck*/)
   ) {
      req.ab.log("... base64Params invalid");
      req.ab.log(error);
      // an error message is automatically returned to the client
      // so be sure to return here;
      return;
   } else {
      // log that all params are valid
      req.ab.log("... base64 all params are valid");
      // log the decoded file
      req.ab.log("... base64 file: --taking this out because too long");
   }

   var objID = req.ab.param("objID");
   var photoID = req.ab.param("photoID");
   var fieldID = req.ab.param("fieldID");
   var uploadedBy = req.ab.param("uploadedBy");
   var type = req.ab.param("type");
   var size = req.ab.param("size");
   var fileName = req.ab.param("fileName");
   var file = req.ab.param("file");

   // var fileEntry;
   // {obj}
   // this will contain all the uploaded information about our incoming file

   var serviceResponse;
   // {obj}
   // our response back from the file_processor.file-upload service

   async.series(
      [
         // 1) this used to wait until file was uploaded, is is nessicary now?
         (next) => {
            var maxBytes = sails.config.file_processor.maxBytes || 10000000;
            // the file is one of the params: req.param('file')
            // decode the file
            var fileData = Buffer.from(file, "base64");
            let fileSize = fileData.length;

            // fileEntry = fileData.fileEntry; // info about file
            // check size of file
            if (fileSize > maxBytes) {
               var err = new Error(
                  "File size exceeds maximum allowed: " + maxBytes
               );
               req.ab.notify.developer(err);
            } else {
               // req.ab.log(
               //    "... There is no fileEntry metadata in fileEntry-base64:"
               // );
               // // lookup metadata about the file on the object
               // if (fileData) {
               //    Object.keys(fileData).forEach((key) => {
               //       //log all keys
               //       req.ab.log("... fileData keys:", key);
               //    });
               next();
               // } else {
               //    var err2 = new Error("No file uploaded for parameter [file]");
               //    req.ab.notify.developer("err", {
               //       context:
               //          "api_sails:file_processor:create: file-base64. We are unable to extract the file data???",
               //    });
               //    // next();
               //    err2.code = 422;
               //    next(err2);
               // }
            }
            // });
         },

         // 3) pass the job to the client
         (next) => {
            var jobData = {
               // name: fileEntry.fd.split(path.sep).pop(),
               photoID: photoID,
               object: objID,
               field: fieldID,
               file: file, // raw base64 file
               size: size,
               type: type,
               fileName: fileName,
               uploadedBy: uploadedBy || req.ab.userDefaults().username,
            };

            // pass the request off to the uService:
            req.ab.serviceRequest(
               "file_processor.file-base64-upload",
               jobData,
               (err, results) => {
                  serviceResponse = results;
                  next(err);
               }
            );
         },

         // 3) package response to the client
         (next) => {
            // simplify response to .uuid only
            var data = {
               uuid: serviceResponse.uuid,
            };

            res.ab.success(data);
            next();
         },
      ],
      (err /*, results */) => {
         // handle error reporting back to the client
         if (err) {
            req.ab.log("api_sails:file_processor:create: error", err);
            res.ab.error(err);
         }
      }
   );
};
