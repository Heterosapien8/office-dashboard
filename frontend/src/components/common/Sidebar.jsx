import { NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import {
  LayoutDashboard, Building2, Factory, Ruler, AlertTriangle,
  MapPin, Users, UserCog, Wind, Droplets, Volume2, BarChart3,
  Map, TrendingUp, ShieldCheck, Globe, Ticket, ChevronDown,
  ChevronRight, Leaf, LogOut, Settings,
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { ROLES } from '../../config/constants'
import clsx from 'clsx'

// ─────────────────────────────────────────────────────────────
//  Navigation structure — role-filtered in the component
// ─────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  {
    label: 'Dashboard',
    icon: LayoutDashboard,
    path: '/dashboard',
    roles: [ROLES.SUPER_ADMIN, ROLES.REGIONAL_OFFICER, ROLES.MONITORING_TEAM, ROLES.INDUSTRY_USER],
  },
  {
    label: 'Master Records',
    icon: Settings,
    roles: [ROLES.SUPER_ADMIN],
    children: [
      { label: 'Regional Offices', path: '/master/regional-offices',  icon: Building2 },
      { label: 'Industries',       path: '/master/industries',         icon: Factory },
      { label: 'Units',            path: '/master/units',              icon: Ruler },
      { label: 'Prescribed Limits',path: '/master/prescribed-limits',  icon: AlertTriangle },
      { label: 'Locations',        path: '/master/locations',          icon: MapPin },
      { label: 'Monitoring Team',  path: '/master/monitoring-team',    icon: Users },
      { label: 'User Management',  path: '/master/users',              icon: UserCog },
    ],
  },
  {
    label: 'Reports',
    icon: BarChart3,
    roles: [ROLES.SUPER_ADMIN, ROLES.REGIONAL_OFFICER, ROLES.MONITORING_TEAM, ROLES.INDUSTRY_USER],
    children: [
      { label: 'Air Monitoring',    path: '/reports/air',         icon: Wind },
      { label: 'Water Monitoring',  path: '/reports/water',       icon: Droplets },
      { label: 'Noise Monitoring',  path: '/reports/noise',       icon: Volume2 },
      { label: 'Comparison',        path: '/reports/comparison',  icon: BarChart3 },
      { label: 'Yearly Reports',    path: '/reports/yearly',      icon: TrendingUp },
    ],
  },
  {
    label: 'Compliance',
    icon: ShieldCheck,
    roles: [ROLES.SUPER_ADMIN, ROLES.REGIONAL_OFFICER],
    children: [
      { label: 'Non-Compliance Dashboard', path: '/compliance',            icon: ShieldCheck },
      { label: 'Violations',               path: '/compliance/violations', icon: AlertTriangle },
      { label: 'Escalations',              path: '/compliance/escalations',icon: TrendingUp },
      { label: 'Report Lock Status',       path: '/compliance/locks',      icon: Settings },
    ],
  },
  {
    label: 'Pollution Map',
    icon: Map,
    path: '/map',
    roles: [ROLES.SUPER_ADMIN, ROLES.REGIONAL_OFFICER],
  },
  {
    label: 'Forecast',
    icon: TrendingUp,
    path: '/forecast',
    roles: [ROLES.SUPER_ADMIN, ROLES.REGIONAL_OFFICER],
  },
  {
    label: 'Citizen Portal',
    icon: Globe,
    path: '/public',
    roles: [ROLES.SUPER_ADMIN, ROLES.REGIONAL_OFFICER],
    external: true,
  },
  {
    label: 'Support Tickets',
    icon: Ticket,
    path: '/settings/support',
    roles: [ROLES.SUPER_ADMIN, ROLES.REGIONAL_OFFICER, ROLES.MONITORING_TEAM, ROLES.INDUSTRY_USER],
  },
]

