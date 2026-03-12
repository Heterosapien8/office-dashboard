import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  doc, getDoc, addDoc, updateDoc,
  collection, serverTimestamp,
} from 'firebase/firestore'
import { db } from '../../config/firebase'
import { useAuth } from '../../contexts/AuthContext'
import { ArrowLeft, Save } from 'lucide-react'

// ─────────────────────────────────────────────────────────────
//  MasterFormPage
//  config.formFields: [{
//    key, label, type, required?, options?, placeholder?,
//    colSpan? (1 or 2), readOnly?
//  }]
//  type: 'text' | 'email' | 'tel' | 'textarea' | 'select' |
//         'multiselect' | 'number' | 'checkbox'
// ─────────────────────────────────────────────────────────────
export default function MasterFormPage({ config }) {
  const {
    title, addTitle = 'Add New', editTitle = 'Edit',
    collection: collectionName, basePath,
    formFields,
  } = config

  const { id }     = useParams()      // undefined = new, else = edit
  const isEdit     = Boolean(id && id !== 'new')
  const navigate   = useNavigate()
  const { currentUser } = useAuth()

  const [formData, setFormData] = useState(() =>
    Object.fromEntries(formFields.map(f => [f.key, f.defaultValue ?? '']))
  )
  const [loading,  setLoading]  = useState(isEdit)
  const [saving,   setSaving]   = useState(false)
  const [errors,   setErrors]   = useState({})
  const [success,  setSuccess]  = useState(false)

  // Load existing doc for edit mode
  useEffect(() => {
    if (!isEdit) return
    const ref = doc(db, collectionName, id)
    getDoc(ref).then(snap => {
      if (snap.exists()) {
        const data = snap.data()
        // Only set fields that exist in our config
        const mapped = {}
        formFields.forEach(f => {
          mapped[f.key] = data[f.key] ?? f.defaultValue ?? ''
        })
        setFormData(mapped)
      }
      setLoading(false)
    })
  }, [isEdit, id, collectionName])

  function handleChange(key, value) {
    setFormData(p => ({ ...p, [key]: value }))
    setErrors(p => ({ ...p, [key]: null }))
  }

  function validate() {
    const errs = {}
    formFields.forEach(f => {
      if (f.required && !formData[f.key]) {
        errs[f.key] = `${f.label} is required.`
      }
      if (f.type === 'email' && formData[f.key]) {
        const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRe.test(formData[f.key])) {
          errs[f.key] = 'Enter a valid email address.'
        }
      }
    })
    return errs
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }

    setSaving(true)
    try {
      const payload = {
        ...formData,
        updatedAt: serverTimestamp(),
      }

      if (isEdit) {
        await updateDoc(doc(db, collectionName, id), payload)
      } else {
        await addDoc(collection(db, collectionName), {
          ...payload,
          isActive:  true,
          createdAt: serverTimestamp(),
          createdBy: currentUser.uid,
        })
      }

      setSuccess(true)
      setTimeout(() => navigate(basePath), 1200)
    } catch (err) {
      console.error('Save error:', err)
      setErrors({ _form: 'Failed to save. Please try again.' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-5 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(basePath)}
          className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="page-title">{title}</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {isEdit ? editTitle : addTitle}
          </p>
        </div>

        {/* View list link */}
        <button
          onClick={() => navigate(basePath)}
          className="ml-auto text-sm text-primary-600 hover:underline flex items-center gap-1"
        >
          View {title}
        </button>
      </div>

      {/* Form card */}
      <form onSubmit={handleSubmit}>
        <div className="card">
          {/* Error banner */}
          {errors._form && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {errors._form}
            </div>
          )}

          {/* Success banner */}
          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
              Saved successfully! Redirecting...
            </div>
          )}

          {/* Two-column grid */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            {formFields.map(field => (
              <div
                key={field.key}
                className={field.colSpan === 2 ? 'col-span-2' : 'col-span-1'}
              >
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </label>

                {field.type === 'textarea' ? (
                  <textarea
                    value={formData[field.key]}
                    onChange={e => handleChange(field.key, e.target.value)}
                    placeholder={field.placeholder ?? field.label}
                    rows={3}
                    readOnly={field.readOnly}
                    className={`input-base resize-none ${errors[field.key] ? 'border-red-400' : ''}`}
                  />
                ) : field.type === 'select' ? (
                  <select
                    value={formData[field.key]}
                    onChange={e => handleChange(field.key, e.target.value)}
                    disabled={field.readOnly}
                    className={`input-base ${errors[field.key] ? 'border-red-400' : ''}`}
                  >
                    <option value="">-- Select --</option>
                    {(field.options ?? []).map(opt => {
                      const val   = typeof opt === 'object' ? opt.value : opt
                      const label = typeof opt === 'object' ? opt.label : opt
                      return <option key={val} value={val}>{label}</option>
                    })}
                  </select>
                ) : field.type === 'checkbox' ? (
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="checkbox"
                      id={field.key}
                      checked={Boolean(formData[field.key])}
                      onChange={e => handleChange(field.key, e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-primary-600"
                    />
                    <label htmlFor={field.key} className="text-sm text-gray-600">
                      {field.checkboxLabel ?? field.label}
                    </label>
                  </div>
                ) : (
                  <input
                    type={field.type ?? 'text'}
                    value={formData[field.key]}
                    onChange={e => handleChange(field.key, e.target.value)}
                    placeholder={field.placeholder ?? field.label}
                    readOnly={field.readOnly}
                    className={`input-base ${errors[field.key] ? 'border-red-400' : ''} ${field.readOnly ? 'bg-gray-50' : ''}`}
                  />
                )}

                {errors[field.key] && (
                  <p className="mt-1 text-xs text-red-500">{errors[field.key]}</p>
                )}
              </div>
            ))}
          </div>

          {/* Save button */}
          <div className="mt-6 flex gap-3">
            <button
              type="submit"
              disabled={saving || success}
              className="btn-primary flex items-center gap-2"
            >
              <Save size={16} />
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button
              type="button"
              onClick={() => navigate(basePath)}
              className="btn-secondary"
            >
              Cancel
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
