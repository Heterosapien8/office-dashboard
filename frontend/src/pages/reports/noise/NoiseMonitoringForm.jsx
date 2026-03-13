import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, addDoc, getDocs, serverTimestamp, query, orderBy } from 'firebase/firestore'
import { db } from '../../../config/firebase'
import { useAuth } from '../../../contexts/AuthContext'
import { COLLECTIONS, NOISE_LIMITS, NOISE_ZONES } from '../../../config/constants'
import { ArrowLeft, PlusCircle, Trash2, Save } from 'lucide-react'

const emptyRow = () => ({ locationName: '', zone: 'industrial', monitoringTime: 'Day', noiseLevel: '' })

function summarizeNoiseRows(rows) {
  const levels = rows
    .map((row) => Number(row.noiseLevel))
    .filter((value) => Number.isFinite(value))

  if (levels.length === 0) {
    return {
      averageNoiseLevel: null,
      peakNoiseLevel: null,
    }
  }

  const averageNoiseLevel = Number((levels.reduce((sum, value) => sum + value, 0) / levels.length).toFixed(2))
  const peakNoiseLevel = Math.max(...levels)

  return {
    averageNoiseLevel,
    peakNoiseLevel,
  }
}

export default function NoiseMonitoringForm() {
  const { currentUser, roId, roName } = useAuth()
  const navigate = useNavigate()

  const [industries,  setIndustries]  = useState([])
  const [locations,   setLocations]   = useState([])
  const [teamMembers, setTeamMembers] = useState([])
  const [saving,      setSaving]      = useState(false)
  const [errors,      setErrors]      = useState({})

  const [form, setForm] = useState({
    roId, roName,
    industryId: '', industryName: '',
    locationId: '', locationName: '',
    monitoringType: 'package',
    dateOfMonitoring: '', dateOfAnalysis: '',
    monitoredByName: '',
  })
  const [rows, setRows] = useState([emptyRow()])

  useEffect(() => {
    Promise.all([
      getDocs(query(collection(db, COLLECTIONS.INDUSTRIES),     orderBy('name'))),
      getDocs(query(collection(db, COLLECTIONS.MONITORING_LOCATIONS), orderBy('name'))),
      getDocs(query(collection(db, COLLECTIONS.MONITORING_TEAMS), orderBy('name'))),
    ]).then(([ind, loc, team]) => {
      setIndustries(ind.docs.map(d  => ({ id: d.id, ...d.data() })))
      setLocations(loc.docs.map(d => ({ id: d.id, ...d.data() })))
      setTeamMembers(team.docs.map(d => ({ id: d.id, ...d.data() })))
    })
  }, [])

  function getFlag(row) {
    const level = parseFloat(row.noiseLevel)
    if (isNaN(level)) return null
    const limits = NOISE_LIMITS[row.zone]
    const limit  = row.monitoringTime === 'Day' ? limits.day : limits.night
    return level > limit ? 'H' : 'OK'
  }

  function updateRow(idx, key, val) {
    setRows(p => p.map((r, i) => i === idx ? { ...r, [key]: val } : r))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const nextErrors = {}
    if (!form.industryId) nextErrors.industryId = 'Required'
    if (!form.locationId) nextErrors.locationId = 'Required'
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    setSaving(true)
    try {
      const readingsWithFlags = rows.map(r => ({ ...r, flag: getFlag(r) ?? 'OK' }))
      const isViolation = readingsWithFlags.some(r => r.flag === 'H')
      const violatedReadings = readingsWithFlags.map((r, i) => r.flag === 'H' ? String(i) : null).filter(Boolean)
      const summary = summarizeNoiseRows(readingsWithFlags)
      const dominantRow = readingsWithFlags.reduce((current, row) => {
        const currentLevel = Number(current?.noiseLevel)
        const rowLevel = Number(row.noiseLevel)
        if (!Number.isFinite(rowLevel)) return current
        if (!Number.isFinite(currentLevel) || rowLevel > currentLevel) return row
        return current
      }, null)

      await addDoc(collection(db, COLLECTIONS.NOISE_READINGS), {
        roId, roName,
        industryId:      form.industryId,
        industryName:    form.industryName,
        locationId:      form.locationId,
        locationName:    form.locationName,
        monitoringType:  form.monitoringType,
        dateOfMonitoring: form.dateOfMonitoring ? new Date(form.dateOfMonitoring) : null,
        dateOfAnalysis:   form.dateOfAnalysis   ? new Date(form.dateOfAnalysis)   : null,
        monitoredByName: form.monitoredByName,
        readings:        readingsWithFlags,
        readingCount:    readingsWithFlags.length,
        averageNoiseLevel: summary.averageNoiseLevel,
        noiseLevel:      summary.peakNoiseLevel,
        peakNoiseLevel:  summary.peakNoiseLevel,
        zone:            dominantRow?.zone ?? 'industrial',
        monitoringTime:  dominantRow?.monitoringTime ?? 'Day',
        isViolation,
        violatedReadings,
        isSimulated:     false,
        submittedBy:     currentUser.uid,
        createdAt:       serverTimestamp(),
      })
      navigate('/reports/noise')
    } catch (err) {
      console.error(err)
      setErrors({ _form: 'Failed to save.' })
    } finally {
      setSaving(false)
    }
  }

  const setField = (k, v) => setForm(p => ({ ...p, [k]: v }))

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/reports/noise')} className="p-2 rounded-lg text-gray-400 hover:bg-gray-100">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="page-title">Noise Monitoring Report</h1>
          <p className="text-sm text-gray-400">Submit noise level readings with zone-based compliance check</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Metadata */}
        <div className="card">
          <h2 className="font-semibold text-primary-700 text-sm mb-4 pb-2 border-b border-gray-100">Report Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Regional Office</label>
              <input value={roName ?? ''} readOnly className="input-base bg-gray-50" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Monitoring Type</label>
              <select value={form.monitoringType} onChange={e => setField('monitoringType', e.target.value)} className="input-base">
                <option value="package">Package Monitoring</option>
                <option value="special">Special Monitoring</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Industry <span className="text-red-500">*</span></label>
              <select value={form.industryId} onChange={e => {
                const ind = industries.find(i => i.id === e.target.value)
                setField('industryId', e.target.value)
                setField('industryName', ind?.name ?? '')
              }} className={`input-base ${errors.industryId ? 'border-red-400' : ''}`}>
                <option value="">-- Select --</option>
                {industries.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Monitoring Location <span className="text-red-500">*</span></label>
              <select value={form.locationId} onChange={e => {
                const location = locations.find(item => item.id === e.target.value)
                setField('locationId', e.target.value)
                setField('locationName', location?.name ?? '')
                setRows(current => current.map(row => ({ ...row, locationName: location?.name ?? row.locationName })))
              }} className={`input-base ${errors.locationId ? 'border-red-400' : ''}`}>
                <option value="">-- Select --</option>
                {locations.filter(location => location.type === 'noise' || location.type === 'multi').map(location => (
                  <option key={location.id} value={location.id}>{location.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Monitored By</label>
              <select value={form.monitoredByName} onChange={e => setField('monitoredByName', e.target.value)} className="input-base">
                <option value="">-- Select --</option>
                {teamMembers.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Date of Monitoring</label>
              <input type="date" value={form.dateOfMonitoring} onChange={e => setField('dateOfMonitoring', e.target.value)} className="input-base" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Date of Analysis</label>
              <input type="date" value={form.dateOfAnalysis} onChange={e => setField('dateOfAnalysis', e.target.value)} className="input-base" />
            </div>
          </div>
        </div>

        {/* Prescribed limits reference — ALWAYS visible per wireframe */}
        <div className="card border border-blue-100 bg-blue-50/30">
          <h2 className="font-semibold text-primary-700 text-sm mb-3">Prescribed Noise Limits (Reference)</h2>
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-primary-700 text-white">
                <th className="px-3 py-2 text-left">Category of Area / Zone</th>
                <th className="px-3 py-2 text-center">Day Time Limit (dB)</th>
                <th className="px-3 py-2 text-center">Night Time Limit (dB)</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Silence Area',      50, 40],
                ['Residential Area',  55, 45],
                ['Commercial Area',   65, 55],
                ['Industrial Area',   75, 70],
              ].map(([zone, day, night], i) => (
                <tr key={zone} className={i % 2 === 0 ? 'bg-white' : 'bg-blue-50/50'}>
                  <td className="px-3 py-2 text-gray-700">{zone}</td>
                  <td className="px-3 py-2 text-center font-medium text-gray-700">{day}</td>
                  <td className="px-3 py-2 text-center font-medium text-gray-700">{night}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Noise readings table */}
        <div className="card">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
            <h2 className="font-semibold text-primary-700 text-sm">Noise Level Readings</h2>
            <button type="button" onClick={() => setRows(p => [...p, emptyRow()])}
              className="btn-secondary flex items-center gap-1 text-xs !py-1.5">
              <PlusCircle size={13} /> Add Row
            </button>
          </div>
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-xs">
                <th className="px-3 py-2 text-left">Location</th>
                <th className="px-3 py-2 text-left">Area Zone</th>
                <th className="px-3 py-2 text-left">Unit</th>
                <th className="px-3 py-2 text-left">Time</th>
                <th className="px-3 py-2 text-left">Noise Level</th>
                <th className="px-3 py-2 text-left">Flag</th>
                <th className="px-3 py-2 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => {
                const flag = getFlag(row)
                return (
                  <tr key={i} className="border-t border-gray-100">
                    <td className="px-2 py-1.5">
                      <input value={row.locationName} onChange={e => updateRow(i, 'locationName', e.target.value)}
                        placeholder="Location name" className="input-base text-xs w-32" />
                    </td>
                    <td className="px-2 py-1.5">
                      <select value={row.zone} onChange={e => updateRow(i, 'zone', e.target.value)} className="input-base text-xs">
                        {NOISE_ZONES.map(z => <option key={z.value} value={z.value}>{z.label}</option>)}
                      </select>
                    </td>
                    <td className="px-2 py-1.5 text-gray-500">dB</td>
                    <td className="px-2 py-1.5">
                      <select value={row.monitoringTime} onChange={e => updateRow(i, 'monitoringTime', e.target.value)} className="input-base text-xs w-20">
                        <option>Day</option><option>Night</option>
                      </select>
                    </td>
                    <td className="px-2 py-1.5">
                      <input type="number" step="0.1" value={row.noiseLevel}
                        onChange={e => updateRow(i, 'noiseLevel', e.target.value)}
                        placeholder="0.0"
                        className={`input-base text-xs w-20 ${flag === 'H' ? 'border-red-400 bg-red-50' : ''}`} />
                    </td>
                    <td className="px-2 py-1.5">
                      {flag && (
                        <span className={`text-xs font-bold ${flag === 'H' ? 'text-red-500' : 'text-green-600'}`}>
                          {flag}
                        </span>
                      )}
                    </td>
                    <td className="px-2 py-1.5">
                      {rows.length > 1 && (
                        <button type="button" onClick={() => setRows(p => p.filter((_,j) => j !== i))}
                          className="text-red-400 hover:text-red-600">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
            <Save size={16} /> {saving ? 'Saving...' : 'Save Report'}
          </button>
          <button type="button" onClick={() => navigate('/reports/noise')} className="btn-secondary">Cancel</button>
        </div>
      </form>
    </div>
  )
}
