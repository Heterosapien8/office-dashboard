import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { ROLES } from '../../config/constants'

// ─────────────────────────────────────────────────────────────
//  ProtectedRoute
//  allowedRoles: array of ROLES values that can access this route
//  If empty/undefined, any authenticated user can access it.
// ─────────────────────────────────────────────────────────────
export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const { currentUser, role, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Loading PrithviNet...</p>
        </div>
      </div>
    )
  }

  // Not logged in → redirect to login
  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Role check — if allowedRoles specified, enforce it
  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    return <Navigate to="/403" replace />
  }

  return children
}
