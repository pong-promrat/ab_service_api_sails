/**
 * auth/whoami.js
 * @apiDescription Provide a simple { user:{username} } response if the user is logged in.
 *
 * @api {get} /auth/whoami
 * @apiGroup Auth
 * @apiPermission None
 * @apiUse successRes
 * @apiSuccess (200) {object} data
 * @apiSuccess (200) {object} data.user
 */

// var inputParams = {
//    tenant: { string: true, optional: true },
// };

module.exports = function (req, res) {
   req.ab.log("auth/whoami():");

   var user = req.ab.user;
   if (user) {
      res.ab.success({ user: user.username });
   } else {
      res.ab.reauth();
   }
};
