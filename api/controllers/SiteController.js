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
   // labelMissing: function (req, res) {
   //    console.log("!!!! LabelMissing !!!!");
   //    res.ab.success({ done: true });
   // },
   /**
    * get /
    * in cases where we are not embedded in another webpage, we can
    * return a default HTML container to load the AppBuilder in.
    */
   index: async function (req, res) {
      // req.ab.log("req.ab", req.ab);
      var title = "";
      if (hashTitles[req.ab.tenantID]) {
         title = hashTitles[req.ab.tenantID];
      }
      var tenantID = "";
      // {string} tenantID
      // the default tenantID the loaded AB_Runtime should be working with

      // if a tenant is set from our policies:
      if (req.ab.tenantSet()) {
         tenantID = `appbuilder-tenant="${req.ab.tenantID}"`;
      }
      // if a tenantID was set due to our route:  get /admin
      // then include that here (override the policies)
      if (req.options.useTenantID) {
         tenantID = `appbuilder-tenant="${sails.config.tenant_manager.siteTenantID}"`;
      }

      res.view(
         // path to template: "views/site/index.ejs",
         { title, v: "2", layout: false, tenantID }
      );
      return;
   },

   /*
    * get /favicon.ico
    * determine which tenant's favicon.ico to return.
    */
   favicon: function (req, res) {
      var url;
      if (req.ab.tenantSet()) {
         url = `/assets/tenant/${req.ab.tenantID}/favicon.ico`;
      } else {
         url = "/assets/tenant/default/favicon.ico";
      }
      console.log("/favicon.ico : resolving to :" + url);
      res.redirect(url);
   },

   /*
    * get /sails.io.js
    * return our common sails.io library.
    */
   sailsio: function (req, res) {
      var options = {
         root: path.join(__dirname, "..", "..", "assets", "dependencies"),
      };
      res.sendFile("sails.io.js", options, (err) => {
         if (err) {
            console.error(err);
         }
      });
   },

   /*
    * get /config
    * return the config data for the current request
    */
   config: function (req, res) {
      // we need to combine several config sources:
      // tenant: tenantManager.config (id:uuid)
      // user: userManager.config(id:uuid)
      // definitions: definitionManager.config(roles:user.roles);
      // labels: appbuilder.labels("en")

      var configDefinitions = null;
      // {array} [ {ABDefinition}, {ABDefinition}, ...]
      // The list of ABxxxx definitions to send to the Web client to create
      // the applications to display.

      var configInbox = null;
      // {array} [ {ABDefinition}, {ABDefinition}, ...]
      // The list of ABxxxx definitions to send to the Web client to create
      // the applications to display.

      var configLabels = null;
      // {obj} { key: text }
      // The labels used by the web platform to display.  They will be in the
      // language of the user that is running this request.

      var configSite = null;
      // {obj} configSite
      // The information details for this site, used by the WEB platform to
      // process it's operation:
      //    .tenants: {array} of different Tenant options

      var configTenant = null;
      // {obj}
      // The configuration information for the CURRENT Tenant this request is
      // associated with.
      //    .id : {uuid}
      //    .options: {obj} Configuration Details for the current Tenant's
      //              operation.
      //     ??   .authType: {string}
      //     ??   .networkType: {string} the type of Network access to the server
      //    .title: {string}
      //    .clickTextToEnter: {string}

      var configUser = null;
      // {obj} configUser
      // The User information for the CURRENT User that is making this request.

      var configMeta = {};
      // {obj} configMeta
      // The Web platform also requires additional info about Roles/Scopes/Users
      // to function.
      // configMeta.roles : {array} of all SiteRoles
      // configMeta.scopes: {array} of all Scopes
      // configMeta.users : {array} of all users (just { username } )

      async.parallel(
         [
            (done) => {
               var jobData = {
                  uuid: req.ab.tenantID,
               };
               req.ab.log("/config jobData:", jobData);

               // pass the request off to the uService:
               req.ab.serviceRequest(
                  "tenant_manager.config",
                  jobData,
                  (err, results) => {
                     configTenant = results;
                     done(err);
                  }
               );
            },

            (done) => {
               // if a user isn't set, then just leave user:null
               if (!req.ab.user) {
                  done();
                  return;
               }

               var jobData = {
                  user: req.ab.user,
               };

               // pass the request off to the uService:
               req.ab.serviceRequest(
                  "user_manager.config",
                  jobData,
                  (err, results) => {
                     configUser = results;
                     done(err);
                  }
               );
            },

            (done) => {
               var jobData = {};

               // pass the request off to the uService:
               req.ab.serviceRequest(
                  "tenant_manager.config.list",
                  {},
                  (err, results) => {
                     if (results) {
                        configSite = {
                           tenants: results,
                        };
                     }
                     done(err);
                  }
               );
            },

            (done) => {
               // default to "en" labels
               var langCode = "en";
               if (req.ab.user) {
                  langCode = req.ab.user.languageCode;
               }

               var jobData = {
                  languageCode: langCode,
               };
               req.ab.log("label job data:", jobData);
               req.ab.log("user:", req.ab.user);

               // pass the request off to the uService:
               req.ab.serviceRequest(
                  "appbuilder.labels",
                  jobData,
                  (err, results) => {
                     configLabels = results;
                     done(err);
                  }
               );
            },
         ],
         (err) => {
            if (err) {
               console.log(err);
               res.ab.error(err, 500);
               return;
            }

            Promise.resolve()
               .then(() => {
                  // if a user isn't set, then just leave user:null
                  if (!req.ab.user) {
                     return;
                  }

                  return new Promise((resolve /* , reject */) => {
                     req.ab.log("configUser:", configUser);

                     async.parallel(
                        [
                           // Pull the Definitions for this user
                           (done) => {
                              var jobData = {
                                 roles: configUser.roles,
                              };

                              // pass the request off to the uService:
                              req.ab.serviceRequest(
                                 "appbuilder.definitionsForRoles",
                                 jobData,
                                 (err, results) => {
                                    if (err) {
                                       req.ab.log("error:", err);
                                       return;
                                    }
                                    configDefinitions = results;
                                    done();
                                 }
                              );
                           },

                           // Pull the Inbox Items for this User
                           (done) => {
                              var jobData = {
                                 users: [configUser.username],
                                 roles: configUser.roles,
                              };
                              // pass the request off to the uService:
                              req.ab.serviceRequest(
                                 "process_manager.inbox.find",
                                 jobData,
                                 (err, results) => {
                                    if (err) {
                                       req.ab.log("error:", err);
                                       return;
                                    }
                                    configInbox = results;
                                    done();
                                 }
                              );
                           },

                           // Pull the Config-Meta data
                           (done) => {
                              req.ab.serviceRequest(
                                 "appbuilder.config-meta",
                                 {},
                                 (err, results) => {
                                    if (err) {
                                       req.ab.log("error:", err);
                                       return;
                                    }
                                    configMeta = results;
                                    done();
                                 }
                              );
                           },
                        ],
                        (err) => {
                           if (err) {
                              reject(err);
                              return;
                           }
                           resolve();
                        }
                     );
                  });
               })
               .then(() => {
                  res.ab.success({
                     definitions: configDefinitions,
                     inbox: configInbox,
                     labels: configLabels,
                     site: configSite,
                     tenant: configTenant,
                     user: configUser,
                     meta: configMeta,
                  });
               })
               .catch((err) => {
                  // How did we get here?
                  req.ab.log(err);
                  res.ab.error(err);
               });
         }
      );
   },

   /*
    * get /plugin/:key
    * return the proper path for the plugin requested for this Tenant.
    */
   pluginLoad: function (req, res) {
      var key = req.param("key");
      // {string} should resolve to the filename: {key}.js of the plugin
      // file to load.

      req.ab.log(`/plugin/${key}`);
      if (key.indexOf("ABDesigner.") == 0) {
         // ABDesigner is our common plugin for all Tenants.
         // We share the same tenant/default/ABDesigner.js file
         return res.redirect(`/assets/tenant/default/${key}`);
      }
      if (req.ab.tenantSet()) {
         // Other plugins are loaded in reference to the tenant and
         // what they have loaded.
         return res.redirect(`/assets/tenant/${req.ab.tenantID}/${key}.js`);
      }
      res.ab.error(new Error("not tenant set. Login first."));
   },
};
