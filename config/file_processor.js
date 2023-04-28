/*
 * file_processor
 */
var path = require("path");
module.exports.file_processor = {
   /*************************************************************************/
   /* enable: {bool} is this service active?                                */
   /*************************************************************************/
   enable: false,

   /*************************************************************************/
   /* basePath: {string} the root directory for where to store files        */
   /*           make sure this matches the directory where the files volume */
   /*           is mapped to for the container.                             */
   /*                                                                       */
   /*           the final stored file path should be:                       */
   /*           basePath/[tenant.id]/file_processor/[filename.ext]          */
   /*************************************************************************/
   basePath: path.sep + path.join("data"),

   /*************************************************************************/
   /* uploadPath: {string} the directory (under basePath) where uploaded    */
   /*             files are stored.                                         */
   /*************************************************************************/
   uploadPath: "tmp",

   /*************************************************************************/
   /* maxBytes: {Number} max size of uploaded file                              */
   /*************************************************************************/
   maxBytes: 10000000,
};
