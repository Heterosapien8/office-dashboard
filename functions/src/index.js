const { setGlobalOptions } = require("firebase-functions/v2");

const { onAirReadingCreated } = require("./triggers/onAirReadingCreated");
const { onWaterReadingCreated } = require("./triggers/onWaterReadingCreated");
const { onNoiseReadingCreated } = require("./triggers/onNoiseReadingCreated");
const { onViolationCreated } = require("./triggers/onViolationCreated");

setGlobalOptions({
  region: "asia-south1",
  maxInstances: 10,
});

exports.onAirReadingCreated = onAirReadingCreated;
exports.onWaterReadingCreated = onWaterReadingCreated;
exports.onNoiseReadingCreated = onNoiseReadingCreated;
exports.onViolationCreated = onViolationCreated;
