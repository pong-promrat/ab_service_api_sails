const Sentry = require("@sentry/node");

module.exports = async (req, res, next) => {
   if (!process.env.SENTRY) return next();
   const options = { user: ["id", "username"], transaction: "path" };
   await waitCallback(Sentry.Handlers.requestHandler(options), req, res);
   const path = req.route.path;
   req.ab.spanRequest(path, {
      op: req.protocol == "ws" ? "websocket.server" : "http.server",
   });
   // Queue the end of the tracing span
   res.once("finish", () => {
      setImmediate(() => req.ab.spanEnd(path));
   });
   next();
};

/**
 * Utility - wrap a function with callback in a promise that passes resolve as
 * the callback
 * @function waitCallback
 * @param {function} fn to call with the last arg being a callback
 * @param {...*} params any param to pass to the fn before the callback
 */
function waitCallback(fn, ...params) {
   return new Promise((resolve) => fn(...params, resolve));
}
