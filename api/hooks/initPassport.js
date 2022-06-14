/**
 * Initialize the authUser Passport.js object.
 * @see api/policies/authUser.js
 */

module.exports = function(sails) {
    return {
        configure: function() {
            if (global.AB_AUTHUSER_INIT) {
                global.AB_AUTHUSER_INIT(sails);
            } else {
                console.warn("AB_AUTHUSER_INIT was not available.");
            }
        }
    };
};
