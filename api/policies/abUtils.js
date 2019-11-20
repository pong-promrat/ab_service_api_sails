/*
 * ABUtils
 * initialize a default req.ab data structure and utilities for use
 * in our policies and api end points.
 */

var AB = require("ab-utils");

module.exports = (req, res, next) => {
    req.ab = AB.reqAB();
    next();
};
