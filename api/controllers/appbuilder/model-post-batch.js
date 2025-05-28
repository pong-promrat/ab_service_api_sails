/**
 * appbuilder/model-post-batch.js
 * @apiDescription Perform a Create operation on a batch of data managed by a specified
 * ABObject. This returns a fully populated row value of the newly created
 * entry.
 *
 * NOTE: the incoming data contains an .id value used on the client to identify
 * the entry.  This is not part of the data being stored, but a local reference.
 * Our return data references this .id to update the client with the results
 * for that entry.
 *
 * @api {post} /app_builder/model/:objID/batch Model Create Batch
 * @apiGroup AppBuilder
 * @apiParam {string} objID uuid of the ABObject to add to
 * @apiBody {array} batch records to add
 * @apiUse successRes
 * @apiSuccess (200) {object} data
 * @apiSuccess (200) {object} data.data entries that added successfully `{ id: rowEntry }`
 * @apiSuccess (200) {object} data.errors entries that could not be saved `{ id: error }`
 */
var inputParams = {
   objID: { string: { uuid: true }, required: true },
   batch: { array: true, required: true },
   keyColumnNames: { array: true, required: false, optional: true },
   /*    "email": { string:{ email: { allowUnicode: true }}, required:true }   */
   /*                -> NOTE: put .string  before .required                    */
   /*    "param": { required: true } // NOTE: param Joi.any().required();      */
};

const BroadcastManager = require("../../lib/broadcastManager");

// make sure our BasePath is created:
module.exports = async function (req, res) {
   // Package the Find Request and pass it off to the service

   req.ab.log(`appbuilder::model-post-batch`);

   var validationParams = Object.keys(inputParams);

   // in our preparations for the service, we only validate the required ID
   // param.
   var validateThis = {};
   (validationParams || []).forEach((p) => {
      validateThis[p] = req.param(p);
   });

   // verify your inputs are correct:
   // false : prevents an auto error response if detected. (default: true)
   if (
      !(req.ab.validUser(/* false */)) ||
      !req.ab.validateParameters(inputParams, true, validateThis)
   ) {
      // an error message is automatically returned to the client
      // so be sure to return here;
      return;
   }

   // verify that the request is from a socket not a normal HTTP
   if (req.isSocket) {
      BroadcastManager.register(req);
   }

   var objectID = req.ab.param("objID");
   var batch = req.ab.param("batch");
   const keyColumnNames = req.ab.param("keyColumnNames") ?? [];

   var allResults = {};
   var allErrors = {};

   const upsertTasks = [];
   batch.forEach((newRecord) => {
      const task = async () => {
         const dataRecord = newRecord.data;
         let rowIDs = [];

         // If Key field ids are specified, then we are fetching and updating it.
         if (keyColumnNames.length > 0) {
            const where = { glue: "and", rules: [] };
            keyColumnNames.forEach((colName) => {
               let value = dataRecord[colName];

               // If the value is an object with a single key, use that key's value
               if (typeof value === "object" && Object.keys(value)[0] != null) {
                  value = value[Object.keys(value)[0]];
               }

               value = value != null ? `'${value}'` : null;

               const rule = value != null ? "=" : "IS NULL";

               where.rules.push({
                  key: `\`${colName}\``,
                  rule,
                  value,
               });
            });

            (
               await req.ab.serviceRequest("appbuilder.model-get", {
                  objectID,
                  cond: { where, populate: false },
               })
            ).data.forEach((row) => {
               rowIDs.push(row.id);
            });
         }

         try {
            // newRecord: {hash}
            //   .id : {int} the client side id of an entry they are trying to create
            //   .data : {json} the key=>value hash of the new entry.
            allResults[newRecord.id] = (
               await submitJob(req, objectID, newRecord.data, rowIDs)
            )[0];
         } catch (err) {
            allErrors[newRecord.id] = err;
         }

         return Promise.resolve();
      };
      upsertTasks.push(task());
   });

   Promise.all(upsertTasks).then(() => {
      BroadcastManager.unregister(req);
      res.ab.success({
         data: allResults,
         errors: allErrors,
      });
   });
};

function submitJob(req, objectID, values, IDs = []) {
   const tasks = [];

   // create a new job for the service
   // start with our expected required inputs
   const jobData = {
      objectID,
      values,
      // relocate the rest of the params as .values
   };

   if (jobData.ID) {
      // NOTE: disable to broadcast slate.update because it spend long time to process. It might cause to socket timeout.
      jobData.disableStale = true;
   }

   do {
      jobData.ID = IDs?.pop();
      tasks.push(
         new Promise((resolve, reject) => {
            req.ab.serviceRequest(
               jobData.ID ? "appbuilder.model-update" : "appbuilder.model-post",
               jobData,
               {
                  // NOTE: When there are a lot of inserting row, then It will take more time to response.
                  // Set .longRequest to avoid timeout error.
                  longRequest: true,
               },
               (err, newItem) => {
                  if (err) {
                     req.ab.log("api_sails:model-post-batch:error:", err);
                     reject(err);
                     return;
                  }

                  resolve(newItem);
               }
            );
         })
      );
   } while (IDs.length > 0);

   return Promise.all(tasks);
}
