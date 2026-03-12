import { Bell, Menu, ChevronRight } from 'lucide-react'
import { useLocation, Link } from 'react-router-dom'
import { useNotifications } from '../../contexts/NotificationContext'
import { useState } from 'react'
import NotificationPanel from './NotificationPanel'
import clsx from 'clsx'

// ─────────────────────────────────────────────────────────────
//  Breadcrumb map — path segment → display label
// ─────────────────────────────────────────────────────────────
const BREADCRUMB_LABELS = {
  dashboard:          'Dashboard',
  master:             'Master Records',
  'regional-offices': 'Regional Offices',
  industries:         'Industries',
  units:              'Units',
  'prescribed-limits':'Prescribed Limits',
  locations:          'Locations',
  'monitoring-team':  'Monitoring Team',
  users:              'User Management',
  reports:            'Reports',
  air:                'Air Monitoring',
  water:              'Water Monitoring',
  noise:              'Noise Monitoring',
  comparison:         'Comparison',
  yearly:             'Yearly Reports',
  compliance:         'Compliance',
  violations:         'Violations',
  escalations:        'Escalations',
  locks:              'Report Locks',
  map:                'Pollution Map',
  forecast:           'Forecast',
  settings:           'Settings',
  support:            'Support Tickets',
  profile:            'Profile',
  new:                'Add New',
  edit:               'Edit',
}

export default function Topbar({ onMenuToggle }) {
  const { unreadCount } = useNotifications()
  const location = useLocation()
  const [notifOpen, setNotifOpen] = useState(false)

  // Build breadcrumbs from current path
  const segments = location.pathname.split('/').filter(Boolean)
  const breadcrumbs = segments.map((seg, i) => ({
    label: BREADCRUMB_LABELS[seg] ?? seg,
    path:  '/' + segments.slice(0, i + 1).join('/'),
    isLast: i === segments.length - 1,
  }))

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center px-4 gap-4 relative z-20">
      {/* Hamburger */}
      <button
        onClick={onMenuToggle}
        className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
      >
        <Menu size={20} />
      </button>

      {/* Dept label */}
      <div className="hidden sm:block">
        <span className="text-xs font-semibold text-primary-700 uppercase tracking-wider">
          Environment Department, CG Govt.
        </span>
      </div>

      {/* Breadcrumbs */}
      <div className="flex items-center gap-1 flex-1 min-w-0">
        <span className="text-gray-400 text-xs hidden md:block">Dashboard</span>
        {breadcrumbs.map((crumb, i) => (
          <span key={crumb.path} className="flex items-center gap-1 min-w-0">
            <ChevronRight size={12} className="text-gray-300 flex-shrink-0 hidden md:block" />
            {crumb.isLast ? (
              <span className="text-xs font-medium text-primary-700 truncate hidden md:block">
                {crumb.label}
              </span>
            ) : (
              <Link
                to={crumb.path}
                className="text-xs text-gray-400 hover:text-primary-600 truncate hidden md:block"
              >
                {crumb.label}
              </Link>
            )}
          </span>
        ))}
      </div>

      {/* Notification Bell */}
      <div className="relative">
        <button
          onClick={() => setNotifOpen(prev => !prev)}
          className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white
                             text-[10px] font-bold rounded-full flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {notifOpen && (
          <NotificationPanel onClose={() => setNotifOpen(false)} />
        )}
      </div>
    </header>
  )
}
