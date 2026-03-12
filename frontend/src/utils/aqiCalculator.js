// ─────────────────────────────────────────────────────────────
//  AQI Calculator — CPCB Sub-Index Method
//  Reference: CPCB National Air Quality Index 2014
// ─────────────────────────────────────────────────────────────

const AQI_BREAKPOINTS = {
  PM10: [
    { cLow: 0,   cHigh: 50,  iLow: 0,   iHigh: 50  },
    { cLow: 51,  cHigh: 100, iLow: 51,  iHigh: 100 },
    { cLow: 101, cHigh: 250, iLow: 101, iHigh: 200 },
    { cLow: 251, cHigh: 350, iLow: 201, iHigh: 300 },
    { cLow: 351, cHigh: 430, iLow: 301, iHigh: 400 },
    { cLow: 431, cHigh: 999, iLow: 401, iHigh: 500 },
  ],
  PM2_5: [
    { cLow: 0,   cHigh: 30,  iLow: 0,   iHigh: 50  },
    { cLow: 31,  cHigh: 60,  iLow: 51,  iHigh: 100 },
    { cLow: 61,  cHigh: 90,  iLow: 101, iHigh: 200 },
    { cLow: 91,  cHigh: 120, iLow: 201, iHigh: 300 },
    { cLow: 121, cHigh: 250, iLow: 301, iHigh: 400 },
    { cLow: 251, cHigh: 999, iLow: 401, iHigh: 500 },
  ],
  NO2: [
    { cLow: 0,   cHigh: 40,  iLow: 0,   iHigh: 50  },
    { cLow: 41,  cHigh: 80,  iLow: 51,  iHigh: 100 },
    { cLow: 81,  cHigh: 180, iLow: 101, iHigh: 200 },
    { cLow: 181, cHigh: 280, iLow: 201, iHigh: 300 },
    { cLow: 281, cHigh: 400, iLow: 301, iHigh: 400 },
    { cLow: 401, cHigh: 999, iLow: 401, iHigh: 500 },
  ],
  SO2: [
    { cLow: 0,   cHigh: 40,  iLow: 0,   iHigh: 50  },
    { cLow: 41,  cHigh: 80,  iLow: 51,  iHigh: 100 },
    { cLow: 81,  cHigh: 380, iLow: 101, iHigh: 200 },
    { cLow: 381, cHigh: 800, iLow: 201, iHigh: 300 },
    { cLow: 801, cHigh: 1600,iLow: 301, iHigh: 400 },
    { cLow: 1601,cHigh: 9999,iLow: 401, iHigh: 500 },
  ],
  O3: [
    { cLow: 0,   cHigh: 50,  iLow: 0,   iHigh: 50  },
    { cLow: 51,  cHigh: 100, iLow: 51,  iHigh: 100 },
    { cLow: 101, cHigh: 168, iLow: 101, iHigh: 200 },
    { cLow: 169, cHigh: 208, iLow: 201, iHigh: 300 },
    { cLow: 209, cHigh: 748, iLow: 301, iHigh: 400 },
    { cLow: 749, cHigh: 999, iLow: 401, iHigh: 500 },
  ],
  CO_8hr: [
    { cLow: 0,    cHigh: 1.0,  iLow: 0,   iHigh: 50  },
    { cLow: 1.1,  cHigh: 2.0,  iLow: 51,  iHigh: 100 },
    { cLow: 2.1,  cHigh: 10.0, iLow: 101, iHigh: 200 },
    { cLow: 10.1, cHigh: 17.0, iLow: 201, iHigh: 300 },
    { cLow: 17.1, cHigh: 34.0, iLow: 301, iHigh: 400 },
    { cLow: 34.1, cHigh: 99.9, iLow: 401, iHigh: 500 },
  ],
}

const AQI_CATEGORIES = [
  { min: 0,   max: 50,  label: 'Good',        color: '#00B050' },
  { min: 51,  max: 100, label: 'Satisfactory', color: '#92D050' },
  { min: 101, max: 200, label: 'Moderate',     color: '#FFFF00' },
  { min: 201, max: 300, label: 'Poor',         color: '#FF7C00' },
  { min: 301, max: 400, label: 'Very Poor',    color: '#FF0000' },
  { min: 401, max: 500, label: 'Severe',       color: '#7E0023' },
]

function getSubIndex(pollutant, concentration) {
  const c = parseFloat(concentration)
  if (isNaN(c) || c < 0) return null

  const breakpoints = AQI_BREAKPOINTS[pollutant]
  if (!breakpoints) return null

  const bp = breakpoints.find(b => c >= b.cLow && c <= b.cHigh)
  if (!bp) return pollutant === 'PM10' || pollutant === 'PM2_5' ? 500 : null

  return Math.round(
    ((bp.iHigh - bp.iLow) / (bp.cHigh - bp.cLow)) * (c - bp.cLow) + bp.iLow
  )
}

/**
 * calculateAQI — takes an ambientAir object and returns { aqi, category, subIndices }
 * @param {Object} ambientAir — { PM10, PM2_5, SO2, NO2, O3, CO_8hr, ... }
 */
export function calculateAQI(ambientAir) {
  const subIndices = {}
  let maxSubIndex  = 0

  const pollutants = ['PM10', 'PM2_5', 'SO2', 'NO2', 'O3', 'CO_8hr']
  pollutants.forEach(p => {
    const val = ambientAir[p]
    if (val !== null && val !== undefined && val !== '') {
      const si = getSubIndex(p, val)
      if (si !== null) {
        subIndices[p] = si
        if (si > maxSubIndex) maxSubIndex = si
      }
    }
  })

  if (maxSubIndex === 0) return null

  const category = AQI_CATEGORIES.find(c => maxSubIndex >= c.min && maxSubIndex <= c.max)

  return {
    aqi:        maxSubIndex,
    category:   category?.label ?? 'Unknown',
    color:      category?.color ?? '#888',
    subIndices,
  }
}

export function getAQICategory(aqi) {
  return AQI_CATEGORIES.find(c => aqi >= c.min && aqi <= c.max) ?? null
}
