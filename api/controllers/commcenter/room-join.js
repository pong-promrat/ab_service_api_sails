/**
 * commcenter/room-join.js
 *
 *
 * url:     post /commcenter/room/:key
 * header:  X-CSRF-Token : [token]
 * params:
 */

var inputParams = {
   key: { string: true, required: true },
};

// make sure our BasePath is created:
module.exports = function (req, res) {
   // Package the Find Request and pass it off to the service

   req.ab.log(`commcenter::room-join`);

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

   let socketKey = req.ab.socketKey(key);

   // Subscribe socket to a room with the name of the object's ID
   sails.sockets.join(req, socketKey);

   let newClientID = req.ab.jobID; // just reuse our jobID?

   res.ab.success(newClientID);

   sails.sockets.broadcast(
      socketKey,
      key,
      {
         type: "client",
         id: newClientID,
         key,
      },
      req
   );
};
