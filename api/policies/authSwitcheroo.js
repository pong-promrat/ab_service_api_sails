/*
 * authSwitcheroo
 * Check to see if the current user is assigned a "switcheroo" id.  If so, then
 * we will impersonate that person for the remaining process.
 *
 */

module.exports = function (req, res, next) {
   req.ab.log(
      `Checking Switcheroo : ${req.session.switcherooID || "no switcheroo"}`
   );

   // if no switcheroo session ID has been set, then just continue:
   if (!req.session.switcherooID) {
      next();
      return;
   }

   req.ab.serviceRequest(
      "user_manager.user-find",
      { uuid: req.session.switcherooID },
      (err, user) => {
         if (err) {
            // unable to find registered user
            // clear out our switcherooID settings
            // and continue as normal
            delete req.session.switcherooID;
            next();
            return;
         }

         //
         req.ab.log("switcheroo user", user);
         req.ab.switcherooToUser(user);
         next();
      }
   );
};
