const prometheus_client = require("prom-client");

const SOCKET_PAYLOAD_METRIC_NAME = "socket_payload_size";
const NGINX_METRIC_NAME = "nginx_body_size";

module.exports = class MetricManager {
   static logSocketPayload({ event, data }) {
      const logger = this._SocketPayloadLogger;
      const size = this._getSize(data);

      logger.observe(
         {
            event,
         },
         size
      );
   }

   static logNginxBody({ path, size }) {
      const logger = this._NginxLogger;

      logger.observe(
         {
            path,
         },
         size
      );
   }

   static async getMetrics() {
      return await prometheus_client.register.metrics();
   }

   static setIntervalToReset(seconds = 30) {
      if (this._resetInterval) clearInterval(this._resetInterval);

      this._resetInterval = setInterval(() => {
         this._SocketPayloadLogger.reset();
         this._NginxLogger.reset();
      }, seconds * 1000);
   }

   static _getSize(obj) {
      return Buffer.byteLength(JSON.stringify(obj ?? {}));
   }

   static get contentType() {
      return prometheus_client.register.contentType;
   }

   static get _SocketPayloadLogger() {
      if (this.__socketPayloadLogger == null) {
         this.__socketPayloadLogger = new prometheus_client.Summary({
            name: SOCKET_PAYLOAD_METRIC_NAME,
            help: "Socket response payload size",
            labelNames: ["event"],
         });
         // this._socketPayloadLogger = new prometheus_client.Histogram({
         //    name: SOCKET_PAYLOAD_METRIC_NAME,
         //    help: "Socket response payload size",
         //    labelNames: ["event"],
         //    // Create 20 buckets, starting on 500 and a width of 500
         //    // https://github.com/siimon/prom-client?tab=readme-ov-file#bucket-generators
         //    buckets: prometheus_client.linearBuckets(500, 500, 10),
         // });
      }

      return this.__socketPayloadLogger;
   }

   static get _NginxLogger() {
      if (this.__nginxLogger == null) {
         this.__nginxLogger = new prometheus_client.Summary({
            name: NGINX_METRIC_NAME,
            help: "NGINX sent body size",
            labelNames: ["path"],
         });
      }

      return this.__nginxLogger;
   }
};
