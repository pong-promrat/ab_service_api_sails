/**
 * app_cli.js
 *
 * Performs a busy wait so that the docker container will continue to run,
 * while we log in and work on the cli.
 */

setInterval(() => {
   console.log("waiting ... go ahead and do the cli thang");
}, 2000);
