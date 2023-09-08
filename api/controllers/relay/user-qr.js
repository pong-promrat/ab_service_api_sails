/**
 * relay/user-qr.js
 *
 *
 /** 
  * @api {GET} /relay/user-qr QR Code
  * @apiGroup Relay
  * @apiDescription Get a QR code to register the PWA
  * @apiPermission User
  * @apiSuccess (200) {image/png} image QR Code
  */

var inputParams = {};

// make sure our BasePath is created:
module.exports = function (req, res) {
   req.ab.log(`relay::user-qr`);

   if (
      !(req.ab.validUser(/* false */)) ||
      !req.ab.validateParameters(inputParams /*, false , valuesToCheck*/)
   ) {
      // an error message is automatically returned to the client
      // so be sure to return here;
      return;
   }

   // There is no data to send. The service just looks at the user UUID of
   // the current user.
   let jobData = {};

   req.ab.serviceRequest("relay.user-qr", jobData, (err, imageDataURL) => {
      if (err) {
         res.ab.error(err);
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
