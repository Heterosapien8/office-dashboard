// ── Noise Report List ──────────────────────────────────────────
import { useNavigate } from 'react-router-dom'
import { PlusCircle } from 'lucide-react'

export function NoiseReportList() {
  const navigate = useNavigate()
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="page-title">Noise Monitoring Reports</h1>
        <button onClick={() => navigate('/reports/noise/new')} className="btn-primary flex items-center gap-2">
          <PlusCircle size={16} /> Add Report
        </button>
      </div>
      <div className="card py-16 text-center text-gray-400 text-sm">No noise monitoring reports yet.</div>
    </div>
  )
}
export default NoiseReportList
