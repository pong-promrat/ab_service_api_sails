/**
 * process_manager/inbox-register.js
 *
 *
 * url:     post /process/inbox/register
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

   req.ab.log(`process_manager::inbox-register`);

   // If there is no User, then we really can't do much from here.
   if (!req.ab.user) {
      req.ab.log("... No User Defined");
      res.ab.error("user not initialized.");
      return;
   }

   // If the request isn't coming in from a socket, we can't create
   // the real time updates.  But maybe it is as the configuration intends.
   if (!req.isSocket) {
      res.ab.success("sockets not enabled, so no real time updates.");
      return;
   }

   // create a new job for the service
   var jobData = {
      user: req.ab.user,
   };

   // pass the request off to the uService:
   req.ab.serviceRequest("user_manager.config", jobData, (err, configUser) => {
      // Subscribe to Relevant Socket Rooms:
      // 1) The User themselves
      // TODO: do we go by .username instead? See what is being saved in our
      // User connections and what would be available in the userform-create
      // handler:
      sails.sockets.join(req, req.ab.socketKey(configUser.uuid));

      // 2) all the Roles:
      (configUser.roles || []).forEach((role) => {
         sails.sockets.join(req, req.ab.socketKey(role.uuid));
      });

      res.ab.success("ready.");
   });
};
