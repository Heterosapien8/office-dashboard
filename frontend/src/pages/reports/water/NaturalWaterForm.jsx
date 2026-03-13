import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, addDoc, getDocs, serverTimestamp, query, orderBy } from 'firebase/firestore'
import { db } from '../../../config/firebase'
import { useAuth } from '../../../contexts/AuthContext'
import { COLLECTIONS } from '../../../config/constants'
import { ArrowLeft, PlusCircle, Trash2, Save } from 'lucide-react'

// Parameters for natural water analysis with prescribed limits
const WATER_PARAMS = [
  { key: 'temperature',  label: 'Temperature',   unit: '°C',     limitMin: null, limitMax: 40   },
  { key: 'pH',           label: 'pH',            unit: '',       limitMin: 6.5,  limitMax: 8.5  },
  { key: 'turbidity',    label: 'Turbidity',     unit: 'NTU',    limitMin: null, limitMax: 10   },
  { key: 'conductivity', label: 'Conductivity',  unit: 'µS/cm',  limitMin: null, limitMax: 1500 },
  { key: 'totalSolids',  label: 'Total Solids',  unit: 'mg/L',   limitMin: null, limitMax: 500  },
  { key: 'BOD',          label: 'BOD',           unit: 'mg/L',   limitMin: null, limitMax: 3    },
]

const emptySample = () =>
  Object.fromEntries([['sampleNo', ''], ...WATER_PARAMS.map(p => [p.key, ''])])

function getFlag(val, param) {
  const v = parseFloat(val)
  if (isNaN(v)) return null
  if (param.limitMax && v > param.limitMax) return 'H'
  if (param.limitMin && v < param.limitMin) return 'L'
  return 'OK'
}

function computeAverage(samples, key) {
  const values = samples
    .map((sample) => Number(sample[key]))
    .filter((value) => Number.isFinite(value))

  if (values.length === 0) return null
  return Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(2))
}

