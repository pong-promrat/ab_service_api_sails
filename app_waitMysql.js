/*
 * dbConn
 * manage and return a connection to our DB.
 */
const path = require("path");

const Mysql = require("mysql"); // our  {DB Connection}
const Sentry = require("@sentry/node");
const { version } = require("./package");
Sentry.init({
   dsn: "https://0363fe8e68b2fbd38a807305a3a1212c@o144358.ingest.sentry.io/4505945407488000",
   release: version,
   integrations: [
      new Sentry.Integrations.Http({ tracing: true }),
      new Sentry.Integrations.Express(),
   ],
});
var config = require(path.join(__dirname, "config", "local.js"));

var displayCount = 0;
function log(msg, lim) {
   displayCount += 1;
   if (displayCount > lim) {
      displayCount = 0;
   }

   if (displayCount == lim) {
      console.log(msg);
   }
}

function Connect(cb) {
   // attempt connection:
   var DB = Mysql.createConnection(config.datastores.site);
   // DB.on("error", (err) => {
   //    console.log("DB.on(error):", err);

   //    setTimeout(() => {
   //       Connect(cb);
   //    }, 250);

   //    DB.destroy();
   // });
   DB.connect(function (err) {
      if (err) {
         log("mysql not ready ... waiting.", 3);
         setTimeout(() => {
            Connect(cb);
         }, 500);
         return;
      }
      console.log("successful connection to mysql, continuing");
      DB.destroy();
      cb();
   });
}

Connect(() => {
   // now require the sails starter app.js
   require(path.join(__dirname, "app.js"));
});
