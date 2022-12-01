/**
 * auth/switcheroo.js
 * Validate a request to switcheroo to another user.
 *
 * url:     post /auth/switcheroo/:userID
 * header:  X-CSRF-Token : [token]
 * return:  { user }
 * params:
 */
var inputParams = {
   userID: { string: true, required: true },
};

module.exports = function (req, res) {
   req.ab.log("auth/switcheroo:");

   // verify your inputs are correct:
   // false : prevents an auto error response if detected. (default: true)
   if (
      !req.ab.validateParameters(inputParams /*, true, validateThis */) ||
      !req.ab.validSwitcheroo()
   ) {
      // an error message is automatically returned to the client
      // so be sure to return here;
      return;
   }

   let userID = req.ab.param("userID");

   req.ab.log(`setting swticherooID => ${userID}`);
   req.session.switcherooID = userID;

   res.ab.success({ switcherooID: userID });
};
