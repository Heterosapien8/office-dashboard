import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import { db } from '../../../config/firebase'
import { COLLECTIONS } from '../../../config/constants'
import { PlusCircle, ChevronDown, Droplets } from 'lucide-react'
import clsx from 'clsx'
import { format } from 'date-fns'

export default function WaterReportList() {
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const reportQuery = query(collection(db, COLLECTIONS.WATER_READINGS), orderBy('createdAt', 'desc'))
    return onSnapshot(reportQuery, (snapshot) => {
      setReports(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
      setLoading(false)
    }, () => {
      setLoading(false)
    })
  }, [])

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="page-title">Water Monitoring Reports</h1>
        <div className="relative">
          <button onClick={() => setMenuOpen((prev) => !prev)} className="btn-primary flex items-center gap-2">
            <PlusCircle size={16} /> Add Report <ChevronDown size={14} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-11 bg-white border border-gray-200 rounded-xl shadow-lg z-10 overflow-hidden">
              <button
                onClick={() => { navigate('/reports/water/new/natural'); setMenuOpen(false) }}
                className="block w-full text-left px-4 py-2.5 text-sm hover:bg-primary-50 text-gray-700"
              >
                Natural Water Analysis
              </button>
              <button
                onClick={() => { navigate('/reports/water/new/waste'); setMenuOpen(false) }}
                className="block w-full text-left px-4 py-2.5 text-sm hover:bg-primary-50 text-gray-700"
              >
                Industrial Waste Water
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="card !p-0 overflow-hidden">
        {loading ? (
          <div className="py-16 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : reports.length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-sm">No water monitoring reports submitted yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-primary-700 text-white">
                <th className="px-4 py-3 text-left text-xs font-medium">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium">Industry / Source</th>
                <th className="px-4 py-3 text-left text-xs font-medium">Location</th>
                <th className="px-4 py-3 text-left text-xs font-medium">Key Metrics</th>
                <th className="px-4 py-3 text-left text-xs font-medium">Regional Office</th>
                <th className="px-4 py-3 text-left text-xs font-medium">Samples</th>
                <th className="px-4 py-3 text-left text-xs font-medium">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium">Submitted</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {reports.map((report, index) => (
                <tr key={report.id} className={clsx('hover:bg-primary-50', index % 2 === 1 && 'bg-gray-50')}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 text-gray-700">
                      <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center">
                        <Droplets size={15} className="text-primary-600" />
                      </div>
                      <span className="capitalize">{report.waterType ?? 'natural'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-700 font-medium">{report.industryName ?? '-'}</td>
                  <td className="px-4 py-3 text-gray-500">{report.locationName ?? '-'}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    pH {report.summary?.pH ?? report.pH ?? '-'} · BOD {report.summary?.BOD ?? report.BOD ?? '-'}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{report.roName ?? '-'}</td>
                  <td className="px-4 py-3 text-gray-500">{report.sampleCount ?? report.samples?.length ?? 0}</td>
                  <td className="px-4 py-3">
                    <span className={report.isViolation ? 'badge-violation' : 'badge-compliant'}>
                      {report.isViolation ? 'Violation' : 'Compliant'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400">
                    {report.createdAt?.toDate ? format(report.createdAt.toDate(), 'dd/MM/yyyy HH:mm') : '-'}
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
