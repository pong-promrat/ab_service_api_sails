/**
 * appbuilder/csv-export.js
 *
 *
 * url:     get /appbuilder/csv-export/:viewID
 * header:  X-CSRF-Token : [token]
 * params:
 */

var inputParams = {
   viewID: { string: true, required: true },
   where: { object: true, optional: true },
};

// make sure our BasePath is created:
module.exports = function (req, res) {
   // Package the Find Request and pass it off to the service

   req.ab.log(`appbuilder::csv-export`);

   // verify your inputs are correct:
   if (
      !(req.ab.validUser(/* false */)) ||
      !req.ab.validateParameters(inputParams /*, false , valuesToCheck*/)
   ) {
      // an error message is automatically returned to the client
      // so be sure to return here;
      return;
   }

   // create a new job for the service
   let jobData = {
      // param : req.ab.param("param");
      //         req.ab.param() : returns values that have passed validation
      //            and been normalized via the .validateParameters()
      // param2: req.param("param2")
      //         req.param()    : returns the raw values receive by sails.
      viewID: req.ab.param("viewID"),
   };

   if (req.ab.param("where")) {
      jobData.where = req.ab.param("where");
   }

   // pass the request off to the uService:
   req.ab.serviceRequest("appbuilder.csv-export", jobData, (err, results) => {
      if (err) {
         res.ab.error(err);
         return;
      }

      /*
      // TODO: figure out if Sails already has a mysql connection?
      // Or do we create our own?

      // mysql Version:
      let query = connection.query(results.sql);

      let hasErrored = false;

      // Set res header
      res.setHeader(
         "Content-disposition",
         `attachment; filename=${outputFilename}.csv`
      );

      query
         .on("error", (err) => {
            res.ab.error(err);
            hasErrored = true;
         })
         .on("result", (row) => {
            res.write(
               `${Object.values(row)
                  .map((r) => `"${r != null ? r : ""}"`) // To encode a quote, use "" to support , (comma) in text
                  .join(",")}\r\n`
            );
         })
         .on("end", () => {
            if (!hasErrored) {
               res.end();
            }
         });

      */

      // results.sql
      // knex.raw(sql).then((getKnexQuery) => {
      // let knexQuery = getKnexQuery();
      // let stream = knexQuery.stream();
      // if (!sqlStream) {
      //    return res.AD.error("Could not connect to SQL streaming", 500);
      // }
      //
      // // Set res header
      // res.setHeader(
      //    "Content-disposition",
      //    `attachment; filename=${outputFilename}.csv`
      // );
      //
      // sqlStream.on("close", () => {
      //    res.end();
      // });
      // sqlStream.on("finish", () => {
      //    res.end();
      // });
      //
      // sqlStream.on("data", (result) => {
      //    res.write(
      //       `${Object.values(result)
      //          .map((r) => `"${r != null ? r : ""}"`) // To encode a quote, use "" to support , (comma) in text
      //          .join(",")}\r\n`
      //    );
      // });
      // })

      res.ab.success(results);
   });
};
