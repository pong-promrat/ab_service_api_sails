/**
 * QueryControllerController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

const cote = require("cote");
const client = new cote.Requester({ name: "api_sails > model > find" });

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

    var coteParam = req.ab.toParam("model.find", findData);

    console.log(coteParam);

    // pass the request off to the uService:
    client.send(coteParam, (err, results) => {
        req.ab.log(results);
        res.json(results);
    });
};
