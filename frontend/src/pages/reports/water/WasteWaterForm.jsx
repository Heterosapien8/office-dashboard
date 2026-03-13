import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, addDoc, getDocs, serverTimestamp, query, orderBy } from 'firebase/firestore'
import { db } from '../../../config/firebase'
import { useAuth } from '../../../contexts/AuthContext'
import { COLLECTIONS } from '../../../config/constants'
import { ArrowLeft, PlusCircle, Save } from 'lucide-react'

const WASTE_PARAMS = [
  { key: 'temperature', label: 'Temperature', unit: 'deg C', limitMin: null, limitMax: 40 },
  { key: 'pH', label: 'pH', unit: '', limitMin: 6.5, limitMax: 8.5 },
  { key: 'BOD', label: 'BOD', unit: 'mg/L', limitMin: null, limitMax: 30 },
  { key: 'COD', label: 'COD', unit: 'mg/L', limitMin: null, limitMax: 250 },
  { key: 'totalDissolvedSolids', label: 'Dissolved Solids', unit: 'mg/L', limitMin: null, limitMax: 2100 },
  { key: 'totalSuspendedSolids', label: 'Suspended Solids', unit: 'mg/L', limitMin: null, limitMax: 100 },
  { key: 'oilAndGrease', label: 'Oil & Grease', unit: 'mg/L', limitMin: null, limitMax: 10 },
]

const emptySample = () =>
  Object.fromEntries([['sampleNo', ''], ...WASTE_PARAMS.map((param) => [param.key, ''])])

function getFlag(value, param) {
  const numericValue = parseFloat(value)
  if (Number.isNaN(numericValue)) return null
  if (param.limitMax !== null && numericValue > param.limitMax) return 'H'
  if (param.limitMin !== null && numericValue < param.limitMin) return 'L'
  return 'OK'
}

function computeAverage(samples, key) {
  const values = samples
    .map((sample) => Number(sample[key]))
    .filter((value) => Number.isFinite(value))

  if (values.length === 0) return null
  return Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(2))
}

