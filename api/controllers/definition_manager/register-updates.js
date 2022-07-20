/**
 * definition_manager/register-updates.js
 *
 *
 * url:     post /definition/register
 * header:  X-CSRF-Token : [token]
 * params:
 */

var inputParams = {
   /*    "email": { string:{ email: { allowUnicode: true }}, required:true }   */
   /*                -> NOTE: put .string  before .required                    */
   /*    "param": { required: true } // NOTE: param Joi.any().required();      */
   /*    "param": { optional: true } // NOTE: param Joi.any().optional();      */
};

// make sure our BasePath is created:
module.exports = function (req, res) {
   // Package the Find Request and pass it off to the service

   req.ab.log(`definition_manager::register-updates`);

   // verify your inputs are correct:
   if (
      !(req.ab.validUser(/* false */)) ||
      !(req.ab.validBuilder(/* false */))
      // || !req.ab.validateParameters(inputParams /*, false , valuesToCheck*/)
   ) {
      // an error message is automatically returned to the client
      // so be sure to return here;
      return;
   }

   // User must be using ABDesigner, so
   // Add User to definition.* rooms.
   // verify that the request is from a socket not a normal HTTP
   if (req.isSocket) {
      req.ab.log("Joining ABDesigner Updates");
      // Subscribe socket to a room with the name of the object's ID
      sails.sockets.join(req, req.ab.socketKey("abdesigner"));
   }

   res.ab.success({});
};
