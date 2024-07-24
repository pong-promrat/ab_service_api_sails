const prometheus_client = require("prom-client");

const SOCKET_PAYLOAD_METRIC_NAME = "socket_payload_size";

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

   static async getMetrics() {
      return await prometheus_client.register.metrics();
   }

   static _getSize(obj) {
      return Buffer.byteLength(JSON.stringify(obj ?? {}));
   }

   static get contentType() {
      return prometheus_client.register.contentType;
   }

   static get _SocketPayloadLogger() {
      if (this.__socketPayloadLogger == null) {
         this.__socketPayloadLogger = new prometheus_client.Histogram({
            name: SOCKET_PAYLOAD_METRIC_NAME,
            help: "Socket response payload size",
            labelNames: ["event"],
            // Create 20 buckets, starting on 400 and a width of 100
            // https://github.com/siimon/prom-client?tab=readme-ov-file#bucket-generators
            buckets: prometheus_client.linearBuckets(400, 100, 20),
         });
      }

      return this.__socketPayloadLogger;
   }
};
