import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from '../components/common/Sidebar'
import Topbar  from '../components/common/Topbar'
import { NotificationProvider } from '../contexts/NotificationContext'

// ─────────────────────────────────────────────────────────────
//  AppLayout — authenticated pages with sidebar + topbar
// ─────────────────────────────────────────────────────────────
export function AppLayout() {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <NotificationProvider>
      <div className="flex h-screen overflow-hidden bg-gray-50">
        {/* Sidebar */}
        <Sidebar
          collapsed={collapsed}
          onToggle={() => setCollapsed(p => !p)}
        />

        {/* Main content area */}
        <div className="flex flex-col flex-1 overflow-hidden">
          <Topbar onMenuToggle={() => setCollapsed(p => !p)} />

          {/* Page content */}
          <main className="flex-1 overflow-y-auto p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </NotificationProvider>
  )
}

// ─────────────────────────────────────────────────────────────
//  AuthLayout — centered card for login page
// ─────────────────────────────────────────────────────────────
export function AuthLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-800 via-primary-700 to-eco-700
                    flex items-center justify-center p-4">
      <Outlet />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
//  PublicLayout — citizen portal, no sidebar, minimal header
// ─────────────────────────────────────────────────────────────
export function PublicLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Minimal public header */}
      <header className="bg-primary-700 text-white py-3 px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 bg-eco-400 rounded-lg flex items-center justify-center text-white font-bold text-xs">
            P
          </div>
          <div>
            <p className="font-semibold text-sm">PrithviNet</p>
            <p className="text-primary-300 text-xs">Environment Department, Chhattisgarh</p>
          </div>
        </div>
        <span className="text-xs bg-eco-600 text-white px-2 py-1 rounded-full">
          Public Portal
        </span>
      </header>

      <main>
        <Outlet />
      </main>

      <footer className="text-center py-4 text-xs text-gray-400 border-t border-gray-200 mt-8">
        © {new Date().getFullYear()} Environment Department, Chhattisgarh Government &nbsp;|&nbsp; PrithviNet v1.0
      </footer>
    </div>
  )
}
