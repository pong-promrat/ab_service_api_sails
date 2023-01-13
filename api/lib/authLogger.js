const fs = require("fs").promises;

// This is the log file location within the ab_service_api_sails container
const LOG_FILE_PATH = "/var/log/appbuilder/auth.log";

/**
 * Log authentication attempts to a text file.
 * 
 * This allows fail2ban to block IP addresses if the site comes under attack.
 * 
 * @param {HTTPRequest} req
 *     User's IP address will be obtained through here
 * @param {string} message
 *     Should specify if the authentication failed or succeeded. Can also
 *     state the auth method.
 */
module.exports = async function authLogger(req, message) {
   try {
      const timestamp = new Date().toISOString();
      const file = await fs.open(LOG_FILE_PATH, "a");
      let ip = req.headers["x-forwarded-for"] 
         || req.headers["x-real-ip"]
         || req.connection?.remoteAddress
         || req.ip;
      if (ip.includes(",")) {
         // Ignore anything after a comma
         ip = ip.replace(/,.+/, "");
      }
      await file.write(`${timestamp}  [${ip}]  ${message}\n`);
      await file.close();
   }
   // Maybe the /var/log/appbuilder/ directory wasn't mounted in?
   catch (err) {
      console.log("authlogger: ", message);
      console.error(err);
   }
}
