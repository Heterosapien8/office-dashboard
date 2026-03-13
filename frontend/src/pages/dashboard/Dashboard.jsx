import { useEffect, useState } from 'react'
import {
  collection, query, where, orderBy,
  limit, onSnapshot,
} from 'firebase/firestore'
import { db } from '../../config/firebase'
import { useAuth } from '../../contexts/AuthContext'
import { COLLECTIONS, ROLES, AQI_CATEGORIES } from '../../config/constants'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Legend,
  PieChart, Pie, Cell,
} from 'recharts'
import {
  AlertTriangle, Building2, FileWarning,
  Wind, Clock, TrendingUp, Siren, ShieldCheck,
} from 'lucide-react'
import { format } from 'date-fns'
import clsx from 'clsx'

export default function Dashboard() {
  const { role, roId, userProfile } = useAuth()

  const [violations, setViolations] = useState([])
  const [readings, setReadings] = useState([])
  const [industries, setIndustries] = useState([])
  const [escalations, setEscalations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const isAdmin = role === ROLES.SUPER_ADMIN
    const unsubs = []

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

    unsubs.push(onSnapshot(vQuery, (snap) => {
      setViolations(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      setLoading(false)
    }))

    const rQuery = query(
      collection(db, COLLECTIONS.AIR_READINGS),
      orderBy('createdAt', 'desc'),
      limit(30)
    )

    unsubs.push(onSnapshot(rQuery, (snap) => {
      const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      setReadings(docs.reverse())
    }))

    let iQuery = query(collection(db, COLLECTIONS.INDUSTRIES))
    if (!isAdmin) {
      iQuery = query(
        collection(db, COLLECTIONS.INDUSTRIES),
        where('roId', '==', roId)
      )
    }

    unsubs.push(onSnapshot(iQuery, (snap) => {
      setIndustries(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    }))

    const eQuery = query(
      collection(db, COLLECTIONS.ESCALATIONS),
      where('status', '!=', 'RESOLVED'),
      limit(10)
    )

    unsubs.push(onSnapshot(eQuery, (snap) => {
      setEscalations(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    }))

    return () => unsubs.forEach((u) => u())
  }, [role, roId])

  const compliantCount = industries.filter((i) => i.complianceStatus === 'compliant').length
  const violationCount = industries.filter((i) => i.complianceStatus === 'violation').length
  const pendingCount = industries.filter((i) => i.complianceStatus === 'pending').length
  const reportsToday = readings.filter((r) => {
    if (!r.createdAt?.toDate) return false
    const today = new Date()
    const date = r.createdAt.toDate()
    return date.toDateString() === today.toDateString()
  }).length

  const avgAQI = readings.length > 0
    ? Math.round(readings.reduce((sum, r) => sum + (r.aqi ?? 0), 0) / readings.length)
    : 0
  const aqiCategory = AQI_CATEGORIES.find((c) => avgAQI >= c.min && avgAQI <= c.max)
  const complianceRate = industries.length > 0
    ? Math.round((compliantCount / industries.length) * 100)
    : 0

  const chartData = readings.slice(-20).map((r) => ({
    time: r.createdAt?.toDate ? format(r.createdAt.toDate(), 'dd/MM HH:mm') : '-',
    SO2: r.ambientAir?.SO2 ?? null,
    PM25: r.ambientAir?.PM2_5 ?? null,
    NO2: r.ambientAir?.NO2 ?? null,
  }))

  const featuredKpis = [
    {
      eyebrow: 'Current AQI',
      value: avgAQI || '-',
      sub: aqiCategory?.label ?? 'No data',
      detail: `${userProfile?.roName ?? 'State monitoring'} live average`,
      tone: 'from-rose-500 to-red-600',
      icon: Wind,
    },
    {
      eyebrow: 'Active Violations',
      value: violations.length,
      sub: `${violations.length} tracked incident${violations.length === 1 ? '' : 's'}`,
      detail: 'Open items requiring inspection flow',
      tone: 'from-amber-500 to-orange-500',
      icon: AlertTriangle,
    },
    {
      eyebrow: 'Compliant Industries',
      value: `${complianceRate}%`,
      sub: `${compliantCount} entities in registry`,
      detail: `${violationCount} flagged, ${pendingCount} pending`,
      tone: 'from-emerald-500 to-teal-600',
      icon: ShieldCheck,
    },
    {
      eyebrow: 'Open Escalations',
      value: escalations.length,
      sub: 'Stages flowing from escalation board',
      detail: 'Pending to resolved monitoring chain',
      tone: 'from-primary-700 to-primary-900',
      icon: Siren,
    },
  ]

  const quickStats = [
    { label: 'Total Industries', value: industries.length, icon: Building2 },
    { label: 'Reports Today', value: reportsToday, icon: FileWarning },
    { label: 'Escalation SLA', value: escalations.length > 0 ? 'Active' : 'Clear', icon: Clock },
  ]

  const complianceMix = [
    {
      label: 'Compliant',
      value: compliantCount,
      percentage: complianceRate,
      color: '#1E8449',
    },
    {
      label: 'Violation',
      value: violationCount,
      percentage: industries.length ? Math.round((violationCount / industries.length) * 100) : 0,
      color: '#C0392B',
    },
    {
      label: 'Pending',
      value: pendingCount,
      percentage: industries.length ? Math.round((pendingCount / industries.length) * 100) : 0,
      color: '#E67E22',
    },
  ]

  const incidentRows = violations.slice(0, 4)
  const feedRows = [...violations]
    .sort((a, b) => (b.detectedAt?.toMillis?.() ?? 0) - (a.detectedAt?.toMillis?.() ?? 0))
    .slice(0, 5)

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.35em] text-gray-400 mb-2">
              FR-DASH-01 to FR-DASH-03
            </p>
            <h1 className="page-title !text-3xl !font-semibold !text-gray-900">
              {role === ROLES.SUPER_ADMIN
                ? 'Real-Time Monitoring Dashboard'
                : `${userProfile?.roName ?? 'Regional'} Monitoring Dashboard`}
            </h1>
            <p className="text-sm text-gray-400 mt-2">
              Live environmental monitoring · {format(new Date(), 'dd MMM yyyy, HH:mm')}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 border border-emerald-100">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              {violations.length} live alert{violations.length === 1 ? '' : 's'} in queue
            </span>
            {quickStats.map((stat) => {
              const Icon = stat.icon
              return (
                <div key={stat.label} className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 min-w-[132px]">
                  <div className="flex items-center gap-2 text-gray-400 mb-2">
                    <Icon size={14} />
                    <span className="text-[10px] uppercase tracking-[0.24em]">{stat.label}</span>
                  </div>
                  <p className="text-lg font-semibold text-gray-800">{stat.value}</p>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {violations.length > 0 && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 animate-pulse">
          <AlertTriangle size={20} className="flex-shrink-0" />
          <p className="text-sm font-medium">
            {violations.length} active violation{violations.length > 1 ? 's' : ''} detected.
            Immediate inspection recommended.
          </p>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {featuredKpis.map((kpi) => {
          const Icon = kpi.icon
          return (
            <div
              key={kpi.eyebrow}
              className={`rounded-[28px] bg-gradient-to-br ${kpi.tone} text-white p-5 shadow-sm min-h-[168px]`}
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-[10px] uppercase tracking-[0.32em] text-white/75">
                  {kpi.eyebrow}
                </p>
                <div className="rounded-2xl bg-white/15 p-2.5">
                  <Icon size={16} className="text-white" />
                </div>
              </div>

              <div className="mt-6">
                <p className="text-5xl font-serif leading-none">{kpi.value}</p>
                <p className="text-sm text-white/90 mt-3">{kpi.sub}</p>
                <p className="text-xs text-white/65 mt-1">{kpi.detail}</p>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.85fr_1fr]">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.32em] text-gray-400 mb-2">
                Live pollutant trend
              </p>
              <h2 className="text-2xl font-semibold text-gray-900">
                PM2.5, SO2 and NO2 across the last monitoring window
              </h2>
            </div>
            <span className="flex items-center gap-1.5 text-xs text-green-600">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              Live
            </span>
          </div>

          {loading ? (
            <div className="h-72 flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : chartData.length === 0 ? (
            <div className="h-72 flex items-center justify-center text-gray-400 text-sm">
              No data yet. Submit an air monitoring report to see live trends.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={chartData} margin={{ top: 12, right: 16, left: -8, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e9edf3" />
                <XAxis dataKey="time" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 12, borderColor: '#dbe4ef' }}
                  labelStyle={{ fontWeight: 600 }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <ReferenceLine
                  y={80}
                  stroke="#E67E22"
                  strokeDasharray="4 4"
                  label={{ value: 'SO2 Limit', fontSize: 10, fill: '#E67E22' }}
                />
                <Line type="monotone" dataKey="SO2" stroke="#0f766e" dot={{ r: 3 }} strokeWidth={2.5} name="SO2 (ug/m3)" />
                <Line type="monotone" dataKey="PM25" stroke="#c26d12" dot={{ r: 3 }} strokeWidth={2.5} name="PM2.5 (ug/m3)" />
                <Line type="monotone" dataKey="NO2" stroke="#8f1d2c" dot={{ r: 3 }} strokeWidth={2.5} name="NO2 (ug/m3)" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="rounded-[28px] bg-gradient-to-br from-primary-700 to-primary-900 text-white p-5 flex flex-col">
          <div>
            <p className="text-[10px] uppercase tracking-[0.32em] text-white/45 mb-2">
              Compliance mix
            </p>
            <h2 className="text-lg font-semibold text-white">Registry distribution</h2>
          </div>

          <div className="flex-1 flex items-center justify-center min-h-[220px]">
            {industries.length === 0 ? (
              <p className="text-sm text-white/50">No industry data available.</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={complianceMix}
                    dataKey="value"
                    nameKey="label"
                    innerRadius={54}
                    outerRadius={82}
                    paddingAngle={2}
                    stroke="transparent"
                  >
                    {complianceMix.map((item) => (
                      <Cell key={item.label} fill={item.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 12, borderColor: '#111827' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="space-y-2">
            {complianceMix.map((item) => (
              <div key={item.label} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-white/88">{item.label}</span>
                  </div>
                  <span className="text-white/65">{item.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.25fr_1fr]">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.32em] text-gray-400 mb-2">
                Alert feed
              </p>
              <h2 className="text-2xl font-semibold text-gray-900">Latest field alerts</h2>
            </div>
            <span className="text-xs text-gray-400">Live from Firestore listeners</span>
          </div>

          {feedRows.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 px-5 py-10 text-center text-sm text-gray-400">
              No active alerts right now.
            </div>
          ) : (
            <div className="space-y-3">
              {feedRows.map((item) => (
                <div key={item.id} className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-4 flex items-start gap-3">
                  <div className="mt-0.5 rounded-xl bg-red-100 p-2 text-red-600">
                    <AlertTriangle size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-gray-800">{item.industryName}</p>
                      <span className={clsx(
                        'px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wide',
                        item.severity === 'critical' ? 'bg-red-100 text-red-700' :
                        item.severity === 'high' ? 'bg-orange-100 text-orange-700' :
                        'bg-yellow-100 text-yellow-700'
                      )}>
                        {item.severity}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {item.violatedParameters?.map((p) => `${p.parameter}: ${p.measured}/${p.limit}`).join(' · ') ?? 'No parameter summary'}
                    </p>
                  </div>
                  <span className="text-[11px] text-gray-400 whitespace-nowrap">
                    {item.detectedAt?.toDate ? format(item.detectedAt.toDate(), 'dd MMM HH:mm') : '-'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.32em] text-gray-400 mb-2">
                Open incidents
              </p>
              <h2 className="text-2xl font-semibold text-gray-900">Latest violations</h2>
            </div>
            <TrendingUp size={18} className="text-primary-500" />
          </div>

          {incidentRows.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 px-5 py-10 text-center text-sm text-gray-400">
              No violations available.
            </div>
          ) : (
            <div className="space-y-3">
              {incidentRows.map((item) => (
                <div key={item.id} className="rounded-2xl border border-gray-100 px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{item.industryName}</p>
                      <p className="text-xs text-gray-400 mt-1 capitalize">{item.readingType} monitoring</p>
                    </div>
                    <span className={clsx(
                      'px-2 py-1 rounded-full text-[10px] font-medium uppercase tracking-wide',
                      item.severity === 'critical' ? 'bg-red-100 text-red-700' :
                      item.severity === 'high' ? 'bg-orange-100 text-orange-700' :
                      'bg-yellow-100 text-yellow-700'
                    )}>
                      {item.severity}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {(item.violatedParameters ?? []).map((parameter) => (
                      <span key={parameter.parameter} className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] text-gray-600">
                        {parameter.parameter}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
