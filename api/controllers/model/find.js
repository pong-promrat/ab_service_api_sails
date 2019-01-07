/**
 * QueryControllerController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

const cote = require("cote");
const client = new cote.Requester({ name: "ModelFindRequestor" });

module.exports = function(req, res) {
  // Package the Find Request and pass it off to the service

  sails.log("Model.Find()");

  // gather .find() parameters here
  let findData = {
    user: "userInfo",
    tenant: "tenantID",
    where: { id: 1 },
    sort: "asc",
    start: 0,
    limit: 20
  };

  // pass the request off to the uService:
  client.send({ type: "model.find", param: findData }, results => {
    sails.log(results);
    res.json(results);
  });
};
