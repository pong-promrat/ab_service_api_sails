/*
 * authTenant
 * attempt to resolve which tenant this route is trying to work with.
 */
const cote = require("cote");
const client = new cote.Requester({
   name: "api_sails > authTenant"
});

var hashLookup = {
   /* urlPrefix : "tenantID", */
   /* "adroit"  : "adlkfjaldkfjasdlkfj", */
};

function isNumeric(n) {
   return !isNaN(parseFloat(n)) && isFinite(n);
}

const URL = require("url");

module.exports = (req, res, next) => {
   req.ab.log("... authTenant");

   // there are several ways a Tenant can be specified:

   // - cookie: tenant_id:'aedasl;dkfjasdlkfj'
   if (req.cookie && req.cookie.tenant_id) {
      req.ab.log("   -> cookie");
      req.ab.tenantID = req.cookie.tenant_id;
      next();
      return;
   }

   // - header: tenant_token: 'adslkfaldkfjaslk;jf'
   if (req.header && req.header.tenant_token) {
      req.ab.log("   -> token");
      req.ab.tenantID = req.header.tenant_token;
      next();
      return;
   }

   // - url: prefix :  http://fcf.baseurl.org
   var urlHostname = req.hostname;

   // if we are proxied by NGINX:
   if (urlHostname == "api_sails") {
      if (req.headers.referer) {
         urlHostname = req.headers.referer;
      }
   }

   var incomingURL = URL.parse(urlHostname);

   // console.log("incomingURL:", incomingURL);
   if (incomingURL.hostname) {
      var parts = incomingURL.hostname.split(".");
      var prefix = parts.shift();
      if (hashLookup[prefix]) {
         req.ab.log("   -> url:hashed");
         req.ab.tenantID = hashLookup[prefix];
         // be sure to set the cookie:
         res.cookie("tenant_id", req.ab.tenantID);
         next();
         return;
      }

      // should we try to perform a lookup by the prefix?
      if (prefix != "localhost" && !isNumeric(prefix)) {
         req.ab.log(`   -> tenant_manager.find(${prefix})`);

         var jobData = {
            key: prefix
         };

         var coteParam = req.ab.toParam("tenant_manager.find", jobData);
         client.send(coteParam, (err, results) => {
            if (err) {
               next(err);
               return;
            }
            if (results.uuid) {
               req.ab.log("   -> url:hashed");
               hashLookup[prefix] = results.uuid;
               req.ab.tenantID = results.uuid;
               // be sure to set the cookie:
               res.cookie("tenant_id", req.ab.tenantID);
            }

            next();
         });
      } else {
         // no Tenant ID known for this request
         // just keep going:
         next();
      }
   } else {
      next();
   }
};
