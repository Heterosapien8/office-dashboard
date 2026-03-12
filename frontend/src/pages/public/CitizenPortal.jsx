import { useEffect, useState } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../../config/firebase'
import { COLLECTIONS } from '../../config/constants'
import { getAQICategory } from '../../utils/aqiCalculator'
import clsx from 'clsx'

// Simple AQI Gauge dial using a color arc
function AQIDial({ aqi, category, color }) {
  const pct    = Math.min(aqi / 500, 1)
  const deg    = pct * 180  // 0–180 degrees sweep

  return (
    <div className="flex flex-col items-center">
      {/* Semicircle gauge */}
      <div className="relative w-32 h-16 overflow-hidden">
        <div className="absolute inset-0 rounded-t-full border-8 border-gray-200" />
        <div
          className="absolute inset-0 rounded-t-full border-8 transition-all duration-700"
          style={{
            borderColor: color,
            clipPath: `polygon(0 100%, 100% 100%, 100% ${100 - pct * 100}%, 0 ${100 - pct * 100}%)`,
          }}
        />
        <div className="absolute bottom-0 inset-x-0 text-center">
          <span className="text-2xl font-bold" style={{ color }}>{aqi ?? '—'}</span>
        </div>
      </div>
      <span
        className="mt-2 text-xs font-semibold px-3 py-1 rounded-full"
        style={{ background: color + '20', color }}
      >
        {category ?? 'No data'}
      </span>
    </div>
  )
}

const WATER_BADGE = {
  safe:    { label: 'Safe',    color: 'bg-green-100 text-green-700' },
  caution: { label: 'Caution', color: 'bg-yellow-100 text-yellow-700' },
  unsafe:  { label: 'Unsafe',  color: 'bg-red-100 text-red-700' },
}

export default function CitizenPortal() {
  const [summaries,    setSummaries]    = useState([])
  const [selectedCity, setSelectedCity] = useState(null)
  const [loading,      setLoading]      = useState(true)

  useEffect(() => {
    return onSnapshot(collection(db, COLLECTIONS.PUBLIC_SUMMARY), snap => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      setSummaries(data)
      if (data.length > 0 && !selectedCity) setSelectedCity(data[0].cityId)
      setLoading(false)
    })
  }, [])

  const selected = summaries.find(s => s.cityId === selectedCity)
  const aqiCat   = selected ? getAQICategory(selected.aqi) : null
  const waterBadge = WATER_BADGE[selected?.waterQualityStatus] ?? WATER_BADGE.caution

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-primary-700">Air & Water Quality — Chhattisgarh</h1>
        <p className="text-gray-500 text-sm mt-1">Public environmental dashboard — real-time data from monitoring stations</p>
      </div>

      {/* City selector */}
      {summaries.length > 0 && (
        <div className="flex flex-wrap gap-2 justify-center">
          {summaries.map(s => (
            <button
              key={s.cityId}
              onClick={() => setSelectedCity(s.cityId)}
              className={clsx(
                'px-4 py-2 rounded-full text-sm font-medium transition-colors',
                selectedCity === s.cityId
                  ? 'bg-primary-700 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-primary-50'
              )}
            >
              {s.cityName}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="text-center py-16">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : selected ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* AQI Card */}
          <div className="card text-center">
            <h2 className="font-semibold text-gray-600 text-sm mb-4">Air Quality Index</h2>
            <AQIDial aqi={selected.aqi} category={aqiCat?.label} color={aqiCat?.color ?? '#888'} />
            <p className="text-xs text-gray-400 mt-4">
              Based on PM2.5, SO₂, NO₂, O₃ levels
            </p>
          </div>

          {/* Water Quality */}
          <div className="card text-center flex flex-col items-center justify-center">
            <h2 className="font-semibold text-gray-600 text-sm mb-4">Water Quality</h2>
            <div className="w-20 h-20 rounded-full bg-blue-50 border-4 border-blue-200 flex items-center justify-center mb-3">
              <span className="text-3xl">💧</span>
            </div>
            <span className={clsx('px-4 py-1.5 rounded-full text-sm font-semibold', waterBadge.color)}>
              {waterBadge.label}
            </span>
            <p className="text-xs text-gray-400 mt-3">Surface water quality near {selected.cityName}</p>
          </div>

          {/* Noise Level */}
          <div className="card text-center flex flex-col items-center justify-center">
            <h2 className="font-semibold text-gray-600 text-sm mb-4">Noise Level (Day Avg)</h2>
            <div className="relative w-24 h-24">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#E5E7EB" strokeWidth="10" />
                <circle
                  cx="50" cy="50" r="40" fill="none"
                  stroke={selected.noiseLevelDayAvg > 70 ? '#EF4444' : selected.noiseLevelDayAvg > 55 ? '#F59E0B' : '#10B981'}
                  strokeWidth="10"
                  strokeDasharray={`${(Math.min(selected.noiseLevelDayAvg, 100) / 100) * 251} 251`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-bold text-gray-700">{selected.noiseLevelDayAvg ?? '—'}</span>
                <span className="text-xs text-gray-400">dB</span>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              {selected.noiseLevelDayAvg > 70
                ? 'Above recommended levels'
                : 'Within safe limits'}
            </p>
          </div>
        </div>
      ) : (
        <div className="card text-center py-12 text-gray-400">
          <p>No data available. Please check back later.</p>
        </div>
      )}

      {/* Active violations notice */}
      {selected?.activeViolations > 0 && (
        <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl text-sm text-orange-700 text-center">
          ⚠️ There are currently {selected.activeViolations} active environmental violations being investigated in {selected?.cityName}. The Environment Department is taking corrective action.
        </div>
      )}

      <p className="text-center text-xs text-gray-400">
        Data refreshes every 30 minutes from monitoring stations across Chhattisgarh.
        For technical queries, contact the Environment Department.
      </p>
    </div>
  )
}
