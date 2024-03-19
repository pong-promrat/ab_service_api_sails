/**
 * authUser
 * attempt to resolve which user this route is trying to work with.
 * this will either be from:
 * 1) Session
 *    - User prevously authenticated with local auth, okta, or CAS
 * 2) Relay Header
 *    - A valid relay header
 * 3) Auth Token
 *    - A valud user auth token
 *
 * If a user is found it will be set in req.ab.user. This is used elsewhere
 * to ensure the user is logged in and valid.
 *    req.ab.user : {ABSiteUser}
 *
 * This policy does not enforce log in. So the req will continue regardless
 * of outcome
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
const AB = require("@digiserve/ab-utils");
const passport = require("passport");

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

      if (req.isAuthenticated()) {
         req.ab.user = req.user;
         next(null, req.user);
      } else {
         // Check for Relay Header or Auth Token (these don't save to session)
         passport.authenticate(
            ["relay", "token"],
            { session: false },
            (err, user) => {
               if (user) {
                  req.ab.user = user;
                  next(null, user);
               } else {
                  // The user is not logged in, but that's not a problem here
                  next();
               }
            }
         )(req, res);
      }
   });
};
/**
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
