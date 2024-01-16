/**
 * Seed Function
 * (sails.config.bootstrap)
 *
 * A function that runs just before your Sails app gets lifted.
 * > Need more flexibility?  You can also create a hook.
 *
 * For more information on seeding your app with fake data, check out:
 * https://sailsjs.com/config/bootstrap
 */

module.exports.bootstrap = async function (done) {
   // let sails continue
   done();

   // perform a manual healthcheck to establish our communications with
   // our services:
   sails.request("GET /healthcheck", (err, data) => {
      console.log("bootstrap: err:", err);
      console.log("bootstrap: data:", data);
   });

   process.on("unhandledRejection", (reason, promise) => {
      console.log("::::: UNHANDLED REJECTION :::::");
      console.log(reason);
   });

   process.on("uncaughtException", (reason, promise) => {
      console.log("::::: uncaughtException :::::");
      console.log(reason);
   });
};