export default function WasteWaterForm() {
  const { currentUser, roId, roName } = useAuth()
  const navigate = useNavigate()

  const [industries, setIndustries] = useState([])
  const [locations, setLocations] = useState([])
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})

  const [form, setForm] = useState({
    roId,
    roName,
    industryId: '',
    industryName: '',
    locationId: '',
    dischargeSource: '',
    sampleDescription: '',
    dateOfCollection: '',
    dateReceived: '',
    dateOfAnalysis: '',
    sampleCollectedBy: '',
    analyzedBy: '',
    chemistName: '',
    scientistName: '',
    regionalOfficerName: '',
  })
  const [samples, setSamples] = useState([{ ...emptySample(), sampleNo: 1 }])

  useEffect(() => {
    Promise.all([
      getDocs(query(collection(db, COLLECTIONS.INDUSTRIES), orderBy('name'))),
      getDocs(query(collection(db, COLLECTIONS.MONITORING_LOCATIONS), orderBy('name'))),
    ]).then(([industrySnap, locationSnap]) => {
      setIndustries(industrySnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
      setLocations(locationSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
    })
  }, [])

  function setField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => ({ ...prev, [key]: null }))
  }

  function addSample() {
    if (samples.length >= 4) return
    setSamples((prev) => [...prev, { ...emptySample(), sampleNo: prev.length + 1 }])
  }

  function updateSample(index, key, value) {
    setSamples((prev) => prev.map((sample, i) => (i === index ? { ...sample, [key]: value } : sample)))
  }

  async function handleSubmit(event) {
    event.preventDefault()

    const nextErrors = {}
    if (!form.industryId) nextErrors.industryId = 'Required'
    if (!form.locationId) nextErrors.locationId = 'Required'
    if (!form.dateOfCollection) nextErrors.dateOfCollection = 'Required'

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    setSaving(true)
    try {
      const samplesWithFlags = samples.map((sample) => {
        const flags = {}
        WASTE_PARAMS.forEach((param) => {
          flags[param.key] = getFlag(sample[param.key], param)
        })
        return { ...sample, flags }
      })

      const violatedParameters = WASTE_PARAMS
        .filter((param) =>
          samplesWithFlags.some((sample) => sample.flags[param.key] === 'H' || sample.flags[param.key] === 'L')
        )
        .map((param) => param.key)

      const selectedLocation = locations.find((location) => location.id === form.locationId)
      const summary = {
        temperature: computeAverage(samplesWithFlags, 'temperature'),
        pH: computeAverage(samplesWithFlags, 'pH'),
        BOD: computeAverage(samplesWithFlags, 'BOD'),
        COD: computeAverage(samplesWithFlags, 'COD'),
        totalDissolvedSolids: computeAverage(samplesWithFlags, 'totalDissolvedSolids'),
        totalSuspendedSolids: computeAverage(samplesWithFlags, 'totalSuspendedSolids'),
        oilAndGrease: computeAverage(samplesWithFlags, 'oilAndGrease'),
      }

      await addDoc(collection(db, COLLECTIONS.WATER_READINGS), {
        roId,
        roName,
        industryId: form.industryId,
        industryName: form.industryName,
        locationId: form.locationId,
        locationName: selectedLocation?.name ?? '',
        waterType: 'waste',
        dischargeSource: form.dischargeSource,
        sampleDescription: form.sampleDescription,
        dateOfCollection: form.dateOfCollection ? new Date(form.dateOfCollection) : null,
        dateReceived: form.dateReceived ? new Date(form.dateReceived) : null,
        dateOfAnalysis: form.dateOfAnalysis ? new Date(form.dateOfAnalysis) : null,
        sampleCollectedBy: form.sampleCollectedBy,
        analyzedBy: form.analyzedBy,
        signatories: {
          chemistName: form.chemistName,
          scientistName: form.scientistName,
          regionalOfficerName: form.regionalOfficerName,
        },
        samples: samplesWithFlags,
        sampleCount: samplesWithFlags.length,
        summary,
        pH: summary.pH,
        BOD: summary.BOD,
        COD: summary.COD,
        isViolation: violatedParameters.length > 0,
        violatedParameters,
        isSimulated: false,
        submittedBy: currentUser.uid,
        createdAt: serverTimestamp(),
      })

      navigate('/reports/water')
    } catch (error) {
      console.error(error)
      setErrors({ _form: 'Failed to save waste water report.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/reports/water')} className="p-2 rounded-lg text-gray-400 hover:bg-gray-100">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="page-title">Industrial Waste Water Report</h1>
          <p className="text-sm text-gray-400">Submit industrial effluent analysis with mandatory sign-off details</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {errors._form && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{errors._form}</div>
        )}

        <div className="card">
          <h2 className="font-semibold text-primary-700 text-sm mb-4 pb-2 border-b border-gray-100">Sample Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Regional Office</label>
              <input value={roName ?? ''} readOnly className="input-base bg-gray-50" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Industry / Source <span className="text-red-500">*</span></label>
              <select
                value={form.industryId}
                onChange={(e) => {
                  const industry = industries.find((item) => item.id === e.target.value)
                  setField('industryId', e.target.value)
                  setField('industryName', industry?.name ?? '')
                }}
                className={`input-base ${errors.industryId ? 'border-red-400' : ''}`}
              >
                <option value="">-- Select --</option>
                {industries.map((industry) => (
                  <option key={industry.id} value={industry.id}>{industry.name}</option>
                ))}
              </select>
              {errors.industryId && <p className="text-xs text-red-500 mt-1">{errors.industryId}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Location</label>
              <select value={form.locationId} onChange={(e) => setField('locationId', e.target.value)} className="input-base">
                <option value="">-- Select Location --</option>
                {locations.filter((location) => location.type === 'water' || location.type === 'multi').map((location) => (
                  <option key={location.id} value={location.id}>{location.name}</option>
                ))}
              </select>
              {errors.locationId && <p className="text-xs text-red-500 mt-1">{errors.locationId}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Discharge Source</label>
              <input value={form.dischargeSource} onChange={(e) => setField('dischargeSource', e.target.value)} className="input-base" placeholder="Outlet / ETP / Final discharge point" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Sample Description</label>
              <input value={form.sampleDescription} onChange={(e) => setField('sampleDescription', e.target.value)} className="input-base" placeholder="Composite / Grab / Outlet description" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Date of Collection <span className="text-red-500">*</span></label>
              <input type="date" value={form.dateOfCollection} onChange={(e) => setField('dateOfCollection', e.target.value)} className={`input-base ${errors.dateOfCollection ? 'border-red-400' : ''}`} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Date Received</label>
              <input type="date" value={form.dateReceived} onChange={(e) => setField('dateReceived', e.target.value)} className="input-base" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Date of Analysis</label>
              <input type="date" value={form.dateOfAnalysis} onChange={(e) => setField('dateOfAnalysis', e.target.value)} className="input-base" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Sample Collected By</label>
              <input value={form.sampleCollectedBy} onChange={(e) => setField('sampleCollectedBy', e.target.value)} className="input-base" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Analyzed By</label>
              <input value={form.analyzedBy} onChange={(e) => setField('analyzedBy', e.target.value)} className="input-base" />
            </div>
          </div>
        </div>

        <div className="card overflow-x-auto">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
            <h2 className="font-semibold text-primary-700 text-sm">Effluent Analysis (up to 4 samples)</h2>
            {samples.length < 4 && (
              <button type="button" onClick={addSample} className="btn-secondary flex items-center gap-1 text-xs !py-1.5">
                <PlusCircle size={13} /> Add Sample
              </button>
            )}
          </div>
          <table className="w-full text-xs min-w-[720px]">
            <thead>
              <tr className="bg-primary-700 text-white">
                <th className="px-3 py-2 text-left">Parameter</th>
                <th className="px-3 py-2 text-left">Unit</th>
                <th className="px-3 py-2 text-left">Limit</th>
                {samples.map((_, index) => (
                  <th key={index} className="px-3 py-2 text-left">Sample {index + 1}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {WASTE_PARAMS.map((param) => (
                <tr key={param.key} className="hover:bg-gray-50">
                  <td className="px-3 py-2 font-medium text-gray-700">{param.label}</td>
                  <td className="px-3 py-2 text-gray-500">{param.unit}</td>
                  <td className="px-3 py-2 text-gray-500">
                    {param.limitMin !== null ? `${param.limitMin}-${param.limitMax}` : `< ${param.limitMax}`}
                  </td>
                  {samples.map((sample, index) => {
                    const flag = getFlag(sample[param.key], param)
                    return (
                      <td key={index} className="px-2 py-1.5">
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            step="0.01"
                            value={sample[param.key]}
                            onChange={(e) => updateSample(index, param.key, e.target.value)}
                            placeholder="-"
                            className={`input-base w-24 text-xs ${flag === 'H' || flag === 'L' ? 'border-red-400 bg-red-50' : ''}`}
                          />
                          {flag && flag !== 'OK' && <span className="text-[10px] font-bold text-red-500">{flag}</span>}
                        </div>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <h2 className="font-semibold text-primary-700 text-sm mb-4 pb-2 border-b border-gray-100">Sign-off Details</h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Chemist</label>
              <input value={form.chemistName} onChange={(e) => setField('chemistName', e.target.value)} className="input-base" placeholder="Chemist name" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Scientist</label>
              <input value={form.scientistName} onChange={(e) => setField('scientistName', e.target.value)} className="input-base" placeholder="Scientist name" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Regional Officer</label>
              <input value={form.regionalOfficerName} onChange={(e) => setField('regionalOfficerName', e.target.value)} className="input-base" placeholder="Regional Officer name" />
            </div>
          </div>
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