// ─────────────────────────────────────────────────────────────
//  Sidebar Component
// ─────────────────────────────────────────────────────────────
export default function Sidebar({ collapsed, onToggle }) {
  const { role, userProfile, logout } = useAuth()
  const navigate = useNavigate()
  const [openGroups, setOpenGroups] = useState(['Master Records', 'Reports'])

  // Filter nav items by role
  const visibleItems = NAV_ITEMS.filter(item =>
    !item.roles || item.roles.includes(role)
  )

  function toggleGroup(label) {
    setOpenGroups(prev =>
      prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]
    )
  }

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  return (
    <aside className={clsx(
      'flex flex-col h-full bg-primary-700 text-white transition-all duration-300',
      collapsed ? 'w-16' : 'w-64'
    )}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-primary-600">
        <div className="flex-shrink-0 w-8 h-8 bg-eco-400 rounded-lg flex items-center justify-center">
          <Leaf size={18} className="text-white" />
        </div>
        {!collapsed && (
          <div>
            <p className="font-bold text-sm leading-tight">PrithviNet</p>
            <p className="text-primary-300 text-xs leading-tight">CG Environment Dept.</p>
          </div>
        )}
      </div>

      {/* Role badge */}
      {!collapsed && (
        <div className="px-4 py-3 border-b border-primary-600">
          <p className="text-xs text-primary-300 uppercase tracking-wider mb-1">Logged in as</p>
          <p className="text-sm font-medium truncate">{userProfile?.name ?? 'User'}</p>
          <span className="inline-block mt-1 px-2 py-0.5 bg-primary-600 rounded text-xs text-primary-200">
            {getRoleLabel(role)}
          </span>
          {userProfile?.roName && (
            <p className="text-xs text-primary-300 mt-0.5 truncate">{userProfile.roName}</p>
          )}
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 space-y-0.5 px-2">
        {visibleItems.map(item => {
          if (item.children) {
            const isOpen = openGroups.includes(item.label)
            const Icon = item.icon
            return (
              <div key={item.label}>
                <button
                  onClick={() => toggleGroup(item.label)}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg
                             text-primary-200 hover:bg-primary-600 hover:text-white
                             transition-colors text-sm font-medium"
                >
                  <Icon size={18} className="flex-shrink-0" />
                  {!collapsed && (
                    <>
                      <span className="flex-1 text-left">{item.label}</span>
                      {isOpen
                        ? <ChevronDown size={14} />
                        : <ChevronRight size={14} />
                      }
                    </>
                  )}
                </button>
                {isOpen && !collapsed && (
                  <div className="mt-0.5 ml-4 space-y-0.5">
                    {item.children.map(child => {
                      const ChildIcon = child.icon
                      return (
                        <NavLink
                          key={child.path}
                          to={child.path}
                          className={({ isActive }) => clsx(
                            'flex items-center gap-3 px-3 py-1.5 rounded-lg text-xs transition-colors',
                            isActive
                              ? 'bg-primary-500 text-white font-medium'
                              : 'text-primary-300 hover:bg-primary-600 hover:text-white'
                          )}
                        >
                          <ChildIcon size={14} className="flex-shrink-0" />
                          <span>{child.label}</span>
                        </NavLink>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          }

          const Icon = item.icon
          return (
            <NavLink
              key={item.path}
              to={item.path}
              target={item.external ? '_blank' : undefined}
              className={({ isActive }) => clsx(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                isActive
                  ? 'bg-eco-500 text-white font-medium'
                  : 'text-primary-200 hover:bg-primary-600 hover:text-white'
              )}
            >
              <Icon size={18} className="flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="px-2 py-3 border-t border-primary-600">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg
                     text-primary-300 hover:bg-primary-600 hover:text-white
                     transition-colors text-sm"
        >
          <LogOut size={18} className="flex-shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  )
}

function getRoleLabel(role) {
  const labels = {
    superAdmin:      'Super Admin',
    regionalOfficer: 'Regional Officer',
    monitoringTeam:  'Monitoring Team',
    industryUser:    'Industry User',
  }
  return labels[role] ?? role
}
