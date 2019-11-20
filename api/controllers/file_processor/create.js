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
const async = require("async");
const cote = require("cote");
const client = new cote.Requester({
    name: "api_sails > file_processor > create"
});
const path = require("path");
const shell = require("shelljs");
// setup our base path:
var pathFiles =
    sails.config.file_processor.basePath ||
    path.sep + path.join("data", "file_processor");

// create that path if it doesn't already exist:
shell.mkdir("-p", pathFiles);

// the possible parameters for this API call:
var params = ["appKey", "permission", "isWebix"];

// these parameters are required
var requiredParams = ["appKey", "permission"];

// make sure our BasePath is created:
module.exports = function(req, res) {
    // Package the Find Request and pass it off to the service

    req.ab.log(`file_processor::create`);

    // params
    var options = {};

    var fileEntry;
    // var fileRef;

    var serviceResponse;

    async.series(
        [
            // 1) finish downloading the file
            (next) => {
                req.file("file").upload(
                    {
                        // store the files in our TEMP path
                        dirname: path.join(
                            pathFiles,
                            sails.config.file_processor.uploadPath || "tmp"
                        ),
                        maxBytes:
                            sails.config.file_processor.maxBytes || 10000000
                    },
                    function(err, list) {
                        if (err) {
                            err.code = 500;
                            next(err);
                        } else {
                            fileEntry = list[0]; // info about file
                            console.log("... fileEntry:", fileEntry);

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

            // 2) read in the parameters
            (next) => {
                params.forEach(function(p) {
                    options[p] = req.param(p) || "??";
                });

                var missingParams = [];
                requiredParams.forEach(function(r) {
                    if (options[r] == "??") {
                        missingParams.push(r);
                    }
                });

                if (missingParams.length > 0) {
                    console.log("... missingParams:", missingParams);
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

            // 3) pass the job to the client
            (next) => {
                var jobData = {
                    name: fileEntry.fd.split(path.sep).pop(),
                    appKey: options.appKey,
                    permission: options.permission,
                    size: fileEntry.size,
                    type: fileEntry.type,
                    fileName: fileEntry.filename
                };

                // pass the request off to the uService:
                var coteParam = req.ab.toParam("file.upload", jobData);

                client.send(coteParam, (err, results) => {
                    serviceResponse = results;
                    next(err);
                });
            },

            // 3) package response to the client
            (next) => {
                sails.log(serviceResponse);

                // TODO: verify serviceResponse has uuid

                var data = {
                    uuid: serviceResponse.uuid
                };

                // if this was a Webix uploader:
                if (
                    options.isWebix != "??" &&
                    options.isWebix != "false" &&
                    options.isWebix != false
                ) {
                    data.status = "server";
                }

                res.json(data);
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

// TODO: testing:
// file larger than config setting, then there should be an error message "EFILETOOLARGE"

// SQL Injection on fields: tenant, appKey, permission
