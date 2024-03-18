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
 * - [ ] refactor policy to only check login
 * - [ ] redirect to login
 * - []
 *
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

const isUserKnown = async (req, res, next) => {
   // Question: why don't we check req.session.passport.user?
   // Or use req.isAuthenticated()?

   // there are several ways a User can be specified:
   let key = null;
   let userID = null;

   // - session: user_id: {SiteUser.uuid}
   if (req.session && req.session.user_id) {
      req.ab.log("authUser -> session");
      userID = req.session.user_id;
      key = `${req.ab.tenantID}-${userID}`;
   }

   // TODO extract to a passort style auth
   // - Relay Header: authorization: 'relay@@@[accessToken]@@@[SiteUser.uuid]'
   if (req.headers && req.headers["authorization"]) {
      req.ab.log("authUser -> Relay Auth");
      let parts = req.headers["authorization"].split("@@@");
      if (
         parts[0] == "relay" &&
         sails.config.relay?.mcc?.enabled &&
         parts[1] == sails.config.relay.mcc.accessToken
      ) {
         userID = parts[2];
         key = `${req.ab.tenantID}-${userID}`;
         authLogger(req, "Relay auth successful");
      } else {
         // invalid authorization data:
         let message =
            "api_sails:authUser:Relay Header: Invalid authorization data";
         let err = new Error(message);
         req.ab.notify.developer(err, {
            context: message,
            authorization: req.headers["authorization"],
         });
         authLogger(req, "Relay auth FAILED");
         // redirect to a Forbidden
         return res.forbidden();
      }
   }

   // User is already authenticated
   if (key) {
      try {
         const user = await sails.helpers.user.findWithCache(
            req,
            req.ab.tenant,
            userID
         );
         req.ab.user = user;
         next(null, user);
         return true;
      } catch (err) {
         next(err);
         return false;
      }
   }

   // User is not authenticated
   return false;
};

module.exports = async (req, res, next) => {
   // TODO: Some calls in parallel?
   // If this req is from a signed-in user (via local, okta, or cas)
   // they will be authenticated by session
   await waitCallback(passport.initialize(), req, res);
   await waitCallback(passport.session(), req, res);
   console.log("|--> req.isAuthenticated", req.isAuthenticated);
   console.log("|--> req.isAuthenticated.()", req.isAuthenticated?.());
   console.log("|--> req.user", req.user);
   console.log("|--> req.session.user", req.session?.user);
   console.log("|--> req.session", req.session);
   if (req.session?.user) {
      req.ab.user = req.session.user;
   }
   const userKnown = isUserKnown(req, res, next);

   // Alternatively this req could be autenticated by token or relay header
   if (userKnown) return; // User is known, so next() was already called

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
