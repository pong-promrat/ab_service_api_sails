/**
 * SiteController
 *
 * @description :: handle the initial request for the page load
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */
const async = require("async");
const path = require("path");

var hashTitles = {
   /* tenant.uuid : tenant.options.title */
};

module.exports = {
   /**
    * get /
    * in cases where we are not embedded in another webpage, we can
    * return a default HTML container to load the AppBuilder in.
    */
   index: async function(req, res) {
      // req.ab.log("req.ab", req.ab);
      var title = "";
      if (hashTitles[req.ab.tenantID]) {
         title = hashTitles[req.ab.tenantID];
      }
      res.view(
         // path to template: "views/site/index.ejs",
         { title, v: "2", layout: false }
      );
      return;
   },

   /*
    * get /favicon.ico
    * determine which tenant's favicon.ico to return.
    */
   favicon: function(req, res) {
      var url;
      if (req.ab.tenantSet()) {
         url = `/assets/tenant/${req.ab.tenantID}/favicon.ico`;
      } else {
         url = "/assets/tenant/default/favicon.ico";
      }
      res.redirect();
   },

   /*
    * get /config
    * return the config data for the current request
    */
   config: function(req, res) {
      // we need to combine several config sources:
      // tenant: tenantManager.config (id:uuid)
      // user: userManager.config(id:uuid)
      // definitions: definitionManager.config(roles:user.roles);

      var configTenant = null;
      var configUser = null;
      var configSite = null;
      var configDefinitions = null;

      async.parallel(
         [
            (done) => {
               var jobData = {
                  uuid: req.ab.tenantID
               };

               // pass the request off to the uService:
               req.ab.serviceRequest(
                  "tenant_manager.config",
                  jobData,
                  (err, results) => {
                     configTenant = results;
                     done(err);
                  }
               );
            }
         ],
         (err) => {
            if (err) {
               console.log(err);
               res.ab.error(err, 500);
               return;
            }
            res.ab.success({
               tenant: configTenant,
               user: configUser,
               site: configSite,
               definitions: configDefinitions
            });
         }
      );

      // hashTitles[req.ab.tenantID] = tconfig.options.title;

      // res.send({
      //    status: "success",
      //    data: {
      //       tenant: {
      //          id: req.ab.tenantID,
      //          options: {
      //             title: "AppBuilder",
      //             textClickToEnter: "Click to Enter the AppBuilder"
      //          }
      //       }
      //    }
      // });
   },

   /*
    * get /logout
    * remove the current user's authentication
    */
   logout: function(req, res) {
      req.session.tenant_id = null;
      req.session.user_id = null;

      res.ab.success({});
   }
};
