// ── Compliance Dashboard ───────────────────────────────────────
import { useEffect, useState } from 'react'
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore'
import { db } from '../../config/firebase'
import { useAuth } from '../../contexts/AuthContext'
import { COLLECTIONS, ROLES, ESCALATION_STAGES } from '../../config/constants'
import { AlertTriangle, ShieldCheck, Clock, TrendingUp } from 'lucide-react'
import { format } from 'date-fns'
import clsx from 'clsx'

export default function ComplianceDashboard() {
  const { role, roId } = useAuth()
  const [violations,  setViolations]  = useState([])
  const [escalations, setEscalations] = useState([])
  const [industries,  setIndustries]  = useState([])

  useEffect(() => {
    const isAdmin = role === ROLES.SUPER_ADMIN
    const unsubs  = []

    let vQ = query(collection(db, COLLECTIONS.VIOLATIONS), orderBy('detectedAt', 'desc'), limit(30))
    if (!isAdmin) vQ = query(collection(db, COLLECTIONS.VIOLATIONS), where('roId', '==', roId), orderBy('detectedAt', 'desc'), limit(30))
    unsubs.push(onSnapshot(vQ, s => setViolations(s.docs.map(d => ({ id: d.id, ...d.data() })))))

    let eQ = query(collection(db, COLLECTIONS.ESCALATIONS), orderBy('createdAt', 'desc'), limit(20))
    unsubs.push(onSnapshot(eQ, s => setEscalations(s.docs.map(d => ({ id: d.id, ...d.data() })))))

    let iQ = query(collection(db, COLLECTIONS.INDUSTRIES))
    if (!isAdmin) iQ = query(collection(db, COLLECTIONS.INDUSTRIES), where('roId', '==', roId))
    unsubs.push(onSnapshot(iQ, s => setIndustries(s.docs.map(d => ({ id: d.id, ...d.data() })))))

    return () => unsubs.forEach(u => u())
  }, [role, roId])

  const openViolations  = violations.filter(v => v.status === 'open').length
  const compliantCount  = industries.filter(i => i.complianceStatus === 'compliant').length
  const totalCount      = industries.length
  const complianceRate  = totalCount > 0 ? Math.round((compliantCount / totalCount) * 100) : 0
  const openEscalations = escalations.filter(e => e.status !== 'RESOLVED').length
  const pendingEscalations = escalations.filter(e => e.status === 'PENDING').length

  const summaryCards = [
    {
      label: 'Open Violations',
      value: openViolations,
      meta: 'Immediate attention required',
      icon: AlertTriangle,
      shell: 'from-red-500 to-red-600',
    },
    {
      label: 'Open Escalations',
      value: openEscalations,
      meta: `${pendingEscalations} still pending review`,
      icon: Clock,
      shell: 'from-orange-500 to-amber-500',
    },
    {
      label: 'Compliant',
      value: compliantCount,
      meta: `${totalCount - compliantCount} require follow-up`,
      icon: ShieldCheck,
      shell: 'from-emerald-500 to-teal-600',
    },
    {
      label: 'Compliance Rate',
      value: `${complianceRate}%`,
      meta: 'Across the current registry',
      icon: TrendingUp,
      shell: 'from-primary-600 to-primary-800',
    },
  ]

  return (
    <div className="space-y-6">
      <h1 className="page-title">Compliance Dashboard</h1>

      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map(({ label, value, meta, icon: Icon, shell }) => (
          <div key={label} className={`rounded-[24px] bg-gradient-to-br ${shell} text-white p-5 shadow-sm min-h-[148px]`}>
            <div className="flex items-start justify-between gap-3">
              <p className="text-[10px] uppercase tracking-[0.28em] text-white/75">{label}</p>
              <div className="rounded-2xl bg-white/15 p-2.5">
                <Icon size={16} className="text-white" />
              </div>
            </div>
            <div className="mt-6">
              <p className="text-4xl font-semibold leading-none">{value}</p>
              <p className="text-xs text-white/75 mt-3">{meta}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent violations */}
      <div className="card">
        <h2 className="font-semibold text-gray-700 text-sm mb-4">Recent Violations</h2>
        {violations.length === 0 ? (
          <p className="text-sm text-gray-400 py-8 text-center">No violations recorded.</p>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-primary-700 text-white">
                {['Industry', 'Type', 'Parameters', 'Severity', 'Status', 'Detected'].map(h => (
                  <th key={h} className="px-3 py-2 text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {violations.slice(0, 10).map((v, i) => (
                <tr key={v.id} className={clsx('hover:bg-gray-50', i % 2 === 1 && 'bg-gray-50/50')}>
                  <td className="px-3 py-2 font-medium text-gray-700">{v.industryName}</td>
                  <td className="px-3 py-2 capitalize text-gray-500">{v.readingType}</td>
                  <td className="px-3 py-2 text-gray-500">
                    {v.violatedParameters?.map(p => p.parameter ?? p).join(', ') ?? '—'}
                  </td>
                  <td className="px-3 py-2">
                    <span className={clsx('px-2 py-0.5 rounded-full text-[10px] font-medium',
                      v.severity === 'critical' ? 'bg-red-100 text-red-700' :
                      v.severity === 'high'     ? 'bg-orange-100 text-orange-700' :
                      'bg-yellow-100 text-yellow-700'
                    )}>{v.severity}</span>
                  </td>
                  <td className="px-3 py-2">
                    <span className={v.status === 'open' ? 'badge-violation' : 'badge-compliant'}>
                      {v.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-gray-400">
                    {v.detectedAt?.toDate ? format(v.detectedAt.toDate(), 'dd/MM HH:mm') : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
