const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { db, admin } = require("../config/firebaseAdmin");
const { checkAirReadingAgainstLimits } = require("../utils/complianceChecker");

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

exports.onAirReadingCreated = onDocumentCreated("airReadings/{readingId}", async (event) => {
  const snapshot = event.data;
  if (!snapshot) {
    return;
  }

  const reading = snapshot.data();
  const violatedParameters = await checkAirReadingAgainstLimits(reading);

  if (!violatedParameters.length) {
    return;
  }

  const violationPayload = {
    readingId: snapshot.id,
    readingType: "air",
    roId: reading.roId || null,
    roName: reading.roName || null,
    industryId: reading.industryId || null,
    industryName: reading.industryName || "Unknown Industry",
    locationId: reading.locationId || null,
    violatedParameters,
    severity: getSeverity(violatedParameters),
    status: "open",
    source: reading.isSimulated ? "iot" : "manual",
    detectedAt: admin.firestore.FieldValue.serverTimestamp(),
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  await db.collection("violations").add(violationPayload);

  await snapshot.ref.set(
    {
      isViolation: true,
      violatedParameters: violatedParameters.map((item) => item.parameter),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
});

