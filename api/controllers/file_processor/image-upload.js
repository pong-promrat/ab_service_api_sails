/**
 * file_processor/image-upload.js
 *
 *
 * url:     post /image/upload/:isWebix
 * header:  X-CSRF-Token : [token]
 * params:
 */

const async = require("async");
const path = require("path");
const shell = require("shelljs");

// setup our base path:
var pathFiles = sails.config.file_processor
   ? sails.config.file_processor.basePath
   : false || path.sep + path.join("data");

// expect that our location for storing files will be:
// /data/[tenant.ID]/file_processor
// /data/tmp  <<-- incoming file directory

// create that path if it doesn't already exist:
shell.mkdir("-p", pathFiles);

var inputParams = {
   isWebix: { string: true, optional: true },
   image_fullpath: { string: true, optional: true },
};

// make sure our BasePath is created:
module.exports = function (req, res) {
   // Package the Find Request and pass it off to the service

   req.ab.log(`file_processor::image-upload`);

   // verify your inputs are correct:
   if (
      !(req.ab.validUser(/* false */)) ||
      !req.ab.validateParameters(inputParams /*, false , valuesToCheck*/)
   ) {
      // an error message is automatically returned to the client
      // so be sure to return here;
      return;
   }

   const isWebix = req.ab.param("isWebix") || "??";

   var fileEntry;
   // {obj}
   // this will contain all the uploaded information about our incoming file

   var serviceResponse;
   // {obj}
   // our response back from the file_processor.file-upload service

   async.series(
      [
         // 1) finish downloading the file
         (next) => {
            // store the files in our TEMP path
            var dirname = path.join(
               pathFiles,
               sails.config.file_processor.uploadPath || "tmp"
            );
            var maxBytes = sails.config.file_processor.maxBytes || 10000000;
            req.file("image").upload(
               { dirname, maxBytes },
               function (err, list) {
                  if (err) {
                     req.ab.notify.developer(err, {
                        context:
                           "api_sails:file_processor:image-upload()",
                        isWebix,
                        dirname,
                        maxBytes,
                     });
                     err.code = 500;
                     next(err);
                  } else {
                     fileEntry = list[0]; // info about file
                     req.ab.log("... fileEntry:", fileEntry);

                     if (fileEntry) {
                        // fileRef = fileEntry.fd; // full path to file
                        next();
                     } else {
                        var err2 = new Error(
                           "No file uploaded for parameter [file]"
                        );
                        err2.code = 422;
                        next(err2);
                     }
                  }
               }
            );
         },

         /*
 *  Check to see if url params are ready before file.upload()
 *
         // 2) read in the parameters
         (next) => {
            params.forEach(function (p) {
               options[p] = req.param(p) || "??";
            });

            var missingParams = [];
            requiredParams.forEach(function (r) {
               if (options[r] == "??") {
                  missingParams.push(r);
               }
            });

            if (missingParams.length > 0) {
               req.ab.log("... missingParams:", missingParams);
               // var error = ADCore.error.fromKey('E_MISSINGPARAM');
               var error = new Error("Missing Parameter");
               error.key = "E_MISSINGPARAM";
               error.missingParams = missingParams;
               error.code = 422;
               next(error);
               return;
            }

            next();
         },
*/
         // 3) pass the job to the client
         (next) => {
            var jobData = {
               name: fileEntry.fd.split(path.sep).pop(),
               size: fileEntry.size,
               type: fileEntry.type,
               fileName: fileEntry.filename,
               uploadedBy: req.ab.userDefaults().username,
            };

            // pass the request off to the uService:
            req.ab.serviceRequest(
               "file_processor.image-upload",
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

            // if this was a Webix uploader:
            if (
               isWebix != "??" &&
               isWebix != "false" &&
               isWebix != false &&
               isWebix != 0
            ) {
               data.status = "server";
            }
            res.ab.success(data);
            next();
         },
      ],
      (err /*, results */) => {
         // handle error reporting back to the client
         if (err) {
            req.ab.log("api_sails:file_processor:image-upload: error", err);
            res.ab.error(err);
         }
      }
   );
};
