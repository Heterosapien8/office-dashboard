// ─────────────────────────────────────────────────────────────
//  PrithviNet — Application Constants
// ─────────────────────────────────────────────────────────────

// User Roles — must match Firestore /users/{uid}.role values
export const ROLES = {
  SUPER_ADMIN:      'superAdmin',
  REGIONAL_OFFICER: 'regionalOfficer',
  MONITORING_TEAM:  'monitoringTeam',
  INDUSTRY_USER:    'industryUser',
  CITIZEN:          'citizen',
}

// Firestore Collection Names
export const COLLECTIONS = {
  USERS:                'users',
  REGIONAL_OFFICES:     'regionalOffices',
  INDUSTRIES:           'industries',
  MONITORING_LOCATIONS: 'monitoringLocations',
  UNITS:                'units',
  PRESCRIBED_LIMITS:    'prescribedLimits',
  MONITORING_TEAMS:     'monitoringTeams',
  AIR_READINGS:         'airReadings',
  WATER_READINGS:       'waterReadings',
  NOISE_READINGS:       'noiseReadings',
  VIOLATIONS:           'violations',
  ESCALATIONS:          'escalations',
  NOTIFICATIONS:        'notifications',
  REPORT_LOCKS:         'reportLocks',
  FORECASTS:            'forecasts',
  PUBLIC_SUMMARY:       'publicSummary',
  SUPPORT_TICKETS:      'supportTickets',
}

// AQI Categories (CPCB Standard)
export const AQI_CATEGORIES = [
  { min: 0,   max: 50,  label: 'Good',        color: '#00B050', bg: '#E8F5E9', tailwind: 'bg-green-100 text-green-800' },
  { min: 51,  max: 100, label: 'Satisfactory', color: '#92D050', bg: '#F1F8E9', tailwind: 'bg-lime-100 text-lime-800' },
  { min: 101, max: 200, label: 'Moderate',     color: '#FFFF00', bg: '#FFFDE7', tailwind: 'bg-yellow-100 text-yellow-800' },
  { min: 201, max: 300, label: 'Poor',         color: '#FF7C00', bg: '#FFF3E0', tailwind: 'bg-orange-100 text-orange-800' },
  { min: 301, max: 400, label: 'Very Poor',    color: '#FF0000', bg: '#FFEBEE', tailwind: 'bg-red-100 text-red-800' },
  { min: 401, max: 500, label: 'Severe',       color: '#7E0023', bg: '#F3E5F5', tailwind: 'bg-purple-100 text-purple-800' },
]

// Map marker colours by status
export const MARKER_COLORS = {
  good:      '#00B050',
  moderate:  '#FFBF00',
  poor:      '#FF7C00',
  violation: '#C0392B',
}

// Noise Prescribed Limits (CPCB) — dB
export const NOISE_LIMITS = {
  silence:     { day: 50, night: 40 },
  residential: { day: 55, night: 45 },
  commercial:  { day: 65, night: 55 },
  industrial:  { day: 75, night: 70 },
}

// Noise zone display labels
export const NOISE_ZONES = [
  { value: 'silence',     label: 'Silence Area' },
  { value: 'residential', label: 'Residential Area' },
  { value: 'commercial',  label: 'Commercial Area' },
  { value: 'industrial',  label: 'Industrial Area' },
]

// Monitoring types
export const MONITORING_TYPES = [
  { value: 'air',   label: 'Air' },
  { value: 'water', label: 'Water' },
  { value: 'noise', label: 'Noise' },
  { value: 'all',   label: 'All' },
]

// Air monitoring sub-types
export const AIR_MONITORING_SUBTYPES = [
  { value: 'package',    label: 'Package Monitoring (Stack + Ambient)' },
  { value: 'namp',       label: 'NAMP (Ambient Only)' },
  { value: 'industrial', label: 'Industrial Monitoring' },
  { value: 'special',    label: 'Special Monitoring' },
]

// Escalation stages
export const ESCALATION_STAGES = [
  { value: 'PENDING',               label: 'Pending',               color: 'bg-yellow-100 text-yellow-800' },
  { value: 'RO_NOTIFIED',           label: 'RO Notified',           color: 'bg-blue-100 text-blue-800' },
  { value: 'INSPECTION_SCHEDULED',  label: 'Inspection Scheduled',  color: 'bg-orange-100 text-orange-800' },
  { value: 'RESOLVED',              label: 'Resolved',              color: 'bg-green-100 text-green-800' },
]

// Compliance status
export const COMPLIANCE_STATUS = {
  COMPLIANT:  'compliant',
  VIOLATION:  'violation',
  PENDING:    'pending',
}

// Water type options
export const WATER_TYPES = [
  { value: 'natural', label: 'Natural Water' },
  { value: 'waste',   label: 'Industrial Waste Water' },
]

// Industry types
export const INDUSTRY_TYPES = [
  'Steel', 'Cement', 'Power', 'Mining', 'Textile',
  'Chemical', 'Fertilizer', 'Paper', 'Sugar', 'Pharmaceutical', 'Other',
]

// LM Studio config
export const LM_STUDIO = {
  BASE_URL: 'http://localhost:1234/v1',
  MODEL:    'local-model',
}

// Chhattisgarh map center
export const CG_MAP_CENTER = [21.2787, 81.8661]
export const CG_MAP_ZOOM   = 7

// Report reminder days
export const REMINDER_DAYS = [1, 5, 10]
export const LOCK_DAY      = 10
