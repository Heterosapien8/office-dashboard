/**
 * PrithviNet — Firestore Seed Data Script
 * Run from project root: node seed.js
 *
 * Prerequisites:
 *   1. Create a Firebase service account key from Firebase Console
 *      → Project Settings → Service Accounts → Generate new private key
 *      Save it as serviceAccountKey.json in this directory
 *   2. npm install firebase-admin
 *   3. node seed.js
 */

let admin

try {
  admin = require('firebase-admin')
} catch (error) {
  console.error('Missing dependency: firebase-admin')
  console.error('Run `npm install` in the project root, then rerun `npm run seed`.')
  process.exit(1)
}

let serviceAccount

try {
  serviceAccount = require('./serviceAccountKey.json')
} catch (error) {
  console.error('Missing file: serviceAccountKey.json')
  console.error('Download a Firebase service account key and place it in the project root.')
  console.error('Firebase Console -> Project Settings -> Service Accounts -> Generate new private key')
  process.exit(1)
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
})

const db  = admin.firestore()
const now = admin.firestore.Timestamp.now()

// ─────────────────────────────────────────────────────────────
//  Seed Data
// ─────────────────────────────────────────────────────────────

const REGIONAL_OFFICES = [
  { id: 'RO-001', name: 'Raipur Regional Office',    monitoringType: ['air','water','noise'], address: 'Mantralaya, Raipur, CG 492001',    email: 'ro.raipur@cg.gov.in',    contactNo: '0771-2234567', isActive: true },
  { id: 'RO-002', name: 'Raigarh Regional Office',   monitoringType: ['air','water','noise'], address: 'Civil Lines, Raigarh, CG 496001',   email: 'ro.raigarh@cg.gov.in',   contactNo: '07762-234567', isActive: true },
  { id: 'RO-003', name: 'Bilaspur Regional Office',  monitoringType: ['air','water','noise'], address: 'Vyapar Vihar, Bilaspur, CG 495001', email: 'ro.bilaspur@cg.gov.in',  contactNo: '07752-234567', isActive: true },
  { id: 'RO-004', name: 'Durg Regional Office',      monitoringType: ['air','water','noise'], address: 'Station Road, Durg, CG 491001',     email: 'ro.durg@cg.gov.in',      contactNo: '0788-2234567',  isActive: true },
  { id: 'RO-005', name: 'Korba Regional Office',     monitoringType: ['air','water','noise'], address: 'CSEB Colony, Korba, CG 495677',     email: 'ro.korba@cg.gov.in',     contactNo: '07759-234567', isActive: true },
  { id: 'RO-006', name: 'Jagdalpur Regional Office', monitoringType: ['air','water','noise'], address: 'Dharampura, Jagdalpur, CG 494001',  email: 'ro.jagdalpur@cg.gov.in', contactNo: '07782-234567', isActive: true },
]

