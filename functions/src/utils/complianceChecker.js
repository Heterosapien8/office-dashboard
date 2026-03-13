const { db } = require("../config/firebaseAdmin");

const NATURAL_WATER_LIMITS = {
  temperature: { limitMax: 40, unit: "deg C" },
  pH: { limitMin: 6.5, limitMax: 8.5, unit: "" },
  turbidity: { limitMax: 10, unit: "NTU" },
  conductivity: { limitMax: 1500, unit: "uS/cm" },
  totalSolids: { limitMax: 500, unit: "mg/L" },
  BOD: { limitMax: 3, unit: "mg/L" },
};

const WASTE_WATER_LIMITS = {
  temperature: { limitMax: 40, unit: "deg C" },
  pH: { limitMin: 6.5, limitMax: 8.5, unit: "" },
  BOD: { limitMax: 30, unit: "mg/L" },
  COD: { limitMax: 250, unit: "mg/L" },
  totalDissolvedSolids: { limitMax: 2100, unit: "mg/L" },
  totalSuspendedSolids: { limitMax: 100, unit: "mg/L" },
  oilAndGrease: { limitMax: 10, unit: "mg/L" },
};

const NOISE_LIMITS = {
  silence: { day: 50, night: 40 },
  residential: { day: 55, night: 45 },
  commercial: { day: 65, night: 55 },
  industrial: { day: 75, night: 70 },
};

async function getAirLimits() {
  const snapshot = await db
    .collection("prescribedLimits")
    .where("department", "==", "air")
    .where("isActive", "==", true)
    .get();

  const limits = new Map();

  snapshot.forEach((doc) => {
    const data = doc.data();
    if (data.parameter && typeof data.limitMax === "number") {
      limits.set(data.parameter, {
        limit: data.limitMax,
        unit: data.unit || "",
      });
    }
  });

  return limits;
}

function mergeWorstBreach(target, breach) {
  const existing = target.get(breach.parameter);
  if (!existing || breach.ratio > existing.ratio) {
    target.set(breach.parameter, breach);
  }
}

function getWaterLimits(waterType) {
  return waterType === "waste" ? WASTE_WATER_LIMITS : NATURAL_WATER_LIMITS;
}

function computeWaterBreach(parameter, value, config) {
  if (!Number.isFinite(value)) {
    return null;
  }

  if (typeof config.limitMax === "number" && value > config.limitMax) {
    return {
      parameter,
      measured: value,
      limit: config.limitMax,
      unit: config.unit || "",
      ratio: config.limitMax > 0 ? value / config.limitMax : 0,
    };
  }

  if (typeof config.limitMin === "number" && value < config.limitMin) {
    return {
      parameter,
      measured: value,
      limit: config.limitMin,
      unit: config.unit || "",
      ratio: config.limitMin > 0 ? config.limitMin / Math.max(value, 0.01) : 0,
    };
  }

  return null;
}

function computeNoiseBreach(reading) {
  const zone = reading.zone || "industrial";
  const timeKey = reading.monitoringTime === "Night" ? "night" : "day";
  const zoneLimits = NOISE_LIMITS[zone] || NOISE_LIMITS.industrial;
  const limit = zoneLimits[timeKey];
  const measured = Number(reading.noiseLevel);

  if (!Number.isFinite(measured) || !Number.isFinite(limit) || measured <= limit) {
    return null;
  }

  return {
    parameter: `noise_${timeKey}`,
    measured,
    limit,
    unit: "dB",
    ratio: limit > 0 ? measured / limit : 0,
    zone,
    monitoringTime: reading.monitoringTime || "Day",
    locationId: reading.locationId || null,
  };
}

async function checkAirReadingAgainstLimits(reading) {
  const airLimits = await getAirLimits();
  const breached = [];

  const ambientAir = reading.ambientAir || {};
  Object.entries(ambientAir).forEach(([parameter, rawValue]) => {
    const value = Number(rawValue);
    const limitConfig = airLimits.get(parameter);

    if (!Number.isFinite(value) || !limitConfig) {
      return;
    }

    if (value > limitConfig.limit) {
      breached.push({
        parameter,
        measured: value,
        limit: limitConfig.limit,
        unit: limitConfig.unit,
      });
    }
  });

  const stackRows = Array.isArray(reading.stackEmissions) ? reading.stackEmissions : [];
  stackRows.forEach((row) => {
    const particulateMatter = Number(row.particulateMatter);
    if (!Number.isFinite(particulateMatter)) {
      return;
    }

    if (particulateMatter > 150) {
      breached.push({
        parameter: "PM_Stack",
        measured: particulateMatter,
        limit: 150,
        unit: row.unit || "mg/Nm3",
      });
    }
  });

  return breached;
}

function checkWaterReadingAgainstLimits(reading) {
  const waterLimits = getWaterLimits(reading.waterType);
  const samples = Array.isArray(reading.samples) ? reading.samples : [];
  const breached = new Map();

  samples.forEach((sample) => {
    Object.entries(waterLimits).forEach(([parameter, config]) => {
      const value = Number(sample[parameter]);
      const breach = computeWaterBreach(parameter, value, config);
      if (breach) {
        mergeWorstBreach(breached, breach);
      }
    });
  });

  return Array.from(breached.values()).map(({ ratio, ...breach }) => breach);
}

function checkNoiseReadingAgainstLimits(reading) {
  const rows = Array.isArray(reading.readings) ? reading.readings : [];
  const breached = new Map();

  rows.forEach((row) => {
    const breach = computeNoiseBreach({
      ...row,
      locationId: row.locationId || reading.locationId || null,
    });

    if (breach) {
      mergeWorstBreach(breached, breach);
    }
  });

  return Array.from(breached.values()).map(({ ratio, ...breach }) => breach);
}

module.exports = {
  checkAirReadingAgainstLimits,
  checkWaterReadingAgainstLimits,
  checkNoiseReadingAgainstLimits,
};
