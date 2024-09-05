/**
 * auth/reset-password-verify.js
 * @apiDescription Authenticate the user with tokens and redirect to
 * the reset password page, used in the reset password emails
 *
 * @api {post} /auth/password/reset Reset Verification
 * @apiGroup Auth
 * @apiPermission None
 * @apiQuery {string} t tenant ID
 * @apiQuery {string} a auth token
 * @apiSuccess (302) redirect redirect to login page
 */
const passport = require("passport");

var inputParams = {
   t: { string: true, optional: true }, // tenant ID
   a: { string: true, required: true }, // auth token
};

// make sure our BasePath is created:
module.exports = async function (req, res) {
   // Package the Find Request and pass it off to the service

   req.ab.log(`auth::reset-password-verify`);

   // verify your inputs are correct:
   if (!req.ab.validateParameters(inputParams /*, false , valuesToCheck*/)) {
      // an error message is automatically returned to the client
      // so be sure to return here;
      return;
   }

   // NOTE: in the /config route, the tenant_manager.config() handler
   // returns "default" if no tenant could be found for the request.
   // this should only happen if we have enabled the ability to access
   // a generic login that lets you choose which tenant to log into:
   if (!req.ab.tenantSet() || req.ab.tenantID == "default") {
      var tenant = req.ab.param("t");
      if (tenant) {
         req.ab.log(`using tenant: ${tenant}`);
         req.ab.tenantID = tenant;
      }
   }

   // token auth through passport
   req.headers["user-token"] = req.ab.param("a");
   const [err, user] = await new Promise((resolve) => {
      passport.authenticate(["token"], (...args) => resolve(args))(req, res);
   });
   if (err) {
      res.forbidden();
   }

   let defaultView = `appbuilder-view="auth_login_resetPassword"`;
   req.session.defaultView = defaultView;
   // save the user in session for passport (this keeps them logged in)
   req.session.passport = { user: user.uuid };

   // redirect to our base url
   res.redirect("/");
};
