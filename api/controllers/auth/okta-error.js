/**
 * auth/okta-error
 * @apiDescription Handle an error response from Okta auth
 *
 * @api {get} /okta-error Okta Error
 * @apiGroup Auth
 * @apiPermission None
 * @apiError (403) Forbidden
 */
module.exports = function (req, res) {
   let message = "Okta authentication error";
   let data = {
      session: req.session,
      headers: req.headers,
      url: req.url,
      user: req.user,
   };
   req.ab.notify.developer(message, data);

   res.forbidden(message);
};
