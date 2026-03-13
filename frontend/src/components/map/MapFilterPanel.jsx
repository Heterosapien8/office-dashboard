import { useState } from 'react'
import { ChevronDown, ChevronUp, Filter } from 'lucide-react'

const PARAMETER_OPTIONS = [
  { value: 'air', label: 'Air' },
  { value: 'water', label: 'Water' },
  { value: 'noise', label: 'Noise' },
]

const DATE_RANGE_OPTIONS = [
  { value: 'today', label: 'Today' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
]

export default function MapFilterPanel({ filters, onChange, regionalOffices, className = '' }) {
  const [collapsed, setCollapsed] = useState(false)

  function updateFilter(key, value) {
    onChange((current) => ({
      ...current,
      [key]: value,
    }))
  }

  return (
    <div className={`${className} w-[304px] rounded-2xl border border-slate-200/80 bg-white/95 shadow-[0_18px_50px_-28px_rgba(15,23,42,0.65)] backdrop-blur`}>
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="rounded-xl bg-slate-900 p-2 text-white">
            <Filter size={15} />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-slate-400">Map filters</p>
            <h2 className="text-sm font-semibold text-slate-900">Control the live view</h2>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setCollapsed((prev) => !prev)}
          className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:border-slate-300 hover:text-slate-900"
        >
          {collapsed ? <ChevronDown size={15} /> : <ChevronUp size={15} />}
        </button>
      </div>

      {!collapsed && (
        <div className="space-y-4 border-t border-slate-200/80 px-4 py-4">
          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Regional Office</span>
            <select
              value={filters.roId}
              onChange={(event) => updateFilter('roId', event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
            >
              <option value="all">All Regions</option>
              {regionalOffices.map((office) => (
                <option key={office.value} value={office.value}>
                  {office.label}
                </option>
              ))}
            </select>
          </label>

          <div>
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Parameter</span>
            <div className="grid grid-cols-3 gap-2 rounded-2xl bg-slate-100 p-1">
              {PARAMETER_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => updateFilter('parameter', option.value)}
                  className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
                    filters.parameter === option.value
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'text-slate-500 hover:bg-white hover:text-slate-900'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => updateFilter('violationsOnly', !filters.violationsOnly)}
            className="flex w-full items-center justify-between rounded-xl border border-slate-200 px-3 py-2 text-left transition hover:border-orange-300 hover:bg-orange-50/70"
          >
            <div>
              <p className="text-sm font-semibold text-slate-900">Show violations only</p>
              <p className="text-xs text-slate-500">Hide good and moderate stations</p>
            </div>
            <span className={`inline-flex h-6 w-11 rounded-full p-1 transition ${filters.violationsOnly ? 'bg-orange-500' : 'bg-slate-300'}`}>
              <span className={`h-4 w-4 rounded-full bg-white transition ${filters.violationsOnly ? 'translate-x-5' : 'translate-x-0'}`} />
            </span>
          </button>

          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Data as of</span>
            <select
              value={filters.dateRange}
              onChange={(event) => updateFilter('dateRange', event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
            >
              {DATE_RANGE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}
    </div>
  )
}
