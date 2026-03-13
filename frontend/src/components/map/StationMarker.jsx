import { useEffect, useMemo, useState } from 'react'
import L from 'leaflet'
import { CircleMarker, Marker, Popup, Tooltip } from 'react-leaflet'
import { collection, getDocs, limit, orderBy, query, where } from 'firebase/firestore'
import StationPopup from './StationPopup'
import { db } from '../../config/firebase'
import { COLLECTIONS } from '../../config/constants'

const STATUS_COLORS = {
  good: '#22c55e',
  moderate: '#eab308',
  poor: '#f97316',
  violation: '#ef4444',
}

function normalizeSparklineData(docs, activeParameter, fallbackValue) {
  const points = docs.map((doc, index) => {
    const data = doc.data()
    let value = data.aqi ?? fallbackValue ?? 0

    if (activeParameter === 'noise') {
      value = data.noiseLevel ?? fallbackValue ?? 0
    } else if (activeParameter === 'water') {
      value = data.pH ?? data.waterQuality?.pH ?? fallbackValue ?? 7
    }

    return {
      index: docs.length - index,
      value,
    }
  })

  return points.reverse()
}

export default function StationMarker({ location, activeParameter, showLabels }) {
  const [sparklineData, setSparklineData] = useState([])
  const [popupLoaded, setPopupLoaded] = useState(false)

  const color = STATUS_COLORS[location.displayStatus] ?? STATUS_COLORS.good
  const position = [location.geoPoint?.lat ?? location.lat, location.geoPoint?.lng ?? location.lng]

  const violationIcon = useMemo(() => L.divIcon({
    className: '',
    html: `<div style="position:relative">
             <div class="violation-pulse-ring"></div>
             <div class="violation-dot"></div>
           </div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
  }), [])

  useEffect(() => {
    if (!popupLoaded) return

    let cancelled = false

    async function loadSparklineData() {
      const q = query(
        collection(db, COLLECTIONS.AIR_READINGS),
        where('locationId', '==', location.locationId),
        orderBy('createdAt', 'desc'),
        limit(5)
      )

      const snapshot = await getDocs(q)
      if (cancelled) return

      setSparklineData(normalizeSparklineData(snapshot.docs, activeParameter, location.displayValue))
    }

    loadSparklineData()

    return () => {
      cancelled = true
    }
  }, [activeParameter, location.displayValue, location.locationId, popupLoaded])

  if (!position[0] || !position[1]) {
    return null
  }

  const tooltip = showLabels ? (
    <Tooltip permanent direction="top" offset={[0, -12]}>
      <span className="rounded-full bg-slate-950/85 px-2 py-1 text-[11px] font-medium tracking-[0.02em] text-white shadow-lg">
        {location.name}
      </span>
    </Tooltip>
  ) : null

  if (location.displayStatus === 'violation') {
    return (
      <Marker
        position={position}
        icon={violationIcon}
        eventHandlers={{
          popupopen: () => setPopupLoaded(true),
        }}
      >
        {tooltip}
        <Popup minWidth={200} maxWidth={240}>
          <StationPopup
            location={location}
            sparklineData={sparklineData}
            activeParameter={activeParameter}
            color={color}
          />
        </Popup>
      </Marker>
    )
  }

  return (
    <CircleMarker
      center={position}
      radius={10}
      pathOptions={{
        color: '#ffffff',
        fillColor: color,
        fillOpacity: 0.85,
        weight: 2,
      }}
      eventHandlers={{
        popupopen: () => setPopupLoaded(true),
      }}
    >
      {tooltip}
      <Popup minWidth={200} maxWidth={240}>
        <StationPopup
          location={location}
          sparklineData={sparklineData}
          activeParameter={activeParameter}
          color={color}
        />
      </Popup>
    </CircleMarker>
  )
}
