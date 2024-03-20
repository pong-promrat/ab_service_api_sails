/**
 * auth/login.js
 * @apiDescription Process the provided login email/password and establish a user session
 * if valid.
 *
 * @api {post} /auth/login Login
 * @apiGroup Auth
 * @apiPermission None
 * @apiUse email
 * @apiUse password
 * @apiUse tenantO
 * @apiUse successRes
 * @apiSuccess (200) {object} data
 * @apiSuccess (200) {object} data.user
 */
const passport = require("passport");
const authLogger = require("../../lib/authLogger.js");

module.exports = function (req, res) {
   req.ab.log("auth/login():");

   passport.authenticate("local")(req, res, (err) => {
      if (err) {
         res.ab.log("error logging in:", err);
         res.ab.error(err, 401);
         authLogger(req, "Local auth FAILED");
      } else {
         req.ab.log("successful auth/login");
         res.ab.success({ user: req.user });
         authLogger(req, "Local auth successful");
      }
   });
};
