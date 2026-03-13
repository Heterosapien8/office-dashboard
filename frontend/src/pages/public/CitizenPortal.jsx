import { useEffect, useState } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../../config/firebase'
import { COLLECTIONS } from '../../config/constants'
import { getAQICategory } from '../../utils/aqiCalculator'
import { Droplets, Activity, AlertTriangle, Wind } from 'lucide-react'
import clsx from 'clsx'

function AQIDial({ aqi, category, color }) {
  const pct = Math.min((aqi ?? 0) / 500, 1)
  const safeColor = color === '#FFFF00' ? '#FFBA00' : color

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-36 h-20 overflow-hidden">
        <div className="absolute inset-0 rounded-t-full border-[10px] border-gray-200" />
        <div
          className="absolute inset-0 rounded-t-full border-[10px] transition-all duration-700"
          style={{
            borderColor: safeColor,
            clipPath: `polygon(0 100%, 100% 100%, 100% ${100 - pct * 100}%, 0 ${100 - pct * 100}%)`,
          }}
        />
        <div className="absolute bottom-0 inset-x-0 text-center">
          <span className="text-3xl font-bold" style={{ color: safeColor }}>{aqi ?? '-'}</span>
        </div>
      </div>
      <span
        className="mt-3 text-xs font-semibold px-3 py-1 rounded-full"
        style={{ background: `${safeColor}20`, color: safeColor }}
      >
        {category ?? 'No data'}
      </span>
    </div>
  )
}

const WATER_BADGE = {
  safe: { label: 'Safe', color: 'bg-green-100 text-green-700' },
  caution: { label: 'Caution', color: 'bg-yellow-100 text-yellow-700' },
  unsafe: { label: 'Unsafe', color: 'bg-red-100 text-red-700' },
}

function getNoiseStatus(level) {
  if ((level ?? 0) > 70) return { label: 'High', color: 'text-red-600 bg-red-50' }
  if ((level ?? 0) > 55) return { label: 'Moderate', color: 'text-orange-600 bg-orange-50' }
  return { label: 'Normal', color: 'text-green-600 bg-green-50' }
}

