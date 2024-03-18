/**
 * authUser
 * attempt to resolve which user this route is trying to work with.
 * When this step is completed, there should be 1 of 3 conditions:
 *    1) A User has not been resolved:
 *       req.ab.passport : {Passport}
 *       req.session.user_id : {null or undefined}
 *       req.ab.user : {null or undefined}
 *
 *    2) A User is defined in the session info:
 *       This means the User has been looked up via the session info
 *       req.session.user_id : {SiteUser.uuid}
 *       req.ab.user : {json of SiteUser entry}
 *
 * The only time the session info is set is during the auth/login.js
 * routine.  After a successful login, the session.user_id is set.
 */
/**
 * TODO
 * - redirect to login
 * - check what should authlohher be doing
 * - test all auth types:
 *     - local
 *     - cas
 *     - okta
 *     - token
 *     - relay
 */
const authCAS = require(__dirname + "/../lib/authUserCAS.js");
const authLocal = require(__dirname + "/../lib/authUserLocal.js");
const authOkta = require(__dirname + "/../lib/authUserOkta.js");
const authToken = require(__dirname + "/../lib/authUserToken.js");
const authLogger = require(__dirname + "/../lib/authLogger.js");
const AB = require("@digiserve/ab-utils");
const passport = require("passport");

const Cache = require("../lib/cacheManager");

var commonRequest = {};
// {lookupHash} /* user.uuid : Promise.resolves(User) */
// A shared lookup hash to reuse the same user lookup when multiple attempts
// are being attempted in parallel.

const tenantOptionsCache = {
   // {lookupHash} tenantID : options object
   // Cache of a tenants options so we don't need to request from DB repeatedly
   //   - If the request has '??' or 'default' tenantID it means the tenant is
   //     not resolved yet. Use the local login auth with the tenant select.
   "??": { authType: "login" },
   default: { authType: "login" },
};

module.exports = async (req, res, next) => {
   // TODO: Some calls in parallel?
   // If this req is from a signed-in user (via local, okta, or cas)
   // they will be authenticated by session
   passport.session()(req, res, () => {
      console.log("|--> req.isAuthenticated", req.isAuthenticated);
      console.log("|--> req.isAuthenticated.()", req.isAuthenticated?.());
      console.log("|--> req.user", req.user);
      console.log("|--> req.session.user", req.session?.user);
      console.log("|--> req.session", req.session);

      if (req.user) {
         req.ab.user = req.session.user;
         next(null, req.user);
      } else {
            // __AUTO_GENERATED_PRINTF_START__
            console.log("pasport.authenticate"); // __AUTO_GENERATED_PRINTF_END__
         // Check for Relay Header or Auth Token
         passport.authenticate(["relay", "token"], (err, user) => {
            // __AUTO_GENERATED_PRINTF_START__
            console.log("pasport.authenticate cb"); // __AUTO_GENERATED_PRINTF_END__

            if (user) {
               req.ab.user = user;
               next(null, user);
            } else {
               // The user is not logged in, but that's not a problem here
               next()
            }
         })(req, res, next);
      }
   });

   const validToken = await authToken.middleware(req, res, next);
   if (validToken) return; // Token was valid, so next() was already called

   // return here the use is either logged in or not at this point
   // responsibility elsewhere to handle login
   return;

   // User needs to Authenticate, check tenant settings for authType to use
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
   const authMiddlewares = {
      cas: authCAS.middleware,
      okta: authOkta.middleware,
      login: authLocal.middleware,
   };
   const authMiddleware = authMiddlewares[authType] ?? authMiddlewares.login;
   authMiddleware(req, res, next, url);
};

/**
 * Utility - wrap a function with callback in a promise that passes resoves as
 * the callback
 * @function waitCallback
 * @param {function} fn to call with the last arg being a callback
 * @param {...*} params any param to pass to the fn before the callback
 */
function waitCallback(fn, ...params) {
   return new Promise((resolve) => fn(...params, resolve));
}
