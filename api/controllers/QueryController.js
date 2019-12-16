/**
 * QueryControllerController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

// const cote = require("cote");
// const client = new cote.Requester({ name: "QueryController" });

module.exports = {
    /**
     * `QueryControllerController.query()`
     */
    query: async function(req, res) {
        console.log("request send:");

        res.json({ hello: "world", v: "3" });
        return;

        // client.send({ type: 'query' }, results => {
        //   console.log(results);
        //   res.json(results);
        // });
    }
};