const INDUSTRIES = [
  // Raipur — RO-001
  { id: 'IND-001', name: 'Jindal Power & Steel Ltd.',         roId: 'RO-001', roName: 'Raipur Regional Office',    industryType: 'steel',    lat: 21.2514, lng: 81.6296, complianceStatus: 'violation', monitoringType: ['air','noise'] },
  { id: 'IND-002', name: 'Chhattisgarh Cement Works',        roId: 'RO-001', roName: 'Raipur Regional Office',    industryType: 'cement',   lat: 21.1938, lng: 81.3509, complianceStatus: 'compliant', monitoringType: ['air'] },
  { id: 'IND-003', name: 'Singhal Enterprises Pvt. Ltd.',    roId: 'RO-001', roName: 'Raipur Regional Office',    industryType: 'chemical', lat: 21.3119, lng: 81.9042, complianceStatus: 'pending',   monitoringType: ['air','water'] },
  // Raigarh — RO-002
  { id: 'IND-004', name: 'Monnet Ispat & Energy Ltd.',       roId: 'RO-002', roName: 'Raigarh Regional Office',   industryType: 'steel',    lat: 21.8974, lng: 83.3957, complianceStatus: 'compliant', monitoringType: ['air','water'] },
  { id: 'IND-005', name: 'Balco Aluminium (Raigarh Unit)',   roId: 'RO-002', roName: 'Raigarh Regional Office',   industryType: 'mining',   lat: 21.9501, lng: 83.4012, complianceStatus: 'violation', monitoringType: ['air'] },
  { id: 'IND-006', name: 'Raigarh Textile Mills',            roId: 'RO-002', roName: 'Raigarh Regional Office',   industryType: 'textile',  lat: 21.8800, lng: 83.3800, complianceStatus: 'compliant', monitoringType: ['water'] },
  // Bilaspur — RO-003
  { id: 'IND-007', name: 'NTPC Sipat Power Plant',           roId: 'RO-003', roName: 'Bilaspur Regional Office',  industryType: 'power',    lat: 22.0887, lng: 82.2987, complianceStatus: 'compliant', monitoringType: ['air','noise'] },
  { id: 'IND-008', name: 'Bilaspur Thermal Power Station',   roId: 'RO-003', roName: 'Bilaspur Regional Office',  industryType: 'power',    lat: 22.0501, lng: 82.1487, complianceStatus: 'pending',   monitoringType: ['air'] },
  { id: 'IND-009', name: 'CG Distilleries Ltd.',             roId: 'RO-003', roName: 'Bilaspur Regional Office',  industryType: 'chemical', lat: 21.9887, lng: 82.0987, complianceStatus: 'compliant', monitoringType: ['water'] },
  // Durg — RO-004
  { id: 'IND-010', name: 'SAIL Bhilai Steel Plant',          roId: 'RO-004', roName: 'Durg Regional Office',      industryType: 'steel',    lat: 21.2135, lng: 81.3775, complianceStatus: 'compliant', monitoringType: ['air','water','noise'] },
  { id: 'IND-011', name: 'Prism Cement Ltd. (Durg)',         roId: 'RO-004', roName: 'Durg Regional Office',      industryType: 'cement',   lat: 21.1901, lng: 81.2853, complianceStatus: 'compliant', monitoringType: ['air'] },
  { id: 'IND-012', name: 'Durg Chemicals & Fertilizers',    roId: 'RO-004', roName: 'Durg Regional Office',      industryType: 'chemical', lat: 21.2501, lng: 81.4012, complianceStatus: 'pending',   monitoringType: ['water'] },
  // Korba — RO-005
  { id: 'IND-013', name: 'BALCO Power Plant (Korba)',        roId: 'RO-005', roName: 'Korba Regional Office',     industryType: 'power',    lat: 22.3460, lng: 82.6946, complianceStatus: 'violation', monitoringType: ['air','noise'] },
  { id: 'IND-014', name: 'Korba Thermal Power House',        roId: 'RO-005', roName: 'Korba Regional Office',     industryType: 'power',    lat: 22.3601, lng: 82.7012, complianceStatus: 'compliant', monitoringType: ['air'] },
  { id: 'IND-015', name: 'South Eastern Coalfields Ltd.',    roId: 'RO-005', roName: 'Korba Regional Office',     industryType: 'mining',   lat: 22.3301, lng: 82.6501, complianceStatus: 'pending',   monitoringType: ['air','water'] },
  // Jagdalpur — RO-006
  { id: 'IND-016', name: 'National Mineral Development Corp',roId: 'RO-006', roName: 'Jagdalpur Regional Office', industryType: 'mining',   lat: 19.0748, lng: 82.0290, complianceStatus: 'compliant', monitoringType: ['air','water'] },
  { id: 'IND-017', name: 'Bastar Agro Industries',          roId: 'RO-006', roName: 'Jagdalpur Regional Office', industryType: 'chemical', lat: 19.0901, lng: 82.0401, complianceStatus: 'compliant', monitoringType: ['water'] },
  { id: 'IND-018', name: 'Jagdalpur Cement Ltd.',           roId: 'RO-006', roName: 'Jagdalpur Regional Office', industryType: 'cement',   lat: 19.0601, lng: 82.0201, complianceStatus: 'pending',   monitoringType: ['air'] },
]

