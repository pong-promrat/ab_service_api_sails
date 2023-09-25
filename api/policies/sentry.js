const Sentry = require("@sentry/node");

module.exports = async (req, res, next) => {
   const options = { user: ["id", "username"], transaction: "path" };
   await waitCallback(Sentry.Handlers.requestHandler(options), req, res);
   await waitCallback(Sentry.Handlers.tracingHandler(options), req, res);
   // Remove the domain name from the transaction name
   const regex = /([^:]+:)\/\/[^/]+(\/.*)/;
   if (!regex.test(res.__sentry_transaction.name)) {
      console.log(
         "Unmatched Sentry Transaction",
         res.__sentry_transaction.name
      );
      next();
   }
   const nameParts = res.__sentry_transaction.name.match(regex);
   res.__sentry_transaction.setName(`${nameParts[1]} ${nameParts[2]}`);
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
