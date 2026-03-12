import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, addDoc, getDocs, serverTimestamp, query, orderBy } from 'firebase/firestore'
import { db } from '../../../config/firebase'
import { useAuth } from '../../../contexts/AuthContext'
import { COLLECTIONS, AIR_MONITORING_SUBTYPES } from '../../../config/constants'
import { ArrowLeft, PlusCircle, Trash2, Save } from 'lucide-react'
import { calculateAQI } from '../../../utils/aqiCalculator'

const AMBIENT_PARAMS = [
  { key: 'PM10',   label: 'PM10',          unit: 'µg/m³', limit: 100 },
  { key: 'PM2_5',  label: 'PM2.5',         unit: 'µg/m³', limit: 60  },
  { key: 'SO2',    label: 'SO₂',           unit: 'µg/m³', limit: 80  },
  { key: 'NO2',    label: 'NO₂',           unit: 'µg/m³', limit: 80  },
  { key: 'O3',     label: 'O₃',            unit: 'µg/m³', limit: 100 },
  { key: 'CO_8hr', label: 'CO (8hr)',       unit: 'mg/m³', limit: 10  },
  { key: 'MH3',    label: 'NH₃',           unit: 'µg/m³', limit: 400 },
  { key: 'Pb',     label: 'Pb (Lead)',      unit: 'µg/m³', limit: 1.0 },
]

const emptyStack = () => ({ source: '', unit: 'mg/Nm³', particulateMatter: '', remark: '' })

