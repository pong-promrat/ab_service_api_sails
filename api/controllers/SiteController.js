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

      // console.log();
      // console.log("===============");
      // console.log(sails);
      // console.log("===============");
      // console.log();

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
                  });
               })
               .catch((err) => {
                  // How did we get here?
                  req.ab.log(err);
                  res.ab.error(err);
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
    * post /auth/logout
    * remove the current user's authentication
    */
   authlogout: function (req, res) {
      req.session.tenant_id = null;
      req.session.user_id = null;

      res.ab.success({});
   }

   /*
    * post /auth/login
    * perform a user authentication credentials check
    */
   // authLogin: function(req, res) {
   //    req.ab.log("authLogin:");

   //    var email = req.param("email");
   //    var password = req.param("password");

   //    if (!req.ab.tenantSet()) {
   //       var tenant = req.param("tenant");
   //       if (tenant) {
   //          req.ab.tenantID = tenant;
   //       }
   //    }

   //    req.ab.serviceRequest(
   //       "user_manager.find.password",
   //       { email, password },
   //       (err, user) => {
   //          if (err) {
   //             req.ab.log("error logging in:", err);
   //             res.ab.error(err, 401);
   //             return;
   //          }
   //          req.ab.log("successful auth/login");
   //          req.session.tenant_id = req.ab.tenantID;
   //          req.session.user_id = user.uuid;
   //          res.ab.success({ user });
   //       }
   //    );
   // }
};
