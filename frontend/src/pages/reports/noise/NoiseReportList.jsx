import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import { db } from '../../../config/firebase'
import { COLLECTIONS } from '../../../config/constants'
import { PlusCircle, Volume2 } from 'lucide-react'
import clsx from 'clsx'
import { format } from 'date-fns'

export function NoiseReportList() {
  const navigate = useNavigate()
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const reportQuery = query(collection(db, COLLECTIONS.NOISE_READINGS), orderBy('createdAt', 'desc'))
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
        <h1 className="page-title">Noise Monitoring Reports</h1>
        <button onClick={() => navigate('/reports/noise/new')} className="btn-primary flex items-center gap-2">
          <PlusCircle size={16} /> Add Report
        </button>
      </div>

      <div className="card !p-0 overflow-hidden">
        {loading ? (
          <div className="py-16 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : reports.length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-sm">No noise monitoring reports yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-primary-700 text-white">
                <th className="px-4 py-3 text-left text-xs font-medium">Industry</th>
                <th className="px-4 py-3 text-left text-xs font-medium">Location</th>
                <th className="px-4 py-3 text-left text-xs font-medium">Regional Office</th>
                <th className="px-4 py-3 text-left text-xs font-medium">Peak / Avg</th>
                <th className="px-4 py-3 text-left text-xs font-medium">Readings</th>
                <th className="px-4 py-3 text-left text-xs font-medium">Violations</th>
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
                        <Volume2 size={15} className="text-primary-600" />
                      </div>
                      <span className="font-medium">{report.industryName ?? '-'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{report.locationName ?? '-'}</td>
                  <td className="px-4 py-3 text-gray-500">{report.roName ?? '-'}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {report.peakNoiseLevel ?? report.noiseLevel ?? '-'} dB / {report.averageNoiseLevel ?? '-'} dB
                  </td>
                  <td className="px-4 py-3 text-gray-500">{report.readingCount ?? report.readings?.length ?? 0}</td>
                  <td className="px-4 py-3 text-gray-500">{report.violatedReadings?.length ?? 0}</td>
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

export default NoiseReportList
