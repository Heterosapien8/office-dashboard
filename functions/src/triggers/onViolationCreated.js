const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { db, admin } = require("../config/firebaseAdmin");

exports.onViolationCreated = onDocumentCreated("violations/{violationId}", async (event) => {
  const snapshot = event.data;
  if (!snapshot) {
    return;
  }

  const violation = snapshot.data();
  const now = admin.firestore.FieldValue.serverTimestamp();

  await db.collection("escalations").add({
    violationId: snapshot.id,
    readingId: violation.readingId || null,
    industryId: violation.industryId || null,
    industryName: violation.industryName || "Unknown Industry",
    roId: violation.roId || null,
    roName: violation.roName || null,
    status: "PENDING",
    severity: violation.severity || "medium",
    notes: "",
    inspectionDate: null,
    resolvedAt: null,
    resolvedBy: null,
    createdAt: now,
    updatedAt: now,
  });

  await db.collection("notifications").add({
    type: "violation",
    title: `Violation detected: ${violation.industryName || "Industry"}`,
    body: `${(violation.violatedParameters || [])
      .map((item) => `${item.parameter} exceeded limit`)
      .join(", ") || "Pollution limit exceeded"}.`,
    violationId: snapshot.id,
    recipientRoId: violation.roId || null,
    recipientUid: null,
    severity: violation.severity || "medium",
    isRead: false,
    createdAt: now,
  });
});

