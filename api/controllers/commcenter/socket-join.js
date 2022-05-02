/**
 * commcenter/socket-join.js
 *
 *
 * url:     post /commcenter/socket/:key
 * header:  X-CSRF-Token : [token]
 * params:
 */

var inputParams = {
   key: { string: true, required: true },
};

// make sure our BasePath is created:
module.exports = function (req, res) {
   // Package the Find Request and pass it off to the service

   req.ab.log(`commcenter::socket-join`);

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

   let socketKey = req.ab.param("key");

   // Subscribe socket to a room with the name of the provided key
   sails.sockets.join(req, socketKey);

   // create a new job for the service
   let jobData = {
      key: socketKey,
   };

   // pass the request off to the uService:
   req.ab.serviceRequest("comm_socket.socket-join", jobData, (err, results) => {
      if (err) {
         res.ab.error(err);
         return;
      }
      res.ab.success(results);
   });
};
