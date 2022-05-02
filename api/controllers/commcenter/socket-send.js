/**
 * commcenter/socket-send.js
 *
 *
 * url:     put /commcenter/socket/:key
 * header:  X-CSRF-Token : [token]
 * params:
 */

var inputParams = {
   key: { string: true, required: true },
   type: { string: true, required: true },
   to: { string: true, required: true },
   from: { string: true, required: true },
   qID: { string: true, optional: true },
   data: { required: true },
};

// make sure our BasePath is created:
module.exports = function (req, res) {
   // Package the Find Request and pass it off to the service

   req.ab.log(`commcenter::socket-send`);

   // verify your inputs are correct:
   if (
      !(req.ab.validUser(/* false */)) ||
      !req.ab.validateParameters(inputParams /*, false , valuesToCheck*/)
   ) {
      // an error message is automatically returned to the client
      // so be sure to return here;
      return;
   }

   // verify that the request is from a socket not a normal HTTP
   if (!req.isSocket) {
      res.ab.error("Requires Socket Connection");
      return;
   }

   let key = req.ab.param("key");

   // Subscribe socket to a room with the name of the provided key
   // NOTE: the client might have disconnected and reconnected it's socket
   // connection.  Make sure we are registered for the room we are sending on.
   sails.sockets.join(req, key);

   // create a new job for the service
   let jobData = {};

   // add our input values
   Object.keys(inputParams).forEach((k) => {
      let p = req.ab.param(k);
      if (p) {
         jobData[k] = p;
      }
   });

   // pass the request off to the uService:
   req.ab.serviceRequest("comm_socket.socket-send", jobData, (err, results) => {
      if (err) {
         res.ab.error(err);
         return;
      }
      res.ab.success(results);
   });
};
