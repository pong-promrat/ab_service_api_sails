/**
 * auth/switcherooClear.js
 * Remove a switcheroo assignment.
 *
 * url:     delete /auth/switcheroo
 * header:  X-CSRF-Token : [token]
 * return:  { user }
 * params:
 */

module.exports = function (req, res) {
   req.ab.log("auth/switcheroo/clear:");

   // verify your inputs are correct:
   // false : prevents an auto error response if detected. (default: true)
   // if (!req.ab.validSwitcheroo()) {
   //    // an error message is automatically returned to the client
   //    // so be sure to return here;
   //    return;
   // }

   req.ab.log(`removing swticherooID => ${req.session.switcherooID}`);
   delete req.session.switcherooID;

   res.ab.success({ success: true });
};
