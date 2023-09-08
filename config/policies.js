/**
 * Policy Mappings
 * (sails.config.policies)
 *
 * Policies are simple functions which run **before** your actions.
 *
 * For more information on configuring policies, check out:
 * https://sailsjs.com/docs/concepts/policies
 */

var defaultStack = ["abUtils", "authTenant", "authUser", "authSwitcheroo"];
var noAuth = ["abUtils", "authTenant"];

module.exports.policies = {
   SiteController: {
      favicon: noAuth,
      // sailsio: noAuth,  // <-- now served by nginx
   },

   /***************************************************************************
    *                                                                          *
    * Default policy for all controllers and actions, unless overridden.       *
    * (`true` allows public access)                                            *
    *                                                                          *
    ***************************************************************************/

   "*": defaultStack,
};
