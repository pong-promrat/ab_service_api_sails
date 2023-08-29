/**
 * file_processor/file-base64-upload.js
 *
 *
 * @api {post} /file/upload/base64/:objID/:fieldID Upload
 * @apiParam {string: base64} file
 * @apiParam {uuid} photoID
 * @apiParam {uuid} objID
 * @apiParam {uuid} fieldID
 * @apiParam {string} uploadedBy
 * @apiParam {number} size
 * @apiParam {string} type
 * @apiParam {string} fileName
 * @apiUse successRes
 * @apiSuccess (200) {Object} data
 * @apiSuccess (200) {string} data.uuid
 */

const async = require("async");
const { error } = require("console");

var inputParams = {
   file: { string: true, required: true },
   photoID: { string: true, required: true },
   objID: { string: true, required: true },
   fieldID: { string: true, required: true },
   uploadedBy: { string: true, required: true },
   size: { number: true, required: true },
   type: { string: true, required: true },
   fileName: { string: true, required: true },
};

module.exports = function (req, res) {
   // Package the Find Request and pass it off to the service
   req.ab.log(`file_processor::file-base64-upload`);

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
   }

   var objID = req.ab.param("objID");
   // {uuid}
   // this will contain the uploaded file
   var photoID = req.ab.param("photoID");
   // {uuid}
   // this will contain the uploaded file
   var fieldID = req.ab.param("fieldID");
   // {uuid}
   // this will contain the uploaded file
   var uploadedBy = req.ab.param("uploadedBy");
   // {string}
   // this is the owner of the file
   var type = req.ab.param("type");
   // {string}
   // this is the file type (image/png, image/jpeg, etc)
   var size = req.ab.param("size");
   // {number: int bytes}
   // size of uploaded file
   var fileName = req.ab.param("fileName");
   // {string}
   // uuid+name+extension of uploaded file
   var file = req.ab.param("file");
   // {string}
   // this will contain the uploaded file

   var serviceResponse;
   // {obj}
   // our response back from the file_processor.file-base64-upload service

   async.series(
      [
         // 1) this used to wait until file was uploaded, is is nessicary now?
         (next) => {
            var maxBytes = sails.config.file_processor.maxBytes || 10000000;
            // the file is one of the params: req.param('file')
            var fileData = Buffer.from(file, "base64");

            // check size of file
            if (fileData.length > maxBytes) {
               var err = new Error(
                  "File size exceeds maximum allowed: " + maxBytes
               );
               req.ab.notify.developer(err);
               next(err);
            } else {
               next();
            }
         },

         // 3) pass the job to the client
         (next) => {
            var jobData = {
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
            req.ab.log(
               "api_sails:file_processor:file-base64-upload: error",
               err
            );
            res.ab.error(err);
         }
      }
   );
};
