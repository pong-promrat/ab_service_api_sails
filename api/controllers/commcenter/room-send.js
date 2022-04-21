/**
 * commcenter/room-send.js
 *
 *
 * url:     put /commcenter/room/:key
 * header:  X-CSRF-Token : [token]
 * params:
 */

var inputParams = {
   key: { string: true, required: true },
   type: { string: true, required: true },
   to: { string: true, optional: true },
   from: { string: true, required: true },
   qID: { string: true, optional: true },
   data: { required: true },
};

// make sure our BasePath is created:
module.exports = function (req, res) {
   // Package the Find Request and pass it off to the service

   req.ab.log(`commcenter::room-send`);

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

   // assemble the packet info:
   let packet = {
      key,
      type: req.ab.param("type"),
      from: req.ab.param("from"),
      data: req.ab.param("data"),
   };

   // add optional values if they exist:
   Object.keys(inputParams).forEach((k) => {
      if (inputParams[k].optional) {
         let p = req.ab.param(k);
         if (p) {
            packet[k] = p;
         }
      }
   });

   sails.sockets.broadcast(socketKey, key, packet, req);

   res.ab.success();
};
