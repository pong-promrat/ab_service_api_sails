/**
 * QueryControllerController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = function(req, res) {
   // Package the Find Request and pass it off to the service

   req.ab.log("model::find");

   // gather .find() parameters here
   let findData = {
      user: "userInfo",
      tenant: "tenantID",
      where: { id: 1 },
      sort: "asc",
      start: 0,
      limit: 20
   };

   req.ab.serviceRequest("model.find", findData, (err, results) => {
      req.ab.log(results);
      res.json(results);
   });
};