export default function NaturalWaterForm() {
  const { currentUser, roId, roName } = useAuth()
  const navigate = useNavigate()

  const [industries,  setIndustries]  = useState([])
  const [locations,   setLocations]   = useState([])
  const [saving,      setSaving]      = useState(false)
  const [errors,      setErrors]      = useState({})

  const [form, setForm] = useState({
    roId, roName,
    industryId: '', industryName: '',
    locationId: '',
    sampleCollectedFrom: '', sampleDescription: '',
    dateOfCollection: '', dateReceived: '', dateOfAnalysis: '',
    sampleCollectedBy: '', sampleAnalyzedBy: '',
  })
  const [samples, setSamples] = useState([{ ...emptySample(), sampleNo: 1 }])

  useEffect(() => {
    Promise.all([
      getDocs(query(collection(db, COLLECTIONS.INDUSTRIES), orderBy('name'))),
      getDocs(query(collection(db, COLLECTIONS.MONITORING_LOCATIONS), orderBy('name'))),
    ]).then(([ind, loc]) => {
      setIndustries(ind.docs.map(d => ({ id: d.id, ...d.data() })))
      setLocations(loc.docs.map(d  => ({ id: d.id, ...d.data() })))
    })
  }, [])

  function addSample() {
    if (samples.length >= 4) return
    setSamples(p => [...p, { ...emptySample(), sampleNo: p.length + 1 }])
  }

  function updateSample(idx, key, val) {
    setSamples(p => p.map((s, i) => i === idx ? { ...s, [key]: val } : s))
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
      // Calculate flags for each sample
      const samplesWithFlags = samples.map(s => {
        const flags = {}
        WATER_PARAMS.forEach(p => { flags[p.key] = getFlag(s[p.key], p) })
        return { ...s, flags }
      })

      const isViolation = samplesWithFlags.some(s =>
        Object.values(s.flags).some(f => f === 'H' || f === 'L')
      )
      const violated = []
      WATER_PARAMS.forEach(p => {
        if (samplesWithFlags.some(s => s.flags[p.key] === 'H' || s.flags[p.key] === 'L')) {
          violated.push(p.key)
        }
      })

      const selectedLocation = locations.find((location) => location.id === form.locationId)
      const summary = {
        temperature: computeAverage(samplesWithFlags, 'temperature'),
        pH: computeAverage(samplesWithFlags, 'pH'),
        turbidity: computeAverage(samplesWithFlags, 'turbidity'),
        conductivity: computeAverage(samplesWithFlags, 'conductivity'),
        totalSolids: computeAverage(samplesWithFlags, 'totalSolids'),
        BOD: computeAverage(samplesWithFlags, 'BOD'),
      }

      await addDoc(collection(db, COLLECTIONS.WATER_READINGS), {
        roId, roName,
        industryId:          form.industryId,
        industryName:        form.industryName,
        locationId:          form.locationId,
        locationName:        selectedLocation?.name ?? '',
        waterType:           'natural',
        sampleCollectedFrom: form.sampleCollectedFrom,
        sampleDescription:   form.sampleDescription,
        dateOfCollection:    form.dateOfCollection  ? new Date(form.dateOfCollection)  : null,
        dateReceived:        form.dateReceived       ? new Date(form.dateReceived)       : null,
        dateOfAnalysis:      form.dateOfAnalysis     ? new Date(form.dateOfAnalysis)     : null,
        sampleCollectedBy:   form.sampleCollectedBy,
        sampleAnalyzedBy:    form.sampleAnalyzedBy,
        samples:             samplesWithFlags,
        sampleCount:         samplesWithFlags.length,
        summary,
        pH:                  summary.pH,
        BOD:                 summary.BOD,
        COD:                 null,
        isViolation,
        violatedParameters:  violated,
        isSimulated:         false,
        submittedBy:         currentUser.uid,
        createdAt:           serverTimestamp(),
      })
      navigate('/reports/water')
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
        <button onClick={() => navigate('/reports/water')} className="p-2 rounded-lg text-gray-400 hover:bg-gray-100">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="page-title">Natural Water Analysis Report</h1>
          <p className="text-sm text-gray-400">Submit surface/groundwater sample analysis</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {errors._form && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{errors._form}</div>}

        {/* Metadata */}
        <div className="card">
          <h2 className="font-semibold text-primary-700 text-sm mb-4 pb-2 border-b border-gray-100">Sample Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Regional Office</label>
              <input value={roName ?? ''} readOnly className="input-base bg-gray-50" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Industry / Source <span className="text-red-500">*</span></label>
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
              <label className="block text-xs font-medium text-gray-600 mb-1">Sample Collected From</label>
              <input value={form.sampleCollectedFrom} onChange={e => setField('sampleCollectedFrom', e.target.value)} className="input-base" placeholder="River / Lake / Borewell" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Monitoring Location <span className="text-red-500">*</span></label>
              <select value={form.locationId} onChange={e => setField('locationId', e.target.value)} className={`input-base ${errors.locationId ? 'border-red-400' : ''}`}>
                <option value="">-- Select Location --</option>
                {locations.filter(location => location.type === 'water' || location.type === 'multi').map(location => (
                  <option key={location.id} value={location.id}>{location.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Sample Description</label>
              <input value={form.sampleDescription} onChange={e => setField('sampleDescription', e.target.value)} className="input-base" placeholder="Description" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Date of Collection</label>
              <input type="date" value={form.dateOfCollection} onChange={e => setField('dateOfCollection', e.target.value)} className="input-base" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Date Received</label>
              <input type="date" value={form.dateReceived} onChange={e => setField('dateReceived', e.target.value)} className="input-base" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Date of Analysis</label>
              <input type="date" value={form.dateOfAnalysis} onChange={e => setField('dateOfAnalysis', e.target.value)} className="input-base" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Sample Collected By</label>
              <input value={form.sampleCollectedBy} onChange={e => setField('sampleCollectedBy', e.target.value)} className="input-base" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Sample Analyzed By</label>
              <input value={form.sampleAnalyzedBy} onChange={e => setField('sampleAnalyzedBy', e.target.value)} className="input-base" />
            </div>
          </div>
        </div>

        {/* Sample data table */}
        <div className="card overflow-x-auto">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
            <h2 className="font-semibold text-primary-700 text-sm">Sample Analysis (up to 4 samples)</h2>
            {samples.length < 4 && (
              <button type="button" onClick={addSample} className="btn-secondary flex items-center gap-1 text-xs !py-1.5">
                <PlusCircle size={13} /> Add Sample
              </button>
            )}
          </div>
          <table className="w-full text-xs min-w-[700px]">
            <thead>
              <tr className="bg-primary-700 text-white">
                <th className="px-3 py-2 text-left">Parameter</th>
                <th className="px-3 py-2 text-left">Unit</th>
                <th className="px-3 py-2 text-left">Limit</th>
                {samples.map((_, i) => (
                  <th key={i} className="px-3 py-2 text-left">Sample {i + 1}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {WATER_PARAMS.map(param => (
                <tr key={param.key} className="hover:bg-gray-50">
                  <td className="px-3 py-2 font-medium text-gray-700">{param.label}</td>
                  <td className="px-3 py-2 text-gray-500">{param.unit}</td>
                  <td className="px-3 py-2 text-gray-500">
                    {param.limitMin ? `${param.limitMin}–${param.limitMax}` : `< ${param.limitMax}`}
                  </td>
                  {samples.map((s, i) => {
                    const flag = getFlag(s[param.key], param)
                    return (
                      <td key={i} className="px-2 py-1.5">
                        <div className="flex items-center gap-1">
                          <input
                            type="number" step="0.01" value={s[param.key]}
                            onChange={e => updateSample(i, param.key, e.target.value)}
                            placeholder="—"
                            className={`input-base w-20 text-xs ${flag === 'H' || flag === 'L' ? 'border-red-400 bg-red-50' : ''}`}
                          />
                          {flag && flag !== 'OK' && (
                            <span className="text-[10px] font-bold text-red-500">{flag}</span>
                          )}
                        </div>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
            <Save size={16} /> {saving ? 'Saving...' : 'Save Report'}
          </button>
          <button type="button" onClick={() => navigate('/reports/water')} className="btn-secondary">Cancel</button>
        </div>
      </form>
    </div>
  )
}
