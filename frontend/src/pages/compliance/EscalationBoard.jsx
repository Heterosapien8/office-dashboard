import { useEffect, useState } from 'react'
import { collection, query, onSnapshot, doc, updateDoc, serverTimestamp, orderBy } from 'firebase/firestore'
import { db } from '../../config/firebase'
import { COLLECTIONS, ESCALATION_STAGES } from '../../config/constants'
import { format } from 'date-fns'
import clsx from 'clsx'

export default function EscalationBoard() {
  const [escalations, setEscalations] = useState([])
  const [loading,     setLoading]     = useState(true)

  useEffect(() => {
    const q = query(collection(db, COLLECTIONS.ESCALATIONS), orderBy('createdAt', 'desc'))
    return onSnapshot(q, snap => {
      setEscalations(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })
  }, [])

  async function advanceStage(escalation) {
    const stages = ESCALATION_STAGES.map(s => s.value)
    const curr   = stages.indexOf(escalation.status)
    if (curr >= stages.length - 1) return
    const next = stages[curr + 1]
    await updateDoc(doc(db, COLLECTIONS.ESCALATIONS, escalation.id), {
      status: next, updatedAt: serverTimestamp(),
    })
  }

  const byStage = ESCALATION_STAGES.reduce((acc, s) => {
    acc[s.value] = escalations.filter(e => e.status === s.value)
    return acc
  }, {})

  return (
    <div className="space-y-5">
      <h1 className="page-title">Escalation Workflow Board</h1>
      <p className="text-sm text-gray-400">
        Track violations through the escalation pipeline — PENDING → RO NOTIFIED → INSPECTION SCHEDULED → RESOLVED
      </p>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-4">
          {ESCALATION_STAGES.map(stage => (
            <div key={stage.value} className="bg-gray-100 rounded-xl p-3 min-h-[400px]">
              {/* Column header */}
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  {stage.label}
                </h3>
                <span className={clsx('px-2 py-0.5 rounded-full text-xs font-medium', stage.color)}>
                  {byStage[stage.value]?.length ?? 0}
                </span>
              </div>

              {/* Cards */}
              <div className="space-y-2">
                {(byStage[stage.value] ?? []).map(e => (
                  <div key={e.id} className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
                    <p className="text-sm font-medium text-gray-800 leading-tight">{e.industryName}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{e.roName}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {e.createdAt?.toDate ? format(e.createdAt.toDate(), 'dd/MM/yyyy') : '—'}
                    </p>
                    {/* Advance button — hide on RESOLVED */}
                    {stage.value !== 'RESOLVED' && (
                      <button
                        onClick={() => advanceStage(e)}
                        className="mt-2 w-full text-xs py-1 bg-primary-50 text-primary-600
                                   rounded hover:bg-primary-100 transition-colors"
                      >
                        Advance →
                      </button>
                    )}
                  </div>
                ))}
                {byStage[stage.value]?.length === 0 && (
                  <p className="text-xs text-gray-400 text-center py-6 italic">No items</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
