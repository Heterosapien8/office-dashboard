import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, query, orderBy, limit, onSnapshot, where } from 'firebase/firestore'
import { db } from '../../../config/firebase'
import { useAuth } from '../../../contexts/AuthContext'
import { COLLECTIONS, ROLES } from '../../../config/constants'
import { PlusCircle, Eye } from 'lucide-react'
import { format } from 'date-fns'
import clsx from 'clsx'

export default function AirMonitoringList() {
  const { role, roId } = useAuth()
  const navigate = useNavigate()
  const [readings, setReadings] = useState([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    const isAdmin = role === ROLES.SUPER_ADMIN
    const colRef  = collection(db, COLLECTIONS.AIR_READINGS)
    const q = isAdmin
      ? query(colRef, orderBy('createdAt', 'desc'), limit(50))
      : query(colRef, where('roId', '==', roId), orderBy('createdAt', 'desc'), limit(50))

    return onSnapshot(q, snap => {
      setReadings(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })
  }, [role, roId])

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="page-title">Air Monitoring Reports</h1>
        <button onClick={() => navigate('/reports/air/new')} className="btn-primary flex items-center gap-2">
          <PlusCircle size={16} /> Add Report
        </button>
      </div>

      <div className="card !p-0 overflow-hidden">
        {loading ? (
          <div className="py-16 flex justify-center">
            <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : readings.length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-sm">No air monitoring reports submitted yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-primary-700 text-white text-xs">
                <th className="px-4 py-3 text-left">S.No.</th>
                <th className="px-4 py-3 text-left">Industry / Station</th>
                <th className="px-4 py-3 text-left">Monitoring Type</th>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">AQI</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {readings.map((r, i) => (
                <tr key={r.id} className={clsx('hover:bg-primary-50', i % 2 === 1 && 'bg-gray-50')}>
                  <td className="px-4 py-3 text-gray-400 text-xs">{String(i + 1).padStart(2,'0')}</td>
                  <td className="px-4 py-3 font-medium text-gray-700">{r.industryName ?? r.roName ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-500 capitalize">{r.monitoringType ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {r.dateOfMonitoring?.toDate ? format(r.dateOfMonitoring.toDate(), 'dd/MM/yyyy') : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={clsx('font-semibold', r.aqi > 200 ? 'text-red-600' : r.aqi > 100 ? 'text-orange-500' : 'text-green-600')}>
                      {r.aqi ?? '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={r.isViolation ? 'badge-violation' : 'badge-compliant'}>
                      {r.isViolation ? 'Violation' : 'Compliant'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => navigate(`/reports/air/${r.id}`)}
                      className="p-1.5 rounded-lg text-gray-400 hover:bg-primary-100 hover:text-primary-600">
                      <Eye size={15} />
                    </button>
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