export default function AirMonitoringForm() {
  const { currentUser, roId, roName } = useAuth()
  const navigate = useNavigate()

  const [industries,  setIndustries]  = useState([])
  const [locations,   setLocations]   = useState([])
  const [teamMembers, setTeamMembers] = useState([])
  const [saving,      setSaving]      = useState(false)
  const [errors,      setErrors]      = useState({})

  const [form, setForm] = useState({
    roId, roName,
    industryId:     '',
    industryName:   '',
    locationId:     '',
    monitoringType: 'package',
    dateOfMonitoring: '',
    dateOfAnalysis:   '',
    monitoredByName:  '',
  })
  const [stackRows,  setStackRows]  = useState([emptyStack()])
  const [ambientAir, setAmbientAir] = useState(
    Object.fromEntries(AMBIENT_PARAMS.map(p => [p.key, '']))
  )

  // Load dropdowns
  useEffect(() => {
    const loadData = async () => {
      const [indSnap, locSnap, teamSnap] = await Promise.all([
        getDocs(query(collection(db, COLLECTIONS.INDUSTRIES),   orderBy('name'))),
        getDocs(query(collection(db, COLLECTIONS.MONITORING_LOCATIONS), orderBy('name'))),
        getDocs(query(collection(db, COLLECTIONS.MONITORING_TEAMS),     orderBy('name'))),
      ])
      setIndustries(indSnap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLocations(locSnap.docs.map(d  => ({ id: d.id, ...d.data() })))
      setTeamMembers(teamSnap.docs.map(d => ({ id: d.id, ...d.data() })))
    }
    loadData()
  }, [])

  const showStack   = ['package', 'industrial'].includes(form.monitoringType)
  const showAmbient = ['package', 'namp', 'special'].includes(form.monitoringType)

  function setField(key, val) {
    setForm(p => ({ ...p, [key]: val }))
    setErrors(p => ({ ...p, [key]: null }))
  }

  function updateStack(idx, key, val) {
    setStackRows(p => p.map((r, i) => i === idx ? { ...r, [key]: val } : r))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    // Basic validation
    const errs = {}
    if (!form.industryId)       errs.industryId       = 'Required'
    if (!form.dateOfMonitoring) errs.dateOfMonitoring = 'Required'
    if (Object.keys(errs).length) { setErrors(errs); return }

    setSaving(true)
    try {
      // Calculate AQI if ambient data present
      const ambientValues = Object.fromEntries(
        AMBIENT_PARAMS.map(p => [p.key, parseFloat(ambientAir[p.key]) || null])
      )
      const aqiResult = showAmbient ? calculateAQI(ambientValues) : null

      // Check violations against limits
      const violated = []
      if (showAmbient) {
        AMBIENT_PARAMS.forEach(p => {
          const val = parseFloat(ambientAir[p.key])
          if (val && val > p.limit) violated.push(p.key)
        })
      }
      if (showStack) {
        stackRows.forEach(row => {
          const pm = parseFloat(row.particulateMatter)
          if (pm && pm > 150) violated.push('PM_Stack')
        })
      }

      await addDoc(collection(db, COLLECTIONS.AIR_READINGS), {
        roId,
        roName,
        industryId:       form.industryId,
        industryName:     form.industryName,
        locationId:       form.locationId || null,
        monitoringType:   form.monitoringType,
        monitoredByName:  form.monitoredByName,
        dateOfMonitoring: new Date(form.dateOfMonitoring),
        dateOfAnalysis:   form.dateOfAnalysis ? new Date(form.dateOfAnalysis) : null,
        stackEmissions:   showStack ? stackRows : null,
        ambientAir:       showAmbient ? ambientValues : null,
        aqi:              aqiResult?.aqi ?? null,
        aqiCategory:      aqiResult?.category ?? null,
        isViolation:      violated.length > 0,
        violatedParameters: violated,
        isSimulated:      false,
        submittedBy:      currentUser.uid,
        createdAt:        serverTimestamp(),
      })
      navigate('/reports/air')
    } catch (err) {
      console.error(err)
      setErrors({ _form: 'Failed to save. Please try again.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/reports/air')} className="p-2 rounded-lg text-gray-400 hover:bg-gray-100">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="page-title">Air Monitoring Report</h1>
          <p className="text-sm text-gray-400">Submit new air quality / stack emission report</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {errors._form && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{errors._form}</div>
        )}

        {/* Section 1: Report Metadata */}
        <div className="card">
          <h2 className="font-semibold text-primary-700 text-sm mb-4 pb-2 border-b border-gray-100">
            Report Information
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {/* Regional Office (read-only) */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Regional Office</label>
              <input value={roName ?? ''} readOnly className="input-base bg-gray-50" />
            </div>

            {/* Monitoring type */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Monitoring Type <span className="text-red-500">*</span></label>
              <select value={form.monitoringType} onChange={e => setField('monitoringType', e.target.value)} className="input-base">
                {AIR_MONITORING_SUBTYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>

            {/* Industry */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Industry / Station <span className="text-red-500">*</span></label>
              <select
                value={form.industryId}
                onChange={e => {
                  const ind = industries.find(i => i.id === e.target.value)
                  setField('industryId',   e.target.value)
                  setField('industryName', ind?.name ?? '')
                }}
                className={`input-base ${errors.industryId ? 'border-red-400' : ''}`}
              >
                <option value="">-- Select Industry --</option>
                {industries.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
              </select>
              {errors.industryId && <p className="text-xs text-red-500 mt-1">{errors.industryId}</p>}
            </div>

            {/* Location */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Location</label>
              <select value={form.locationId} onChange={e => setField('locationId', e.target.value)} className="input-base">
                <option value="">-- Select Location --</option>
                {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>

            {/* Date of monitoring */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Date & Time of Monitoring <span className="text-red-500">*</span></label>
              <input
                type="datetime-local" value={form.dateOfMonitoring}
                onChange={e => setField('dateOfMonitoring', e.target.value)}
                className={`input-base ${errors.dateOfMonitoring ? 'border-red-400' : ''}`}
              />
            </div>

            {/* Date of analysis */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Date & Time of Analysis</label>
              <input type="datetime-local" value={form.dateOfAnalysis}
                onChange={e => setField('dateOfAnalysis', e.target.value)} className="input-base" />
            </div>

            {/* Monitored by */}
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Monitored By</label>
              <select value={form.monitoredByName} onChange={e => setField('monitoredByName', e.target.value)} className="input-base">
                <option value="">-- Select Team Member --</option>
                {teamMembers.map(m => <option key={m.id} value={m.name}>{m.name} — {m.designation}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Stack Emission */}
        {showStack && (
          <div className="card">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
              <h2 className="font-semibold text-primary-700 text-sm">Stack Emission Monitoring</h2>
              <button type="button" onClick={() => setStackRows(p => [...p, emptyStack()])}
                className="btn-secondary flex items-center gap-1 text-xs !py-1.5">
                <PlusCircle size={13} /> Add Row
              </button>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-xs text-gray-600">
                  <th className="px-3 py-2 text-left">Stack / Source</th>
                  <th className="px-3 py-2 text-left">Unit</th>
                  <th className="px-3 py-2 text-left">Particulate Matter</th>
                  <th className="px-3 py-2 text-left">Remark</th>
                  <th className="px-3 py-2 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {stackRows.map((row, i) => (
                  <tr key={i} className="border-t border-gray-100">
                    <td className="px-2 py-1.5">
                      <input value={row.source} onChange={e => updateStack(i, 'source', e.target.value)}
                        placeholder="e.g. Stack-1 (Boiler)" className="input-base text-xs" />
                    </td>
                    <td className="px-2 py-1.5">
                      <select value={row.unit} onChange={e => updateStack(i, 'unit', e.target.value)} className="input-base text-xs">
                        <option>mg/Nm³</option><option>µg/m³</option>
                      </select>
                    </td>
                    <td className="px-2 py-1.5">
                      <input type="number" value={row.particulateMatter}
                        onChange={e => updateStack(i, 'particulateMatter', e.target.value)}
                        placeholder="0.00" className="input-base text-xs" />
                    </td>
                    <td className="px-2 py-1.5">
                      <input value={row.remark} onChange={e => updateStack(i, 'remark', e.target.value)}
                        placeholder="Remark" className="input-base text-xs" />
                    </td>
                    <td className="px-2 py-1.5">
                      {stackRows.length > 1 && (
                        <button type="button" onClick={() => setStackRows(p => p.filter((_,j) => j !== i))}
                          className="text-red-400 hover:text-red-600">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Section 3: Ambient Air Quality */}
        {showAmbient && (
          <div className="card">
            <h2 className="font-semibold text-primary-700 text-sm mb-4 pb-2 border-b border-gray-100">
              Ambient Air Quality Monitoring
            </h2>
            <div className="grid grid-cols-4 gap-3">
              {AMBIENT_PARAMS.map(p => (
                <div key={p.key}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    {p.label}
                    <span className="text-gray-400 font-normal ml-1">({p.unit})</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number" step="0.01"
                      value={ambientAir[p.key]}
                      onChange={e => setAmbientAir(prev => ({ ...prev, [p.key]: e.target.value }))}
                      placeholder="—"
                      className={`input-base ${
                        parseFloat(ambientAir[p.key]) > p.limit ? 'border-red-400 bg-red-50' : ''
                      }`}
                    />
                    {parseFloat(ambientAir[p.key]) > p.limit && (
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-red-500 font-bold">H</span>
                    )}
                  </div>
                  <p className="text-[10px] text-gray-400 mt-0.5">Limit: {p.limit}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Submit */}
        <div className="flex gap-3">
          <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
            <Save size={16} />
            {saving ? 'Saving...' : 'Save Report'}
          </button>
          <button type="button" onClick={() => navigate('/reports/air')} className="btn-secondary">Cancel</button>
        </div>
      </form>
    </div>
  )
}