export default function CitizenPortal() {
  const [summaries, setSummaries] = useState([])
  const [selectedCity, setSelectedCity] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    return onSnapshot(collection(db, COLLECTIONS.PUBLIC_SUMMARY), (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      setSummaries(data)
      if (data.length > 0 && !selectedCity) {
        setSelectedCity(data[0].cityId)
      }
      setLoading(false)
    })
  }, [selectedCity])

  const selected = summaries.find((item) => item.cityId === selectedCity)
  const aqiCat = selected ? getAQICategory(selected.aqi) : null
  const waterBadge = WATER_BADGE[selected?.waterQualityStatus] ?? WATER_BADGE.caution
  const noiseStatus = getNoiseStatus(selected?.noiseLevelDayAvg)

  const kpiCards = selected ? [
    {
      title: 'Air Quality Index',
      value: selected.aqi ?? '-',
      detail: aqiCat?.label ?? 'No data',
      icon: Wind,
      shell: 'from-primary-600 to-primary-800',
    },
    {
      title: 'Water Quality',
      value: waterBadge.label,
      detail: `Status near ${selected.cityName}`,
      icon: Droplets,
      shell: 'from-cyan-500 to-sky-600',
    },
    {
      title: 'Noise Level',
      value: `${selected.noiseLevelDayAvg ?? '-'} dB`,
      detail: `${noiseStatus.label} daytime average`,
      icon: Activity,
      shell: 'from-violet-500 to-indigo-600',
    },
    {
      title: 'Active Violations',
      value: selected.activeViolations ?? 0,
      detail: 'Under active department review',
      icon: AlertTriangle,
      shell: 'from-orange-500 to-red-500',
    },
  ] : []

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      <div className="card">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.35em] text-gray-400 mb-2">
              Citizen transparency portal
            </p>
            <h1 className="page-title !text-3xl !font-semibold !text-gray-900">
              Air, Water and Noise Quality Dashboard
            </h1>
            <p className="text-sm text-gray-400 mt-2">
              Public environmental data for monitored cities across Chhattisgarh
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {summaries.map((summary) => (
              <button
                key={summary.cityId}
                onClick={() => setSelectedCity(summary.cityId)}
                className={clsx(
                  'px-4 py-2 rounded-full text-sm font-medium transition-colors',
                  selectedCity === summary.cityId
                    ? 'bg-primary-700 text-white'
                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-primary-50'
                )}
              >
                {summary.cityName}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="card py-16 text-center">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : selected ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {kpiCards.map((card) => {
              const Icon = card.icon
              return (
                <div key={card.title} className={`rounded-[24px] bg-gradient-to-br ${card.shell} text-white p-5 shadow-sm min-h-[156px]`}>
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-[10px] uppercase tracking-[0.28em] text-white/75">{card.title}</p>
                    <div className="rounded-2xl bg-white/15 p-2.5">
                      <Icon size={16} className="text-white" />
                    </div>
                  </div>
                  <div className="mt-6">
                    <p className="text-4xl font-semibold leading-none">{card.value}</p>
                    <p className="text-xs text-white/80 mt-3">{card.detail}</p>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
            <div className="card">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.32em] text-gray-400 mb-2">Air quality summary</p>
                  <h2 className="text-2xl font-semibold text-gray-900">AQI status for {selected.cityName}</h2>
                </div>
                <span className="text-xs text-gray-400">Updated from public summary data</span>
              </div>

              <div className="grid gap-6 md:grid-cols-[220px_1fr] items-center">
                <div className="flex justify-center">
                  <AQIDial aqi={selected.aqi} category={aqiCat?.label} color={aqiCat?.color ?? '#888'} />
                </div>
                <div className="space-y-4">
                  <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                    <p className="text-sm font-medium text-gray-700">Citizen guidance</p>
                    <p className="text-sm text-gray-500 mt-2">
                      {selected.aqi >= 201
                        ? 'Sensitive groups should reduce prolonged outdoor exposure and follow local advisories.'
                        : selected.aqi >= 101
                          ? 'Air quality is moderate. Consider limiting heavy outdoor activity during peak hours.'
                          : 'Air quality is within a safer range for most citizens today.'}
                    </p>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-2xl border border-gray-100 px-4 py-3">
                      <p className="text-[10px] uppercase tracking-[0.22em] text-gray-400 mb-2">Category</p>
                      <p className="text-lg font-semibold text-gray-800">{aqiCat?.label ?? 'No data'}</p>
                    </div>
                    <div className="rounded-2xl border border-gray-100 px-4 py-3">
                      <p className="text-[10px] uppercase tracking-[0.22em] text-gray-400 mb-2">City monitored</p>
                      <p className="text-lg font-semibold text-gray-800">{selected.cityName}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div>
                <p className="text-[10px] uppercase tracking-[0.32em] text-gray-400 mb-2">Public health indicators</p>
                <h2 className="text-2xl font-semibold text-gray-900">Water and noise summary</h2>
              </div>

              <div className="space-y-4 mt-5">
                <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Water Quality</p>
                      <p className="text-xs text-gray-400 mt-1">Surface water near {selected.cityName}</p>
                    </div>
                    <span className={clsx('px-3 py-1 rounded-full text-sm font-semibold', waterBadge.color)}>
                      {waterBadge.label}
                    </span>
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Noise Level</p>
                      <p className="text-xs text-gray-400 mt-1">Daytime average</p>
                    </div>
                    <span className={clsx('px-3 py-1 rounded-full text-sm font-semibold', noiseStatus.color)}>
                      {noiseStatus.label}
                    </span>
                  </div>
                  <p className="text-3xl font-semibold text-gray-800 mt-4">{selected.noiseLevelDayAvg ?? '-'} <span className="text-base font-medium text-gray-400">dB</span></p>
                </div>

                <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                  <p className="text-sm font-medium text-gray-700">Department notice</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Public summary data refreshes every 30 minutes. Contact the Environment Department for official inspection or grievance support.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {selected.activeViolations > 0 && (
            <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl text-sm text-orange-700 text-center">
              There are currently {selected.activeViolations} active environmental violation{selected.activeViolations > 1 ? 's' : ''} under investigation in {selected.cityName}. The department is taking corrective action.
            </div>
          )}
        </>
      ) : (
        <div className="card text-center py-12 text-gray-400">
          <p>No data available. Please check back later.</p>
        </div>
      )}

      <p className="text-center text-xs text-gray-400">
        Data refreshes every 30 minutes from monitoring stations across Chhattisgarh.
      </p>
    </div>
  )
}
