import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { AppLayout, AuthLayout, PublicLayout } from './layouts/index'
import ProtectedRoute from './components/common/ProtectedRoute'
import { ROLES } from './config/constants'

// ── Auth ────────────────────────────────────────────────────────
import LoginPage from './pages/auth/LoginPage'

// ── Dashboard ───────────────────────────────────────────────────
import Dashboard from './pages/dashboard/Dashboard'

// ── Master Records ──────────────────────────────────────────────
import { RegionalOfficesList, RegionalOfficesForm } from './pages/master/RegionalOffices'
import { IndustriesList,      IndustriesForm      } from './pages/master/Industries'
import {
  UnitsList,            UnitsForm,
  PrescribedLimitsList, PrescribedLimitsForm,
  LocationsList,        LocationsForm,
  MonitoringTeamList,   MonitoringTeamForm,
  UserManagementList,   UserManagementForm,
} from './pages/master/MasterPages'

// ── Reports ─────────────────────────────────────────────────────
import AirMonitoringList from './pages/reports/air/AirMonitoringList'
import AirMonitoringForm from './pages/reports/air/AirMonitoringForm'
import AQIReportView     from './pages/reports/air/AQIReportView'
import WaterReportList   from './pages/reports/water/WaterReportList'
import NaturalWaterForm  from './pages/reports/water/NaturalWaterForm'
import WasteWaterForm    from './pages/reports/water/WasteWaterForm'
import NoiseReportList   from './pages/reports/noise/NoiseReportList'
import NoiseMonitoringForm from './pages/reports/noise/NoiseMonitoringForm'

// ── Compliance ──────────────────────────────────────────────────
import ComplianceDashboard from './pages/compliance/ComplianceDashboard'
import ViolationList       from './pages/compliance/ViolationList'
import EscalationBoard     from './pages/compliance/EscalationBoard'

// ── Map, Forecast, Settings ─────────────────────────────────────
import HeatmapPage    from './pages/map/HeatmapPage'
import ForecastPage   from './pages/forecast/ForecastPage'
import CitizenPortal  from './pages/public/CitizenPortal'

// ── Stub & Error pages ──────────────────────────────────────────
import StubPage from './components/common/StubPage'
import Page403  from './pages/auth/Page403'

