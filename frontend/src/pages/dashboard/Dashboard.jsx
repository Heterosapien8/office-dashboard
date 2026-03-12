import { useEffect, useState } from 'react'
import {
  collection, query, where, orderBy,
  limit, onSnapshot, Timestamp,
} from 'firebase/firestore'
import { db } from '../../config/firebase'
import { useAuth } from '../../contexts/AuthContext'
import { COLLECTIONS, ROLES, AQI_CATEGORIES } from '../../config/constants'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Legend,
} from 'recharts'
import {
  AlertTriangle, CheckCircle, Building2, FileWarning,
  Wind, Activity, Clock, TrendingUp,
} from 'lucide-react'
import { format } from 'date-fns'
import clsx from 'clsx'

// ─────────────────────────────────────────────────────────────
//  Dashboard — real-time KPI cards + trend chart
// ─────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { role, roId, userProfile } = useAuth()

  const [violations,   setViolations]   = useState([])
  const [readings,     setReadings]     = useState([])
  const [industries,   setIndustries]   = useState([])
  const [escalations,  setEscalations]  = useState([])
  const [loading,      setLoading]      = useState(true)

  // ── Real-time listeners ──────────────────────────────────────
  useEffect(() => {
    const isAdmin = role === ROLES.SUPER_ADMIN
    const unsubs  = []

    // Violations
    let vQuery = query(
      collection(db, COLLECTIONS.VIOLATIONS),
      where('status', '==', 'open'),
      orderBy('detectedAt', 'desc'),
      limit(20)
    )
    if (!isAdmin) {
      vQuery = query(
        collection(db, COLLECTIONS.VIOLATIONS),
        where('roId', '==', roId),
        where('status', '==', 'open'),
        orderBy('detectedAt', 'desc'),
        limit(20)
      )
    }
    unsubs.push(onSnapshot(vQuery, snap => {
      setViolations(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    }))

    // Air readings for chart
    let rQuery = query(
      collection(db, COLLECTIONS.AIR_READINGS),
      orderBy('createdAt', 'desc'),
      limit(30)
    )
    unsubs.push(onSnapshot(rQuery, snap => {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      setReadings(docs.reverse()) // oldest first for chart
    }))

    // Industries
    let iQuery = query(collection(db, COLLECTIONS.INDUSTRIES))
    if (!isAdmin) {
      iQuery = query(
        collection(db, COLLECTIONS.INDUSTRIES),
        where('roId', '==', roId)
      )
    }
    unsubs.push(onSnapshot(iQuery, snap => {
      setIndustries(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    }))

    // Open escalations
    let eQuery = query(
      collection(db, COLLECTIONS.ESCALATIONS),
      where('status', '!=', 'RESOLVED'),
      limit(10)
    )
    unsubs.push(onSnapshot(eQuery, snap => {
      setEscalations(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    }))

    return () => unsubs.forEach(u => u())
  }, [role, roId])

  // ── Derived metrics ──────────────────────────────────────────
  const compliantCount    = industries.filter(i => i.complianceStatus === 'compliant').length
  const violationCount    = industries.filter(i => i.complianceStatus === 'violation').length
  const avgAQI            = readings.length > 0
    ? Math.round(readings.reduce((s, r) => s + (r.aqi ?? 0), 0) / readings.length)
    : 0
  const aqiCategory       = AQI_CATEGORIES.find(c => avgAQI >= c.min && avgAQI <= c.max)

  // Chart data
  const chartData = readings.slice(-20).map(r => ({
    time: r.createdAt?.toDate
      ? format(r.createdAt.toDate(), 'dd/MM HH:mm')
      : '—',
    SO2:  r.ambientAir?.SO2  ?? null,
    PM25: r.ambientAir?.PM2_5 ?? null,
    NO2:  r.ambientAir?.NO2  ?? null,
    AQI:  r.aqi ?? null,
  }))

  const kpis = [
    {
      label: 'Average AQI',
      value: avgAQI || '—',
      sub: aqiCategory?.label ?? 'No data',
      icon: Wind,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      border: 'border-blue-100',
    },
    {
      label: 'Active Violations',
      value: violations.length,
      sub: 'Open this week',
      icon: AlertTriangle,
      color: violations.length > 0 ? 'text-red-600' : 'text-green-600',
      bg: violations.length > 0 ? 'bg-red-50' : 'bg-green-50',
      border: violations.length > 0 ? 'border-red-100' : 'border-green-100',
    },
    {
      label: 'Compliant Industries',
      value: compliantCount,
      sub: `${violationCount} in violation`,
      icon: CheckCircle,
      color: 'text-green-600',
      bg: 'bg-green-50',
      border: 'border-green-100',
    },
    {
      label: 'Open Escalations',
      value: escalations.length,
      sub: 'Pending resolution',
      icon: Activity,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
      border: 'border-orange-100',
    },
    {
      label: 'Total Industries',
      value: industries.length,
      sub: `Under ${role === ROLES.SUPER_ADMIN ? 'State' : 'RO'} monitoring`,
      icon: Building2,
      color: 'text-primary-600',
      bg: 'bg-primary-50',
      border: 'border-primary-100',
    },
    {
      label: 'Reports Today',
      value: readings.filter(r => {
        if (!r.createdAt?.toDate) return false
        const today = new Date()
        const d     = r.createdAt.toDate()
        return d.toDateString() === today.toDateString()
      }).length,
      sub: 'Submitted readings',
      icon: FileWarning,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      border: 'border-purple-100',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="page-title">
          {role === ROLES.SUPER_ADMIN
            ? 'State Dashboard'
            : `${userProfile?.roName ?? 'Regional'} Dashboard`}
        </h1>
        <p className="text-sm text-gray-400 mt-0.5">
          Live environmental monitoring — {format(new Date(), 'dd MMMM yyyy, HH:mm')}
        </p>
      </div>

      {/* Violation alert banner */}
      {violations.length > 0 && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200
                        rounded-xl text-red-700 animate-pulse">
          <AlertTriangle size={20} className="flex-shrink-0" />
          <p className="text-sm font-medium">
            {violations.length} active violation{violations.length > 1 ? 's' : ''} detected.
            Immediate inspection recommended.
          </p>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpis.map(kpi => {
          const Icon = kpi.icon
          return (
            <div
              key={kpi.label}
              className={`card border ${kpi.border} !p-4 flex flex-col gap-2`}
            >
              <div className={`w-9 h-9 ${kpi.bg} rounded-lg flex items-center justify-center`}>
                <Icon size={18} className={kpi.color} />
              </div>
              <div>
                <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
                <p className="text-xs font-medium text-gray-600 leading-tight">{kpi.label}</p>
                <p className="text-[11px] text-gray-400 mt-0.5">{kpi.sub}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Live Chart */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold text-gray-700 text-sm">Live Air Quality Trend</h2>
            <p className="text-xs text-gray-400">Last 20 readings — updates in real time</p>
          </div>
          <span className="flex items-center gap-1.5 text-xs text-green-600">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            Live
          </span>
        </div>

        {chartData.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
            No data yet. Submit an air monitoring report to see live trends.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="time" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8 }}
                labelStyle={{ fontWeight: 600 }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {/* SO₂ prescribed limit line */}
              <ReferenceLine y={80} stroke="#E67E22" strokeDasharray="4 4"
                label={{ value: 'SO₂ Limit', fontSize: 10, fill: '#E67E22' }} />
              <Line type="monotone" dataKey="SO2"  stroke="#E74C3C" dot={false} strokeWidth={2} name="SO₂ (µg/m³)" />
              <Line type="monotone" dataKey="PM25" stroke="#8E44AD" dot={false} strokeWidth={2} name="PM2.5 (µg/m³)" />
              <Line type="monotone" dataKey="NO2"  stroke="#2980B9" dot={false} strokeWidth={2} name="NO₂ (µg/m³)" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Recent violations table */}
      {violations.length > 0 && (
        <div className="card">
          <h2 className="font-semibold text-gray-700 text-sm mb-4">Recent Violations</h2>
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-red-50 text-red-700">
                <th className="px-3 py-2 text-left font-medium">Industry</th>
                <th className="px-3 py-2 text-left font-medium">Parameter</th>
                <th className="px-3 py-2 text-left font-medium">Type</th>
                <th className="px-3 py-2 text-left font-medium">Severity</th>
                <th className="px-3 py-2 text-left font-medium">Detected</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {violations.slice(0, 5).map(v => (
                <tr key={v.id} className="hover:bg-red-50/50">
                  <td className="px-3 py-2 font-medium text-gray-700">{v.industryName}</td>
                  <td className="px-3 py-2 text-gray-500">
                    {v.violatedParameters?.map(p => p.parameter).join(', ') ?? '—'}
                  </td>
                  <td className="px-3 py-2 text-gray-500 capitalize">{v.readingType}</td>
                  <td className="px-3 py-2">
                    <span className={clsx(
                      'px-2 py-0.5 rounded-full text-[10px] font-medium',
                      v.severity === 'critical' ? 'bg-red-100 text-red-700' :
                      v.severity === 'high'     ? 'bg-orange-100 text-orange-700' :
                      'bg-yellow-100 text-yellow-700'
                    )}>
                      {v.severity}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-gray-400">
                    {v.detectedAt?.toDate
                      ? format(v.detectedAt.toDate(), 'dd/MM HH:mm')
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
