/**
 * auth/okta-callback
 * @apiDescription This is an Okta callback route to finalize sign on
 *
 * @api {get} /authorization-code/callback Okta Callback
 * @apiGroup Auth
 * @apiPermission None
 * @apiSuccess (302) redirect to /
 */
const passport = require("passport");
const authLogger = require("../../lib/authLogger.js");

module.exports = function (req, res) {
   req.ab.log("/authorization-code/callback");
   // if baseurl is api_sails replace with x-fowarded-host
   const baseUrl = /api_sails/.test(req.baseUrl)
      ? `https://${req.headers["x-forwarded-host"]}`
      : req.baseUrl;
   const callbackURL = `${baseUrl}/authorization-code/callback`;
   // This needs to exactly match the callbackURL sent to okta.
   // Note: req.baseUrl does not include the port number, so you'll
   // need to add for local testing.
   passport.authenticate("oidc", {
      callbackURL,
      failureRedirect: "/okta-error",
   })(req, res, (err /*, user */) => {
      if (err) {
         res.serverError(err);
         authLogger(req, "Okta auth error?");
         req.ab.notify.developer(err, {
            context: "Failed to authenticate user",
         });
         return;
      }
      // send the user back to the main app
      res.redirect("/");
      authLogger(req, "Okta auth successful");
   });
};
