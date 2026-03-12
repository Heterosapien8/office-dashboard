import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../../config/firebase'
import { COLLECTIONS, CG_MAP_CENTER, CG_MAP_ZOOM, MARKER_COLORS } from '../../config/constants'
import { format } from 'date-fns'

function getMarkerColor(status) {
  return MARKER_COLORS[status] ?? MARKER_COLORS.good
}

export default function HeatmapPage() {
  const [locations, setLocations] = useState([])
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    return onSnapshot(collection(db, COLLECTIONS.MONITORING_LOCATIONS), snap => {
      setLocations(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })
  }, [])

  return (
    <div className="space-y-4 h-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Pollution Heatmap</h1>
          <p className="text-sm text-gray-400">Real-time monitoring locations — Chhattisgarh</p>
        </div>
        {/* Legend */}
        <div className="flex items-center gap-4 text-xs text-gray-500">
          {[
            { label: 'Good',      color: MARKER_COLORS.good      },
            { label: 'Moderate',  color: MARKER_COLORS.moderate  },
            { label: 'Poor',      color: MARKER_COLORS.poor      },
            { label: 'Violation', color: MARKER_COLORS.violation },
          ].map(({ label, color }) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
              {label}
            </div>
          ))}
        </div>
      </div>

      <div className="card !p-0 overflow-hidden" style={{ height: '580px' }}>
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <MapContainer
            center={CG_MAP_CENTER}
            zoom={CG_MAP_ZOOM}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {locations.map(loc => {
              const lat    = loc.geoPoint?.lat ?? loc.lat
              const lng    = loc.geoPoint?.lng ?? loc.lng
              if (!lat || !lng) return null

              const status = loc.currentStatus ?? 'good'
              const color  = getMarkerColor(status)
              const isViolation = status === 'violation'

              return (
                <CircleMarker
                  key={loc.id}
                  center={[lat, lng]}
                  radius={isViolation ? 12 : 8}
                  pathOptions={{
                    color,
                    fillColor: color,
                    fillOpacity: 0.85,
                    weight: isViolation ? 3 : 1,
                    dashArray: isViolation ? '0' : undefined,
                  }}
                  className={isViolation ? 'pulse-marker' : ''}
                >
                  <Popup>
                    <div className="text-xs min-w-[180px]">
                      <p className="font-semibold text-sm text-gray-800 mb-1">{loc.name}</p>
                      <p className="text-gray-500">{loc.city}</p>
                      {loc.latestAQI && (
                        <div className="mt-2 p-2 bg-gray-50 rounded">
                          <p className="font-medium">AQI: <span style={{ color }}>{loc.latestAQI}</span></p>
                          <p className="text-gray-500">{loc.latestAQICategory}</p>
                        </div>
                      )}
                      <p className="mt-2 text-gray-400">
                        Status: <span className="font-medium capitalize" style={{ color }}>{status}</span>
                      </p>
                      {loc.lastUpdated?.toDate && (
                        <p className="text-gray-400 mt-1">
                          Updated: {format(loc.lastUpdated.toDate(), 'dd/MM HH:mm')}
                        </p>
                      )}
                    </div>
                  </Popup>
                </CircleMarker>
              )
            })}
          </MapContainer>
        )}
      </div>
    </div>
  )
}
