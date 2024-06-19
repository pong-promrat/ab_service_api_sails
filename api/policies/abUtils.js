/*
 * ABUtils
 * initialize a default req.ab data structure and utilities for use
 * in our policies and api end points.
 */

var AB = require("@digiserve/ab-utils");

module.exports = (req, res, next) => {
   req.session = req.session || {};
   req.ab = AB.reqApi(req, res, sails.config);
   res.ab = AB.resApi(req, res);
   req.ab.log(`${req.method} ${req.path}`);

   next();
};
