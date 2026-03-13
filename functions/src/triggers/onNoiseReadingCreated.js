const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { admin, db } = require("../config/firebaseAdmin");
const { checkNoiseReadingAgainstLimits } = require("../utils/complianceChecker");

function getSeverity(violatedParameters) {
  if (!violatedParameters.length) {
    return "low";
  }

  const maxRatio = violatedParameters.reduce((currentMax, item) => {
    const ratio = item.limit > 0 ? item.measured / item.limit : 0;
    return Math.max(currentMax, ratio);
  }, 0);

  if (maxRatio >= 1.5) {
    return "critical";
  }
  if (maxRatio >= 1.2) {
    return "high";
  }
  return "medium";
}

function getNoiseStatus(level) {
  if (!Number.isFinite(level)) {
    return "good";
  }
  if (level > 75) return "violation";
  if (level > 65) return "poor";
  if (level > 55) return "moderate";
  return "good";
}

exports.onNoiseReadingCreated = onDocumentCreated("noiseReadings/{readingId}", async (event) => {
  const snapshot = event.data;
  if (!snapshot) {
    return;
  }

  const reading = snapshot.data();
  const violatedParameters = checkNoiseReadingAgainstLimits(reading);

  if (violatedParameters.length) {
    await db.collection("violations").add({
      readingId: snapshot.id,
      readingType: "noise",
      roId: reading.roId || null,
      roName: reading.roName || null,
      industryId: reading.industryId || null,
      industryName: reading.industryName || "Unknown Source",
      locationId: reading.locationId || null,
      violatedParameters,
      severity: getSeverity(violatedParameters),
      status: "open",
      source: reading.isSimulated ? "iot" : "manual",
      detectedAt: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  const peakNoiseLevel = Number(reading.noiseLevel);

  await snapshot.ref.set(
    {
      isViolation: violatedParameters.length > 0,
      violatedParameters: violatedParameters.map((item) => item.parameter),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  if (reading.locationId) {
    await db.collection("monitoringLocations").doc(reading.locationId).set(
      {
        currentStatus: violatedParameters.length ? "violation" : getNoiseStatus(peakNoiseLevel),
        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
        latestNoiseLevel: Number.isFinite(peakNoiseLevel) ? peakNoiseLevel : null,
        latestNoiseSummary: {
          averageNoiseLevel: Number.isFinite(Number(reading.averageNoiseLevel)) ? Number(reading.averageNoiseLevel) : null,
          peakNoiseLevel: Number.isFinite(peakNoiseLevel) ? peakNoiseLevel : null,
          monitoringTime: reading.monitoringTime || "Day",
          zone: reading.zone || "industrial",
          readingCount: reading.readingCount ?? null,
          isViolation: violatedParameters.length > 0,
        },
      },
      { merge: true }
    );
  }
});
