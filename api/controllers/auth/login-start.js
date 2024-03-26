/**
 * auth/login-start.js
 * @apiDescription Start the login workflow based on the tenant's stategy
 *
 * @api {get} /auth/login Login Start
 * @apiGroup Auth
 * @apiPermission None
 */

const loginFunctions = {
   cas: require("../../lib/authUserCAS").login,
   okta: require("../../lib/authUserOkta").login,
   login: require("../../lib/authUserLocal").login,
};
const tenantOptionsCache = {
   // {lookupHash} tenantID : options object
   // Cache of a tenants options so we don't need to request from DB repeatedly
   //   - If the request has '??' or 'default' tenantID it means the tenant is
   //     not resolved yet. Use the local login auth with the tenant select.
   "??": { authType: "login" },
   default: { authType: "login" },
};

module.exports = async function (req, res) {
   req.ab.log("GET /auth/login");
   // Check tenant settings for which authType to use
   const tenantID = req.ab.tenantID;
   // If we don't have it cached, request from tenant manager
   if (!tenantOptionsCache[tenantID]) {
      const { options } = await req.ab.serviceRequest("tenant_manager.config", {
         uuid: tenantID,
      });

      tenantOptionsCache[tenantID] =
         typeof options === "object" ? options : JSON.parse(options);
   }
   const { authType, url } = tenantOptionsCache[tenantID];
   // Send the request to authenticatate using the tenant's setting
   const loginFn = loginFunctions[authType] ?? loginFunctions.login;
   loginFn(req, res, url);
};
