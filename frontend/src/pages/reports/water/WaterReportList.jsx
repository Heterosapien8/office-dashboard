// ── Water Report List ──────────────────────────────────────────
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PlusCircle, ChevronDown } from 'lucide-react'

export default function WaterReportList() {
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="page-title">Water Monitoring Reports</h1>
        <div className="relative">
          <button onClick={() => setMenuOpen(p => !p)} className="btn-primary flex items-center gap-2">
            <PlusCircle size={16} /> Add Report <ChevronDown size={14} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-11 bg-white border border-gray-200 rounded-xl shadow-lg z-10 overflow-hidden">
              <button onClick={() => { navigate('/reports/water/new/natural'); setMenuOpen(false) }}
                className="block w-full text-left px-4 py-2.5 text-sm hover:bg-primary-50 text-gray-700">
                Natural Water Analysis
              </button>
              <button onClick={() => { navigate('/reports/water/new/waste'); setMenuOpen(false) }}
                className="block w-full text-left px-4 py-2.5 text-sm hover:bg-primary-50 text-gray-700">
                Industrial Waste Water
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="card py-16 text-center text-gray-400 text-sm">
        No water monitoring reports submitted yet.
      </div>
    </div>
  )
}
