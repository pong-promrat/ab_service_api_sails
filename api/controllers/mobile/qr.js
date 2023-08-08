/**
 * mobile/qr.js
 * @apiDescription Respond with the QR code image for a specified app
 *
 * @api {get} /mobile/qr/:ID
 * @apiGroup Mobile
 * @apiPermission None
 * @apiUse successRes
 * @apiSuccess (200) {html}
 */

const URL = require("node:url");

// var inputParams = {
//    tenant: { string: true, optional: true },
// };

module.exports = function (req, res) {
   req.ab.log("mobile/qr():");

   var user = req.ab.user;
   if (!user) {
      res.ab.reauth();
      return;
   }
   let appID = req.ab.param("ID");
   // let tenantID = req.ab.tenantID;

   console.log("req.headers[x-forwarded-for]:", req.headers["x-forwarded-for"]);
   console.log("req.connection.remoteAddress:", req.connection.remoteAddress);
   console.log("req.connection.remotePort:", req.connection.remotePort);

   const url = new URL.URL(
      req.headers.referer || req.hostname || req.headers["'x-forwarded-host"]
   );

   // create a new job for the service
   let jobData = {
      ID: appID,
      hostname: url.hostname || req.hostname, // "192.168.88.138:8080", // req.headers["x-forwarded-for"] || req.connection.remoteAddress, // "localhost:8080",
      protocol: url.protocol || req.protocol || "http",
      port: url.port,
   };

   // pass the request off to the uService:
   req.ab.serviceRequest("relay.app-qr", jobData, (err, imageDataURL) => {
      if (err) {
         res.ab.error(err, 500);
         return;
      }

      // Convert base64 dataURL into a binary image buffer
      let base64Text = imageDataURL.substring(22);
      let imageBuffer = Buffer.from(base64Text, "base64");

      res.set("Cache-Control", "max-age=0, no-store;");
      res.set("Content-Type", "image/png");
      res.send(imageBuffer);
   });
};
