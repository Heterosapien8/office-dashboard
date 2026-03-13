const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { admin, db } = require("../config/firebaseAdmin");
const { checkWaterReadingAgainstLimits } = require("../utils/complianceChecker");

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

function getWaterStatus(summary) {
  const pH = Number(summary?.pH);
  const bod = Number(summary?.BOD);

  if ((Number.isFinite(pH) && (pH < 6.5 || pH > 8.5)) || (Number.isFinite(bod) && bod > 30)) {
    return "violation";
  }
  if ((Number.isFinite(pH) && (pH < 6.8 || pH > 8.2)) || (Number.isFinite(bod) && bod > 15)) {
    return "poor";
  }
  if ((Number.isFinite(pH) && (pH < 7.0 || pH > 8.0)) || (Number.isFinite(bod) && bod > 6)) {
    return "moderate";
  }
  return "good";
}

exports.onWaterReadingCreated = onDocumentCreated("waterReadings/{readingId}", async (event) => {
  const snapshot = event.data;
  if (!snapshot) {
    return;
  }

  const reading = snapshot.data();
  const violatedParameters = checkWaterReadingAgainstLimits(reading);

  if (violatedParameters.length) {
    await db.collection("violations").add({
      readingId: snapshot.id,
      readingType: "water",
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

  const summary = reading.summary || {};
  const locationUpdate = {
    currentStatus: violatedParameters.length ? "violation" : getWaterStatus(summary),
    lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
    latestWater: {
      waterType: reading.waterType || "natural",
      pH: summary.pH ?? null,
      BOD: summary.BOD ?? null,
      COD: summary.COD ?? null,
      TSS: summary.totalSuspendedSolids ?? summary.totalSolids ?? null,
      sampleCount: reading.sampleCount ?? null,
      isViolation: violatedParameters.length > 0,
    },
  };

  await snapshot.ref.set(
    {
      isViolation: violatedParameters.length > 0,
      violatedParameters: violatedParameters.map((item) => item.parameter),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  if (reading.locationId) {
    await db.collection("monitoringLocations").doc(reading.locationId).set(locationUpdate, { merge: true });
  }
});
