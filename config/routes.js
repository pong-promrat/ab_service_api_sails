/**
 * Route Mappings
 * (sails.config.routes)
 *
 * Your routes tell Sails what to do each time it receives a request.
 *
 * For more information on configuring custom routes, check out:
 * https://sailsjs.com/anatomy/config/routes-js
 */

module.exports.routes = {
   /***************************************************************************
    *                                                                          *
    * SiteController                                                           *
    *                                                                          *
    * These routes are responsible for loading an initial HTML container to    *
    * load the AppBuilder.                                                     *
    *                                                                          *
    ***************************************************************************/
   "/": "SiteController.index",
   "get /admin": {
      controller: "SiteController",
      action: "index",
      useTenantID: true,
   },

   // Static Resources for our Web Clients
   "/favicon.ico": "SiteController.favicon",
   "get /sails.io.js": "SiteController.sailsio",

   "get /config": "SiteController.config",

   "post /auth/login": "auth/login",

   "get /query": "QueryController.query",

   // AB Model Routes:
   "get /model/find": "model/find",

   // file_processor routes:
   // "get  /file/:appKey/:uuid": "file_processor/read",
   "post /file/:appKey/:permission/:isWebix": "file_processor/create",

   /***************************************************************************
    *                                                                          *
    * More custom routes here...                                               *
    * (See https://sailsjs.com/config/routes for examples.)                    *
    *                                                                          *
    * If a request to a URL doesn't match any of the routes in this file, it   *
    * is matched against "shadow routes" (e.g. blueprint routes).  If it does  *
    * not match any of those, it is matched against static assets.             *
    *                                                                          *
    ***************************************************************************/
   // tenant_manager routes:
   // "/tenant_manager/find": "tenant_manager/find",

   // appbuilder routes:
   "get /app_builder/model/:ID": "appbuilder/model-get",
   "/multilingual/label-missing": "appbuilder/label-missing",

};