const MONITORING_LOCATIONS = [
  { id: 'LOC-001', name: 'Raipur Ambient Station — Telibandha',    type: 'air',   city: 'Raipur',    roId: 'RO-001', lat: 21.2374, lng: 81.6305, currentStatus: 'moderate',  latestAQI: 132, latestAQICategory: 'Moderate',  baselineValues: { PM10: 95,  PM2_5: 55,  SO2: 60,  NO2: 65,  noiseDay: 58, noiseNight: 46 } },
  { id: 'LOC-002', name: 'Jindal Stack — Urla Industrial Area',    type: 'air',   city: 'Raipur',    roId: 'RO-001', lat: 21.2514, lng: 81.6296, currentStatus: 'violation', latestAQI: 285, latestAQICategory: 'Poor',      baselineValues: { PM10: 180, PM2_5: 95,  SO2: 175, NO2: 90,  noiseDay: 78, noiseNight: 72 } },
  { id: 'LOC-003', name: 'Kharun River Sampling Site',             type: 'water', city: 'Raipur',    roId: 'RO-001', lat: 21.2837, lng: 81.7012, currentStatus: 'good',      latestAQI: null, latestAQICategory: null,       baselineValues: { PM10: 0, PM2_5: 0, SO2: 0, NO2: 0, noiseDay: 0, noiseNight: 0 } },
  { id: 'LOC-004', name: 'Raipur Residential Noise Station',       type: 'noise', city: 'Raipur',    roId: 'RO-001', lat: 21.2501, lng: 81.6401, currentStatus: 'moderate',  latestAQI: null, latestAQICategory: null,       baselineValues: { PM10: 0, PM2_5: 0, SO2: 0, NO2: 0, noiseDay: 58, noiseNight: 48 } },
  { id: 'LOC-005', name: 'Raigarh NAMP Station — Sadar Bazar',    type: 'air',   city: 'Raigarh',   roId: 'RO-002', lat: 21.8974, lng: 83.3957, currentStatus: 'poor',      latestAQI: 198, latestAQICategory: 'Moderate',  baselineValues: { PM10: 120, PM2_5: 72,  SO2: 85,  NO2: 78,  noiseDay: 62, noiseNight: 50 } },
  { id: 'LOC-006', name: 'Mahanadi River — Raigarh Sampling',      type: 'water', city: 'Raigarh',   roId: 'RO-002', lat: 21.9101, lng: 83.4101, currentStatus: 'good',      latestAQI: null, latestAQICategory: null,       baselineValues: { PM10: 0, PM2_5: 0, SO2: 0, NO2: 0, noiseDay: 0, noiseNight: 0 } },
  { id: 'LOC-007', name: 'Bilaspur Ambient Air — Civil Lines',     type: 'air',   city: 'Bilaspur',  roId: 'RO-003', lat: 22.0887, lng: 82.1487, currentStatus: 'good',      latestAQI: 78,  latestAQICategory: 'Satisfactory', baselineValues: { PM10: 65, PM2_5: 38, SO2: 42, NO2: 45, noiseDay: 54, noiseNight: 43 } },
  { id: 'LOC-008', name: 'NTPC Sipat Stack Emission Point',        type: 'air',   city: 'Bilaspur',  roId: 'RO-003', lat: 22.0887, lng: 82.2987, currentStatus: 'moderate',  latestAQI: 145, latestAQICategory: 'Moderate',  baselineValues: { PM10: 110, PM2_5: 65, SO2: 90, NO2: 70, noiseDay: 68, noiseNight: 58 } },
  { id: 'LOC-009', name: 'Bhilai Industrial Area Noise Monitor',   type: 'noise', city: 'Durg',      roId: 'RO-004', lat: 21.2135, lng: 81.3775, currentStatus: 'violation', latestAQI: null, latestAQICategory: null,       baselineValues: { PM10: 0, PM2_5: 0, SO2: 0, NO2: 0, noiseDay: 79, noiseNight: 74 } },
  { id: 'LOC-010', name: 'Durg Air Monitoring — Bus Stand',        type: 'air',   city: 'Durg',      roId: 'RO-004', lat: 21.1901, lng: 81.2853, currentStatus: 'good',      latestAQI: 65,  latestAQICategory: 'Satisfactory', baselineValues: { PM10: 60, PM2_5: 35, SO2: 40, NO2: 42, noiseDay: 55, noiseNight: 44 } },
  { id: 'LOC-011', name: 'Korba Thermal Plant Ambient Station',    type: 'air',   city: 'Korba',     roId: 'RO-005', lat: 22.3460, lng: 82.6946, currentStatus: 'violation', latestAQI: 342, latestAQICategory: 'Very Poor',  baselineValues: { PM10: 220, PM2_5: 130, SO2: 180, NO2: 110, noiseDay: 80, noiseNight: 75 } },
  { id: 'LOC-012', name: 'Hasdeo River — Korba Sampling Site',     type: 'water', city: 'Korba',     roId: 'RO-005', lat: 22.3601, lng: 82.7201, currentStatus: 'good',      latestAQI: null, latestAQICategory: null,       baselineValues: { PM10: 0, PM2_5: 0, SO2: 0, NO2: 0, noiseDay: 0, noiseNight: 0 } },
  { id: 'LOC-013', name: 'Jagdalpur Market Area Noise Station',    type: 'noise', city: 'Jagdalpur', roId: 'RO-006', lat: 19.0748, lng: 82.0290, currentStatus: 'good',      latestAQI: null, latestAQICategory: null,       baselineValues: { PM10: 0, PM2_5: 0, SO2: 0, NO2: 0, noiseDay: 53, noiseNight: 42 } },
  { id: 'LOC-014', name: 'Jagdalpur Ambient Air — Collectorate',   type: 'air',   city: 'Jagdalpur', roId: 'RO-006', lat: 19.0812, lng: 82.0179, currentStatus: 'good',      latestAQI: 48,  latestAQICategory: 'Good',      baselineValues: { PM10: 38, PM2_5: 22, SO2: 28, NO2: 30, noiseDay: 50, noiseNight: 40 } },
]

