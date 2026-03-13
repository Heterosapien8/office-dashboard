import { Link } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import { Line, LineChart, ReferenceLine, ResponsiveContainer } from 'recharts'

const LIMITS = {
  air: 100,
  water: 8.5,
  noise: 75,
}

const STATUS_LABELS = {
  good: 'Good',
  moderate: 'Moderate',
  poor: 'Poor',
  violation: 'Violation',
}

function getPrimaryReading(location, activeParameter) {
  if (activeParameter === 'noise') {
    return {
      label: 'Noise',
      value: `${location.displayValue ?? '-'} dB`,
      limit: LIMITS.noise,
    }
  }

  if (activeParameter === 'water') {
    return {
      label: 'pH',
      value: location.displayValue?.toFixed?.(1) ?? location.displayValue ?? '-',
      limit: LIMITS.water,
    }
  }

  return {
    label: 'AQI',
    value: `${location.displayValue ?? '-'}${location.latestAQICategory ? ` (${location.latestAQICategory})` : ''}`,
    limit: LIMITS.air,
  }
}

export default function StationPopup({ location, sparklineData, activeParameter, color }) {
  const primaryReading = getPrimaryReading(location, activeParameter)
  const relativeUpdated = location.lastUpdated?.toDate
    ? formatDistanceToNow(location.lastUpdated.toDate(), { addSuffix: true })
    : 'update unavailable'

  return (
    <div className="w-[196px] space-y-3 text-xs text-slate-600">
      <div>
        <p className="text-sm font-bold text-slate-950">{location.name}</p>
        <p className="mt-1 text-[11px] text-slate-400">{location.city} · {location.roName ?? location.roId}</p>
      </div>

      <div className="flex items-center justify-between gap-2">
        <span
          className="inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white"
          style={{ backgroundColor: color }}
        >
          {STATUS_LABELS[location.displayStatus] ?? 'Live'}
        </span>
        <span className="text-[11px] text-slate-400">Updated {relativeUpdated}</span>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400">{primaryReading.label}</p>
        <p className="mt-1 text-sm font-semibold text-slate-900">{primaryReading.value}</p>
      </div>

      <div className="h-[50px] rounded-xl bg-slate-50 px-1 py-1">
        {sparklineData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sparklineData}>
              <ReferenceLine y={primaryReading.limit} stroke="#94a3b8" strokeDasharray="3 3" />
              <Line
                type="monotone"
                dataKey="value"
                stroke={color}
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center text-[11px] text-slate-400">
            Recent trend unavailable
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-[11px]">
        <span className="font-medium text-slate-400">Limit {primaryReading.limit}</span>
        <Link
          to={`/reports/${activeParameter === 'water' ? 'water' : activeParameter === 'noise' ? 'noise' : 'air'}?locationId=${location.locationId}`}
          className="font-semibold uppercase tracking-[0.18em] text-sky-600 transition hover:text-sky-800"
        >
          View full report
        </Link>
      </div>
    </div>
  )
}
