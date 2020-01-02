/**
 * Policy Mappings
 * (sails.config.policies)
 *
 * Policies are simple functions which run **before** your actions.
 *
 * For more information on configuring policies, check out:
 * https://sailsjs.com/docs/concepts/policies
 */

var defaultStack = ["abUtils", "authTenant"];

module.exports.policies = {
    /***************************************************************************
     *                                                                          *
     * Default policy for all controllers and actions, unless overridden.       *
     * (`true` allows public access)                                            *
     *                                                                          *
     ***************************************************************************/

    "*": defaultStack,

    // QueryController: {
    //     query: defaultStack
    // },

    //
    // api/controllers/model/  actions:
    //
    "model/*": defaultStack // all actions in model/**/**
    // 'model/find': [ policy1 ]
};
