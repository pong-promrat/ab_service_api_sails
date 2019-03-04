/**
 * file_processor/create.js
 *
 * A system wide service to receive a file, store it locally, and send
 * back a uuid to reference this file.
 *
 * url:     POST /file/:appKey/:permission/:isWebix
 * header:  X-CSRF-Token : [token]
 * params:
 *      file  : the image you are uploading
 *      appKey  : a unique Application Key that this image belongs to
 *      permission : the PermissionAction.action_key required for a user
 *            to access this file
 *      isWebix : {bool} should I format the response for a Webix Uploader?
 */
const cote = require("cote");
const client = new cote.Requester({
  name: "api_sails->file_processor->create"
});
const shell = require("shelljs");
const shortid = require("shortid");

// setup our base path:
var pathFiles =
  sails.config.file_processor.basePath ||
  path.sep + path.join("data", "file_processor");

// create that path if it doesn't already exist:
shell.mkdir("-p", pathFiles);

// make sure our BasePath is created:
module.exports = function(req, res) {
  // Package the Find Request and pass it off to the service

  var jobID = shortid.generate();

  sails.log(`file_processor::create::${jobID}`);

  // create a new job for the file_processor
  let jobData = {
    jobID: jobID
  };

  var serviceResponse;

  async.series(
    [
      // 1) finish downloading the file
      next => {
        req.file("file").upload(
          {
            // store the files in our TEMP path
            dirname: tempPath,
            maxBytes: sails.config.opsportal.opimageupload.maxBytes || 10000000
          },
          function(err, list) {
            if (err) {
              err.code = 500;
              next(err);
            } else {
              fileEntry = list[0]; // info about file
              console.log("... fileEntry:", fileEntry);

              if (fileEntry) {
                fileRef = fileEntry.fd; // full path to file
                next();
              } else {
                var err = new Error("No file uploaded for parameter [file]");
                err.code = 422;
                next(err);
              }
            }
          }
        );
      },

      // 2) pass the job to the client
      next => {
        // pass the request off to the uService:
        client.send({ type: "file.upload", param: jobData }, (err, results) => {
          serviceResponse = results;
          next(err);
        });
      },

      // 3) package response to the client
      next => {
        sails.log(serviceResponse);
        res.json(serviceResponse);
        next();
      }
    ],
    (err, results) => {
      // handle error reporting back to the client
      if (err) {
        sails.log(results);
        res.json(results);
      }
    }
  );
};