const PRESCRIBED_LIMITS = [
  { id: 'LIM-AIR-001', parameter: 'PM10',   characteristicName: 'PM10',             unit: 'µg/m³', limitMin: null, limitMax: 100,  department: 'air',   source: 'CPCB', isActive: true },
  { id: 'LIM-AIR-002', parameter: 'PM2_5',  characteristicName: 'PM2.5',            unit: 'µg/m³', limitMin: null, limitMax: 60,   department: 'air',   source: 'CPCB', isActive: true },
  { id: 'LIM-AIR-003', parameter: 'SO2',    characteristicName: 'Sulphur Dioxide',  unit: 'µg/m³', limitMin: null, limitMax: 80,   department: 'air',   source: 'CPCB', isActive: true },
  { id: 'LIM-AIR-004', parameter: 'NO2',    characteristicName: 'Nitrogen Dioxide', unit: 'µg/m³', limitMin: null, limitMax: 80,   department: 'air',   source: 'CPCB', isActive: true },
  { id: 'LIM-AIR-005', parameter: 'O3',     characteristicName: 'Ozone (8hr)',      unit: 'µg/m³', limitMin: null, limitMax: 100,  department: 'air',   source: 'CPCB', isActive: true },
  { id: 'LIM-AIR-006', parameter: 'CO_8hr', characteristicName: 'CO (8hr avg)',     unit: 'mg/m³', limitMin: null, limitMax: 10,   department: 'air',   source: 'CPCB', isActive: true },
  { id: 'LIM-WAT-001', parameter: 'pH',     characteristicName: 'pH',               unit: '',      limitMin: 6.5,  limitMax: 8.5,  department: 'water', source: 'CPCB', isActive: true },
  { id: 'LIM-WAT-002', parameter: 'BOD',    characteristicName: 'BOD',              unit: 'mg/L',  limitMin: null, limitMax: 30,   department: 'water', source: 'CPCB', isActive: true },
  { id: 'LIM-WAT-003', parameter: 'COD',    characteristicName: 'COD',              unit: 'mg/L',  limitMin: null, limitMax: 250,  department: 'water', source: 'CPCB', isActive: true },
  { id: 'LIM-WAT-004', parameter: 'TSS',    characteristicName: 'Total SS',         unit: 'mg/L',  limitMin: null, limitMax: 100,  department: 'water', source: 'CPCB', isActive: true },
  {
    id: 'LIM-NOI-001', parameter: 'noise', characteristicName: 'Noise Level', unit: 'dB',
    department: 'noise', source: 'CPCB', isActive: true,
    zoneBasedLimits: {
      silence:     { day: 50, night: 40 },
      residential: { day: 55, night: 45 },
      commercial:  { day: 65, night: 55 },
      industrial:  { day: 75, night: 70 },
    }
  },
]

const PUBLIC_SUMMARIES = [
  { id: 'raipur',    cityId: 'raipur',    cityName: 'Raipur',    aqi: 132, aqiCategory: 'Moderate',     waterQualityStatus: 'safe',    noiseLevelDayAvg: 62, activeViolations: 2 },
  { id: 'raigarh',   cityId: 'raigarh',   cityName: 'Raigarh',   aqi: 198, aqiCategory: 'Moderate',     waterQualityStatus: 'caution', noiseLevelDayAvg: 65, activeViolations: 1 },
  { id: 'bilaspur',  cityId: 'bilaspur',  cityName: 'Bilaspur',  aqi: 78,  aqiCategory: 'Satisfactory', waterQualityStatus: 'safe',    noiseLevelDayAvg: 57, activeViolations: 0 },
  { id: 'durg',      cityId: 'durg',      cityName: 'Durg',      aqi: 65,  aqiCategory: 'Satisfactory', waterQualityStatus: 'safe',    noiseLevelDayAvg: 60, activeViolations: 0 },
  { id: 'korba',     cityId: 'korba',     cityName: 'Korba',     aqi: 342, aqiCategory: 'Very Poor',    waterQualityStatus: 'caution', noiseLevelDayAvg: 78, activeViolations: 3 },
  { id: 'jagdalpur', cityId: 'jagdalpur', cityName: 'Jagdalpur', aqi: 48,  aqiCategory: 'Good',         waterQualityStatus: 'safe',    noiseLevelDayAvg: 52, activeViolations: 0 },
]

