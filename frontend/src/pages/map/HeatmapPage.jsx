import { useEffect, useMemo, useState } from 'react'
import { collection, getDocs, onSnapshot, orderBy, query, where } from 'firebase/firestore'
import { ChevronDown, ChevronUp, Layers3, MapPinned, Radio, Signal } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import PollutionMap from '../../components/map/PollutionMap'
import MapFilterPanel from '../../components/map/MapFilterPanel'
import MapLegend from '../../components/map/MapLegend'
import { db } from '../../config/firebase'
import { COLLECTIONS } from '../../config/constants'

const PRESCRIBED_LIMITS = {
  AQI: 100,
  PM10: 100,
  PM2_5: 60,
  SO2: 80,
  NO2: 80,
  pH_min: 6.5,
  pH_max: 8.5,
  BOD: 30,
  noiseDay: {
    silence: 50,
    residential: 55,
    commercial: 65,
    industrial: 75,
  },
  noiseNight: {
    silence: 40,
    residential: 45,
    commercial: 55,
    industrial: 70,
  },
}

const STATUS_COLORS = {
  good: '#22c55e',
  moderate: '#eab308',
  poor: '#f97316',
  violation: '#ef4444',
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

function normalizeLocation(rawLocation) {
  const geoPoint = rawLocation.geoPoint ?? (
    rawLocation.lat && rawLocation.lng
      ? { lat: rawLocation.lat, lng: rawLocation.lng }
      : null
  )

  return {
    ...rawLocation,
    geoPoint,
    latestAQI: rawLocation.latestAQI ?? null,
    latestAQICategory: rawLocation.latestAQICategory ?? null,
    currentStatus: rawLocation.currentStatus ?? 'good',
    isActive: rawLocation.isActive ?? true,
  }
}

function getLocationValue(location, parameter, derivedAirReading) {
  const airReading = derivedAirReading ?? {}

  if (parameter === 'air') {
    return airReading.aqi ?? location.latestAQI ?? 0
  }

  if (parameter === 'noise') {
    return (
      airReading.noiseLevel ??
      location.latestNoiseLevel ??
      location.baselineValues?.noiseDay ??
      0
    )
  }

  return (
    airReading.pH ??
    location.latestPH ??
    location.baselineValues?.pH ??
    7
  )
}

function getLocationStatus(location, parameter, derivedAirReading) {
  if (parameter === 'air') {
    const value = getLocationValue(location, parameter, derivedAirReading)
    if (value > 300) return 'violation'
    if (value > 200) return 'poor'
    if (value > 100) return 'moderate'
    return 'good'
  }

  if (parameter === 'noise') {
    const value = getLocationValue(location, parameter, derivedAirReading)
    if (value > PRESCRIBED_LIMITS.noiseDay.industrial) return 'violation'
    if (value > PRESCRIBED_LIMITS.noiseDay.commercial) return 'poor'
    if (value > PRESCRIBED_LIMITS.noiseDay.residential) return 'moderate'
    return 'good'
  }

  const value = getLocationValue(location, parameter, derivedAirReading)
  if (value < PRESCRIBED_LIMITS.pH_min || value > PRESCRIBED_LIMITS.pH_max) return 'violation'
  if (value < 6.8 || value > 8.2) return 'poor'
  if (value < 7.0 || value > 8.0) return 'moderate'
  return location.type === 'water' || location.type === 'multi' ? 'good' : location.currentStatus
}

function generateHeatPoints(locations, activeParameter, derivedReadings) {
  return locations
    .filter((loc) => loc.isActive && loc.geoPoint?.lat && loc.geoPoint?.lng)
    .map((loc) => {
      const derivedAirReading = derivedReadings[loc.locationId]
      let rawValue = 0
      let limit = 100

      if (activeParameter === 'noise') {
        rawValue = getLocationValue(loc, 'noise', derivedAirReading)
        limit = PRESCRIBED_LIMITS.noiseDay.industrial
      } else if (activeParameter === 'water') {
        const pH = getLocationValue(loc, 'water', derivedAirReading)
        rawValue = Math.abs(pH - 7.5) * 20
        limit = 20
      } else {
        rawValue = getLocationValue(loc, 'air', derivedAirReading)
        limit = PRESCRIBED_LIMITS.AQI
      }

      let intensity = rawValue / limit
      const hoursAgo = loc.lastUpdated?.toMillis
        ? (Date.now() - loc.lastUpdated.toMillis()) / 3600000
        : 168
      const recencyWeight = Math.max(0.2, 1 - (hoursAgo / 168))
      intensity = clamp(intensity * recencyWeight, 0, 1.5)

      return [loc.geoPoint.lat, loc.geoPoint.lng, intensity]
    })
}

function LayerControls({ showHeatmap, showLabels, onToggleHeatmap, onToggleLabels }) {
  return (
    <div className="w-[220px] rounded-2xl border border-slate-200/80 bg-white/95 p-4 shadow-[0_18px_50px_-28px_rgba(15,23,42,0.65)] backdrop-blur">
      <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">
        <Layers3 size={14} />
        Layers
      </div>

      <div className="space-y-3">
        <button
          type="button"
          onClick={onToggleHeatmap}
          className="flex w-full items-center justify-between rounded-xl border border-slate-200 px-3 py-2 text-left transition hover:border-sky-300 hover:bg-sky-50/80"
        >
          <div>
            <p className="text-sm font-semibold text-slate-900">Heatmap Overlay</p>
            <p className="text-xs text-slate-500">Show normalized intensity layer</p>
          </div>
          <span className={`inline-flex h-6 w-11 rounded-full p-1 transition ${showHeatmap ? 'bg-sky-500' : 'bg-slate-300'}`}>
            <span className={`h-4 w-4 rounded-full bg-white transition ${showHeatmap ? 'translate-x-5' : 'translate-x-0'}`} />
          </span>
        </button>

        <button
          type="button"
          onClick={onToggleLabels}
          className="flex w-full items-center justify-between rounded-xl border border-slate-200 px-3 py-2 text-left transition hover:border-sky-300 hover:bg-sky-50/80"
        >
          <div>
            <p className="text-sm font-semibold text-slate-900">Show Labels</p>
            <p className="text-xs text-slate-500">Keep station names visible</p>
          </div>
          <span className={`inline-flex h-6 w-11 rounded-full p-1 transition ${showLabels ? 'bg-sky-500' : 'bg-slate-300'}`}>
            <span className={`h-4 w-4 rounded-full bg-white transition ${showLabels ? 'translate-x-5' : 'translate-x-0'}`} />
          </span>
        </button>
      </div>
    </div>
  )
}

function MapStatsBar({ locations, lastUpdated }) {
  const stats = [
    { label: 'Total Stations', value: locations.length, icon: MapPinned },
    { label: 'Active Violations', value: locations.filter((loc) => loc.displayStatus === 'violation').length, icon: Radio },
    { label: 'Compliant', value: locations.filter((loc) => loc.displayStatus === 'good').length, icon: Signal },
    {
      label: 'Last Updated',
      value: lastUpdated?.toDate
        ? formatDistanceToNow(lastUpdated.toDate(), { addSuffix: true })
        : 'No live update',
      icon: lastUpdated?.toDate ? ChevronUp : ChevronDown,
    },
  ]

  return (
    <div className="grid w-[280px] grid-cols-2 gap-3 rounded-2xl border border-slate-200/80 bg-white/95 p-4 shadow-[0_18px_50px_-28px_rgba(15,23,42,0.65)] backdrop-blur">
      {stats.map((stat) => {
        const Icon = stat.icon
        return (
          <div key={stat.label} className="rounded-xl border border-slate-100 bg-slate-50/80 p-3">
            <div className="mb-2 flex items-center gap-2 text-slate-400">
              <Icon size={14} />
              <span className="text-[10px] font-semibold uppercase tracking-[0.24em]">{stat.label}</span>
            </div>
            <p className="text-sm font-semibold text-slate-900">{stat.value}</p>
          </div>
        )
      })}
    </div>
  )
}

export default function HeatmapPage() {
  const [locations, setLocations] = useState([])
  const [derivedReadings, setDerivedReadings] = useState({})
  const [showHeatmap, setShowHeatmap] = useState(true)
  const [showLabels, setShowLabels] = useState(false)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    roId: 'all',
    parameter: 'air',
    violationsOnly: false,
    dateRange: 'today',
  })

  useEffect(() => {
    const locationsQuery = collection(db, COLLECTIONS.MONITORING_LOCATIONS)

    const unsubscribe = onSnapshot(locationsQuery, (snapshot) => {
      const data = snapshot.docs.map((doc) => normalizeLocation({
        locationId: doc.id,
        ...doc.data(),
      })).filter((location) => location.isActive !== false)
      setLocations(data)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  useEffect(() => {
    if (filters.dateRange === 'today') {
      setDerivedReadings({})
      return
    }

    let cancelled = false

    async function loadRangeReadings() {
      const days = filters.dateRange === '7d' ? 7 : 30
      const fromDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
      const readingsQuery = query(
        collection(db, COLLECTIONS.AIR_READINGS),
        where('createdAt', '>=', fromDate),
        orderBy('createdAt', 'desc')
      )

      const snapshot = await getDocs(readingsQuery)
      if (cancelled) return

      const nextDerived = {}
      snapshot.docs.forEach((doc) => {
        const reading = doc.data()
        if (!reading.locationId || nextDerived[reading.locationId]) {
          return
        }

        nextDerived[reading.locationId] = {
          aqi: reading.aqi ?? null,
          pH: reading.pH ?? reading.waterQuality?.pH ?? null,
          noiseLevel: reading.noiseLevel ?? null,
          createdAt: reading.createdAt ?? null,
        }
      })

      setDerivedReadings(nextDerived)
    }

    loadRangeReadings()

    return () => {
      cancelled = true
    }
  }, [filters.dateRange])

  const regionalOffices = useMemo(() => {
    const map = new Map()
    locations.forEach((location) => {
      if (!map.has(location.roId)) {
        map.set(location.roId, location.roName ?? location.city ?? location.roId)
      }
    })
    return Array.from(map.entries()).map(([value, label]) => ({ value, label }))
  }, [locations])

  const enrichedLocations = useMemo(() => {
    return locations.map((location) => {
      const displayStatus = getLocationStatus(location, filters.parameter, derivedReadings[location.locationId])
      const displayValue = getLocationValue(location, filters.parameter, derivedReadings[location.locationId])

      return {
        ...location,
        displayStatus,
        displayValue,
        statusColor: STATUS_COLORS[displayStatus],
      }
    })
  }, [derivedReadings, filters.parameter, locations])

  const filteredLocations = useMemo(() => {
    return enrichedLocations.filter((location) => {
      if (filters.roId !== 'all' && location.roId !== filters.roId) return false
      if (filters.violationsOnly && !['poor', 'violation'].includes(location.displayStatus)) return false
      return true
    })
  }, [enrichedLocations, filters.roId, filters.violationsOnly])

  const heatPoints = useMemo(
    () => generateHeatPoints(enrichedLocations, filters.parameter, derivedReadings),
    [derivedReadings, enrichedLocations, filters.parameter]
  )

  const lastUpdated = useMemo(() => {
    return enrichedLocations.reduce((latest, location) => {
      if (!location.lastUpdated?.toMillis) return latest
      if (!latest?.toMillis || location.lastUpdated.toMillis() > latest.toMillis()) {
        return location.lastUpdated
      }
      return latest
    }, null)
  }, [enrichedLocations])

  return (
    <div className="-m-6 relative w-[calc(100%+3rem)]" style={{ height: 'calc(100vh - 64px)' }}>
      {loading ? (
        <div className="flex h-full items-center justify-center bg-slate-950">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/20 border-t-white" />
        </div>
      ) : (
        <>
          <PollutionMap
            locations={filteredLocations}
            heatPoints={heatPoints}
            showHeatmap={showHeatmap}
            activeParameter={filters.parameter}
            showLabels={showLabels}
          />

          <MapFilterPanel
            filters={filters}
            onChange={setFilters}
            regionalOffices={regionalOffices}
            className="absolute left-4 top-20 z-[1000]"
          />

          <div className="absolute right-4 top-4 z-[1000]">
            <LayerControls
              showHeatmap={showHeatmap}
              showLabels={showLabels}
              onToggleHeatmap={() => setShowHeatmap((prev) => !prev)}
              onToggleLabels={() => setShowLabels((prev) => !prev)}
            />
          </div>

          <MapLegend showHeatmap={showHeatmap} className="absolute bottom-8 left-4 z-[1000]" />

          <div className="absolute bottom-8 right-4 z-[1000]">
            <MapStatsBar locations={enrichedLocations} lastUpdated={lastUpdated} />
          </div>
        </>
      )}
    </div>
  )
}