const ADMIN_RO = [ROLES.SUPER_ADMIN, ROLES.REGIONAL_OFFICER]
const ALL_AUTH  = [ROLES.SUPER_ADMIN, ROLES.REGIONAL_OFFICER, ROLES.MONITORING_TEAM, ROLES.INDUSTRY_USER]
const ADMIN_ONLY = [ROLES.SUPER_ADMIN]

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>

          {/* ── Public / Auth routes ────────────────────────────── */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
          </Route>

          {/* ── Public Citizen Portal (no auth) ────────────────── */}
          <Route element={<PublicLayout />}>
            <Route path="/public" element={<CitizenPortal />} />
          </Route>

          {/* ── Error pages ─────────────────────────────────────── */}
          <Route path="/403" element={<Page403 />} />

          {/* ── Authenticated App ────────────────────────────────── */}
          <Route element={
            <ProtectedRoute allowedRoles={ALL_AUTH}>
              <AppLayout />
            </ProtectedRoute>
          }>
            {/* Root redirect */}
            <Route index element={<Navigate to="/dashboard" replace />} />

            {/* Dashboard */}
            <Route path="/dashboard" element={<Dashboard />} />

            {/* ── Master Records (Super Admin only) ───────────── */}
            <Route path="/master">
              <Route index element={<Navigate to="/master/regional-offices" replace />} />

              <Route path="regional-offices">
                <Route index   element={<ProtectedRoute allowedRoles={ADMIN_ONLY}><RegionalOfficesList /></ProtectedRoute>} />
                <Route path="new"      element={<ProtectedRoute allowedRoles={ADMIN_ONLY}><RegionalOfficesForm /></ProtectedRoute>} />
                <Route path=":id"      element={<ProtectedRoute allowedRoles={ADMIN_ONLY}><RegionalOfficesForm /></ProtectedRoute>} />
                <Route path=":id/edit" element={<ProtectedRoute allowedRoles={ADMIN_ONLY}><RegionalOfficesForm /></ProtectedRoute>} />
              </Route>

              <Route path="industries">
                <Route index          element={<ProtectedRoute allowedRoles={ADMIN_ONLY}><IndustriesList /></ProtectedRoute>} />
                <Route path="new"      element={<ProtectedRoute allowedRoles={ADMIN_ONLY}><IndustriesForm /></ProtectedRoute>} />
                <Route path=":id/edit" element={<ProtectedRoute allowedRoles={ADMIN_ONLY}><IndustriesForm /></ProtectedRoute>} />
              </Route>

              <Route path="units">
                <Route index          element={<ProtectedRoute allowedRoles={ADMIN_ONLY}><UnitsList /></ProtectedRoute>} />
                <Route path="new"      element={<ProtectedRoute allowedRoles={ADMIN_ONLY}><UnitsForm /></ProtectedRoute>} />
                <Route path=":id/edit" element={<ProtectedRoute allowedRoles={ADMIN_ONLY}><UnitsForm /></ProtectedRoute>} />
              </Route>

              <Route path="prescribed-limits">
                <Route index          element={<ProtectedRoute allowedRoles={ADMIN_ONLY}><PrescribedLimitsList /></ProtectedRoute>} />
                <Route path="new"      element={<ProtectedRoute allowedRoles={ADMIN_ONLY}><PrescribedLimitsForm /></ProtectedRoute>} />
                <Route path=":id/edit" element={<ProtectedRoute allowedRoles={ADMIN_ONLY}><PrescribedLimitsForm /></ProtectedRoute>} />
              </Route>

              <Route path="locations">
                <Route index          element={<ProtectedRoute allowedRoles={ADMIN_ONLY}><LocationsList /></ProtectedRoute>} />
                <Route path="new"      element={<ProtectedRoute allowedRoles={ADMIN_ONLY}><LocationsForm /></ProtectedRoute>} />
                <Route path=":id/edit" element={<ProtectedRoute allowedRoles={ADMIN_ONLY}><LocationsForm /></ProtectedRoute>} />
              </Route>

              <Route path="monitoring-team">
                <Route index          element={<ProtectedRoute allowedRoles={ADMIN_ONLY}><MonitoringTeamList /></ProtectedRoute>} />
                <Route path="new"      element={<ProtectedRoute allowedRoles={ADMIN_ONLY}><MonitoringTeamForm /></ProtectedRoute>} />
                <Route path=":id/edit" element={<ProtectedRoute allowedRoles={ADMIN_ONLY}><MonitoringTeamForm /></ProtectedRoute>} />
              </Route>

              <Route path="users">
                <Route index          element={<ProtectedRoute allowedRoles={ADMIN_ONLY}><UserManagementList /></ProtectedRoute>} />
                <Route path="new"      element={<ProtectedRoute allowedRoles={ADMIN_ONLY}><UserManagementForm /></ProtectedRoute>} />
                <Route path=":id/edit" element={<ProtectedRoute allowedRoles={ADMIN_ONLY}><UserManagementForm /></ProtectedRoute>} />
              </Route>
            </Route>

            {/* ── Reports ─────────────────────────────────────── */}
            <Route path="/reports">
              <Route index element={<Navigate to="/reports/air" replace />} />

              <Route path="air">
                <Route index        element={<AirMonitoringList />} />
                <Route path="new"   element={<AirMonitoringForm />} />
                <Route path=":id"   element={<AQIReportView />} />
              </Route>

              <Route path="water">
                <Route index             element={<WaterReportList />} />
                <Route path="new/natural" element={<NaturalWaterForm />} />
                <Route path="new/waste"   element={<WasteWaterForm />} />
              </Route>

              <Route path="noise">
                <Route index       element={<NoiseReportList />} />
                <Route path="new"  element={<NoiseMonitoringForm />} />
              </Route>

              <Route path="comparison" element={<StubPage title="Comparison Reports" description="Multi-station parameter comparison with Pie, Bar, and Line charts." />} />
              <Route path="yearly"     element={<StubPage title="Yearly Reports"     description="Annual RO-wise aggregated reports with monthly trend analysis." />} />
            </Route>

            {/* ── Compliance ──────────────────────────────────── */}
            <Route path="/compliance">
              <Route index                element={<ProtectedRoute allowedRoles={ADMIN_RO}><ComplianceDashboard /></ProtectedRoute>} />
              <Route path="violations"    element={<ProtectedRoute allowedRoles={ADMIN_RO}><ViolationList /></ProtectedRoute>} />
              <Route path="escalations"   element={<ProtectedRoute allowedRoles={ADMIN_RO}><EscalationBoard /></ProtectedRoute>} />
              <Route path="locks"         element={<ProtectedRoute allowedRoles={ADMIN_RO}><StubPage title="Report Lock Status" description="Monthly submission lock status per Regional Office." /></ProtectedRoute>} />
            </Route>

            {/* ── Map & Forecast ──────────────────────────────── */}
            <Route path="/map"      element={<ProtectedRoute allowedRoles={ADMIN_RO}><HeatmapPage /></ProtectedRoute>} />
            <Route path="/forecast" element={<ProtectedRoute allowedRoles={ADMIN_RO}><ForecastPage /></ProtectedRoute>} />

            {/* ── Settings ────────────────────────────────────── */}
            <Route path="/settings">
              <Route path="profile" element={<StubPage title="User Profile"    description="Manage your account details and password." />} />
              <Route path="support" element={<StubPage title="Support Tickets" description="Raise and track support tickets and unlock requests." />} />
            </Route>
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />

        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
