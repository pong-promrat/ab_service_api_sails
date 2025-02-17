const fs = require("fs");
const metricManager = require("./metricManager.js");

const NGINX_LOG_FILE_PATH = "/var/log/nginx/access_min.log";
const LOGGING_INTERVAL_SECONDS = 30;

module.exports = class NginxLogger {
   static start() {
      if (this._resetInterval) clearInterval(this._resetInterval);

      this._resetInterval = setInterval(async () => {
         const contents = await this._readLogFile();
         await this._clearLogFile();

         const loggings = contents.split("\n");
         loggings.forEach((logging) => {
            const { action, path, size } =
               this._extractInformation(logging) ?? {};

            if (!path) return;

            metricManager.logNginxBody({
               path: `${action} ${path}`,
               size: size ?? 0,
            });
         });
      }, LOGGING_INTERVAL_SECONDS * 1000);
   }

   static _readLogFile() {
      return new Promise((resolve, reject) => {
         fs.readFile(
            NGINX_LOG_FILE_PATH,
            { encoding: "utf8" },
            function (err, data) {
               if (err) {
                  reject(err);
                  return;
               }

               resolve(data);
            }
         );
      });
   }

   static _clearLogFile() {
      return new Promise((resolve, reject) => {
         fs.truncate(NGINX_LOG_FILE_PATH, 0, function (err) {
            if (err) {
               reject(err);
               return;
            }

            resolve();
         });
      });
   }

   static _extractInformation(logging) {
      if (!logging || logging.length === 0) return null;

      const actionPath = logging
         .match(/(").*(")/)[0]
         ?.replaceAll('"', "")
         .split(" ");
      const action = actionPath[0] ?? "";
      const path = actionPath[1]?.split("?")[0] ?? "";

      const statusCode =
         logging
            .match(/(\()\d+(\))/)[0]
            ?.replaceAll("(", "")
            .replaceAll(")", "") ?? "";

      const size = parseInt(
         logging
            .match(/(\{)\d+(\})/)[0]
            ?.replaceAll("{", "")
            .replaceAll("}", "") ?? 0
      );

      return {
         action,
         path,
         statusCode,
         size,
      };
   }
};