// ─────────────────────────────────────────────────────────────
//  Seed Functions
// ─────────────────────────────────────────────────────────────
async function seedCollection(collectionName, items, useCustomId = false) {
  console.log(`\nSeeding ${collectionName} (${items.length} docs)...`)
  const batch = db.batch()
  items.forEach(item => {
    const { id, ...data } = item
    const ref = useCustomId
      ? db.collection(collectionName).doc(id)
      : db.collection(collectionName).doc()
    batch.set(ref, { ...data, createdAt: now, updatedAt: now })
  })
  await batch.commit()
  console.log(`  ✓ ${items.length} documents written to ${collectionName}`)
}

async function seedDemoViolations() {
  console.log('\nSeeding demo violations...')
  const violations = [
    {
      industryId: 'IND-001', industryName: 'Jindal Power & Steel Ltd.',
      roId: 'RO-001', roName: 'Raipur Regional Office',
      locationId: 'LOC-002', readingType: 'air',
      violatedParameters: [
        { parameter: 'SO2', measured: 185, limit: 80, unit: 'µg/m³' },
        { parameter: 'PM10', measured: 165, limit: 100, unit: 'µg/m³' },
      ],
      severity: 'critical', status: 'open', detectedAt: now,
    },
    {
      industryId: 'IND-005', industryName: 'Balco Aluminium (Raigarh Unit)',
      roId: 'RO-002', roName: 'Raigarh Regional Office',
      locationId: 'LOC-005', readingType: 'air',
      violatedParameters: [{ parameter: 'PM2_5', measured: 92, limit: 60, unit: 'µg/m³' }],
      severity: 'high', status: 'open', detectedAt: now,
    },
    {
      industryId: 'IND-013', industryName: 'BALCO Power Plant (Korba)',
      roId: 'RO-005', roName: 'Korba Regional Office',
      locationId: 'LOC-011', readingType: 'air',
      violatedParameters: [
        { parameter: 'SO2',  measured: 210, limit: 80,  unit: 'µg/m³' },
        { parameter: 'PM10', measured: 295, limit: 100, unit: 'µg/m³' },
      ],
      severity: 'critical', status: 'open', detectedAt: now,
    },
  ]

  for (const v of violations) {
    const vRef = await db.collection('violations').add({ ...v, createdAt: now })
    // Create matching escalation
    await db.collection('escalations').add({
      violationId: vRef.id,
      industryId: v.industryId, industryName: v.industryName,
      roId: v.roId, roName: v.roName,
      status: 'PENDING', notes: '',
      inspectionDate: null, resolvedAt: null, resolvedBy: null,
      createdAt: now, updatedAt: now,
    })
  }
  console.log('  ✓ 3 violations + escalations written')
}

async function main() {
  console.log('═══════════════════════════════════════════')
  console.log('  PrithviNet — Firestore Seed Data Script  ')
  console.log('═══════════════════════════════════════════')

  await seedCollection('regionalOffices',     REGIONAL_OFFICES,    true)
  await seedCollection('industries',          INDUSTRIES,          true)
  await seedCollection('monitoringLocations', MONITORING_LOCATIONS,true)
  await seedCollection('prescribedLimits',    PRESCRIBED_LIMITS,   true)
  await seedCollection('publicSummary',       PUBLIC_SUMMARIES,    true)
  await seedDemoViolations()

  console.log('\n═══════════════════════════════════════════')
  console.log('  ✓ All seed data written successfully!')
  console.log('  Next: Create Firebase Auth users manually')
  console.log('  in Firebase Console, then add /users/ docs')
  console.log('  with role field matching the ROLES constants')
  console.log('═══════════════════════════════════════════\n')
  process.exit(0)
}

main().catch(err => {
  console.error('Seed error:', err)
  process.exit(1)
})
