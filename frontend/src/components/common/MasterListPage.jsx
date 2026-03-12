import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  collection, query, orderBy, onSnapshot,
  doc, updateDoc, deleteDoc,
} from 'firebase/firestore'
import { db } from '../../config/firebase'
import { Search, PlusCircle, Edit2, Trash2, Eye, SortAsc } from 'lucide-react'
import clsx from 'clsx'

// ─────────────────────────────────────────────────────────────
//  MasterListPage
//  config: { title, addTitle, collection, columns, basePath }
//  columns: [{ key, label, render? }]
// ─────────────────────────────────────────────────────────────
export default function MasterListPage({ config }) {
  const {
    title, collection: collectionName,
    columns, basePath,
  } = config

  const navigate = useNavigate()
  const [docs,        setDocs]        = useState([])
  const [loading,     setLoading]     = useState(true)
  const [search,      setSearch]      = useState('')
  const [sortKey,     setSortKey]     = useState(null)
  const [sortDir,     setSortDir]     = useState('asc')
  const [deleteId,    setDeleteId]    = useState(null)
  const [deleting,    setDeleting]    = useState(false)

  // Real-time Firestore listener
  useEffect(() => {
    const colRef = collection(db, collectionName)
    const q      = query(colRef, orderBy('createdAt', 'desc'))

    const unsub = onSnapshot(q, (snap) => {
      setDocs(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    }, (err) => {
      console.error(`Error fetching ${collectionName}:`, err)
      setLoading(false)
    })

    return unsub
  }, [collectionName])

  // Filter by search
  const filtered = docs.filter(row =>
    columns.some(col => {
      const val = String(row[col.key] ?? '').toLowerCase()
      return val.includes(search.toLowerCase())
    })
  )

  // Sort
  const sorted = sortKey
    ? [...filtered].sort((a, b) => {
        const av = String(a[sortKey] ?? '').toLowerCase()
        const bv = String(b[sortKey] ?? '').toLowerCase()
        return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
      })
    : filtered

  function handleSort(key) {
    if (sortKey === key) {
      setSortDir(p => p === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  async function handleDelete(id) {
    setDeleting(true)
    try {
      await deleteDoc(doc(db, collectionName, id))
      setDeleteId(null)
    } catch (err) {
      console.error('Delete error:', err)
    } finally {
      setDeleting(false)
    }
  }

  async function handleToggleActive(row) {
    const ref = doc(db, collectionName, row.id)
    await updateDoc(ref, { isActive: !row.isActive })
  }

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <h1 className="page-title">{title}</h1>
        <button
          onClick={() => navigate(`${basePath}/new`)}
          className="btn-primary flex items-center gap-2"
        >
          <PlusCircle size={16} />
          Add New
        </button>
      </div>

      {/* Search + sort bar */}
      <div className="card !p-4 flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search data..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-base pl-9"
          />
        </div>
        <button className="btn-secondary flex items-center gap-2">
          <Search size={14} />
          Search now
        </button>
        <button className="btn-secondary flex items-center gap-2 ml-auto">
          <SortAsc size={14} />
          Sort by
        </button>
      </div>

      {/* Table */}
      <div className="card !p-0 overflow-hidden">
        {loading ? (
          <div className="py-16 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : sorted.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <p className="text-sm">No records found.</p>
            <button
              onClick={() => navigate(`${basePath}/new`)}
              className="mt-3 text-primary-600 text-sm hover:underline"
            >
              Add the first record
            </button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-primary-700 text-white">
                <th className="px-4 py-3 text-left font-medium text-xs w-12">S.No.</th>
                {columns.map(col => (
                  <th
                    key={col.key}
                    className="px-4 py-3 text-left font-medium text-xs cursor-pointer
                               hover:bg-primary-600 transition-colors select-none"
                    onClick={() => handleSort(col.key)}
                  >
                    <span className="flex items-center gap-1">
                      {col.label}
                      {sortKey === col.key && (
                        <SortAsc
                          size={12}
                          className={sortDir === 'desc' ? 'rotate-180' : ''}
                        />
                      )}
                    </span>
                  </th>
                ))}
                <th className="px-4 py-3 text-left font-medium text-xs">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sorted.map((row, idx) => (
                <tr
                  key={row.id}
                  className={clsx(
                    'transition-colors hover:bg-primary-50',
                    idx % 2 === 1 ? 'bg-gray-50' : 'bg-white'
                  )}
                >
                  <td className="px-4 py-3 text-gray-500 text-xs">{String(idx + 1).padStart(2, '0')}</td>
                  {columns.map(col => (
                    <td key={col.key} className="px-4 py-3 text-gray-700">
                      {col.render ? col.render(row[col.key], row) : (row[col.key] ?? '—')}
                    </td>
                  ))}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {/* View */}
                      <button
                        onClick={() => navigate(`${basePath}/${row.id}`)}
                        title="View"
                        className="p-1.5 rounded-lg text-gray-400 hover:bg-primary-100
                                   hover:text-primary-600 transition-colors"
                      >
                        <Eye size={15} />
                      </button>
                      {/* Edit */}
                      <button
                        onClick={() => navigate(`${basePath}/${row.id}/edit`)}
                        title="Edit"
                        className="p-1.5 rounded-lg text-gray-400 hover:bg-blue-100
                                   hover:text-blue-600 transition-colors"
                      >
                        <Edit2 size={15} />
                      </button>
                      {/* Delete */}
                      <button
                        onClick={() => setDeleteId(row.id)}
                        title="Delete"
                        className="p-1.5 rounded-lg text-gray-400 hover:bg-red-100
                                   hover:text-red-600 transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Total count */}
      {!loading && sorted.length > 0 && (
        <p className="text-xs text-gray-400 text-right">
          Showing {sorted.length} of {docs.length} records
        </p>
      )}

      {/* Delete confirmation modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 shadow-2xl max-w-sm w-full mx-4">
            <h3 className="font-semibold text-gray-800 mb-2">Confirm Delete</h3>
            <p className="text-sm text-gray-500 mb-5">
              Are you sure you want to delete this record? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteId(null)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteId)}
                disabled={deleting}
                className="btn-danger"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
