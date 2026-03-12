// ── Units ──────────────────────────────────────────────────────
import MasterListPage from '../../components/common/MasterListPage'
import MasterFormPage from '../../components/common/MasterFormPage'
import { MONITORING_TYPES, NOISE_ZONES } from '../../config/constants'

const unitsConfig = {
  title: 'Units', addTitle: 'Add New Unit',
  collection: 'units', basePath: '/master/units',
  columns: [
    { key: 'characteristicName', label: 'Characteristics / Unit Name' },
    { key: 'shortName',          label: 'Unit Short Name' },
    { key: 'department',         label: 'Department' },
  ],
  formFields: [
    { key: 'monitoringType',     label: 'Monitoring',             type: 'select', options: MONITORING_TYPES, required: true },
    { key: 'characteristicName', label: 'Characteristics / Name', type: 'text',   required: true },
    { key: 'shortName',          label: 'Unit',                   type: 'text',   required: true, placeholder: 'e.g. dB, µg/m³' },
    { key: 'remark',             label: 'Remark',                 type: 'textarea', colSpan: 2 },
  ],
}
export function UnitsList() { return <MasterListPage config={unitsConfig} /> }
export function UnitsForm()  { return <MasterFormPage config={unitsConfig} /> }

// ── Prescribed Limits ──────────────────────────────────────────
const limitsConfig = {
  title: 'Prescribed Limits', addTitle: 'Add New Limit',
  collection: 'prescribedLimits', basePath: '/master/prescribed-limits',
  columns: [
    { key: 'characteristicName', label: 'Characteristics / Unit Name' },
    { key: 'shortName',          label: 'Unit Short Name' },
    { key: 'limitMax',           label: 'Prescribed Limit' },
  ],
  formFields: [
    { key: 'monitoringType',     label: 'Monitoring',             type: 'select', options: MONITORING_TYPES, required: true },
    { key: 'characteristicName', label: 'Characteristics / Name', type: 'text',   required: true },
    { key: 'shortName',          label: 'Unit',                   type: 'text',   required: true },
    { key: 'limitMin',           label: 'Limit (Min)',            type: 'number', placeholder: 'Leave blank if none' },
    { key: 'limitMax',           label: 'Limit (Max)',            type: 'number', required: true },
    { key: 'source',             label: 'Source',                 type: 'select',
      options: ['CPCB', 'CECB', 'Custom'] },
    { key: 'remark',             label: 'Remark',                 type: 'textarea', colSpan: 2 },
  ],
}
export function PrescribedLimitsList() { return <MasterListPage config={limitsConfig} /> }
export function PrescribedLimitsForm() { return <MasterFormPage config={limitsConfig} /> }

// ── Locations ──────────────────────────────────────────────────
const locationsConfig = {
  title: 'Monitoring Locations', addTitle: 'Add New Location',
  collection: 'monitoringLocations', basePath: '/master/locations',
  columns: [
    { key: 'name', label: 'Location' },
    { key: 'city', label: 'City' },
    { key: 'roName', label: 'RO' },
  ],
  formFields: [
    { key: 'monitoringType', label: 'Monitoring',     type: 'select', options: MONITORING_TYPES, required: true },
    { key: 'name',           label: 'Location Name',  type: 'text',   required: true },
    { key: 'lat',            label: 'Latitude',       type: 'number', required: true, placeholder: 'e.g. 21.2787' },
    { key: 'lng',            label: 'Longitude',      type: 'number', required: true, placeholder: 'e.g. 81.8661' },
    { key: 'city',           label: 'City',           type: 'text',   required: true },
    { key: 'roName',         label: 'RO',             type: 'text',   placeholder: 'Regional Office name' },
    { key: 'remark',         label: 'Remark',         type: 'textarea', colSpan: 2 },
  ],
}
export function LocationsList() { return <MasterListPage config={locationsConfig} /> }
export function LocationsForm() { return <MasterFormPage config={locationsConfig} /> }

// ── Monitoring Team ────────────────────────────────────────────
const teamConfig = {
  title: 'Monitoring Team', addTitle: 'Add New Team Member',
  collection: 'monitoringTeams', basePath: '/master/monitoring-team',
  columns: [
    { key: 'name',        label: 'Name' },
    { key: 'designation', label: 'Designation' },
    { key: 'roName',      label: 'RO' },
    { key: 'contactNo',   label: 'Contact No.' },
  ],
  formFields: [
    { key: 'monitoringType', label: 'Monitoring',   type: 'select', options: MONITORING_TYPES },
    { key: 'roName',         label: 'RO',           type: 'text',   required: true },
    { key: 'name',           label: 'Name',         type: 'text',   required: true },
    { key: 'designation',    label: 'Designation',  type: 'select',
      options: ['Inspector', 'Scientist', 'Chemist', 'RO Incharge', 'Field Officer', 'Other'],
      required: true },
    { key: 'contactNo',      label: 'Contact No.',  type: 'tel' },
    { key: 'remark',         label: 'Remark',       type: 'textarea', colSpan: 2 },
  ],
}
export function MonitoringTeamList() { return <MasterListPage config={teamConfig} /> }
export function MonitoringTeamForm() { return <MasterFormPage config={teamConfig} /> }

// ── User Management ────────────────────────────────────────────
const usersConfig = {
  title: 'User Management', addTitle: 'Add New User',
  collection: 'users', basePath: '/master/users',
  columns: [
    { key: 'name',  label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'role',  label: 'Role' },
    { key: 'roName', label: 'RO' },
    {
      key: 'isActive', label: 'Status',
      render: (val) => (
        <span className={val ? 'badge-compliant' : 'badge-violation'}>
          {val ? 'Active' : 'Inactive'}
        </span>
      )
    },
  ],
  formFields: [
    { key: 'monitoringType', label: 'Monitoring', type: 'select', options: MONITORING_TYPES },
    { key: 'name',           label: 'Name',        type: 'text',   required: true },
    { key: 'email',          label: 'Email',       type: 'email',  required: true },
    { key: 'role',           label: 'Role',        type: 'select', required: true,
      options: [
        { value: 'superAdmin',      label: 'Super Admin' },
        { value: 'regionalOfficer', label: 'Regional Officer' },
        { value: 'monitoringTeam',  label: 'Monitoring Team' },
        { value: 'industryUser',    label: 'Industry User' },
      ]},
    { key: 'roName', label: 'RO', type: 'text' },
    { key: 'remark', label: 'Remark', type: 'textarea', colSpan: 2 },
    // Permissions note — full permission checkbox UI handled in UserManagement.jsx
  ],
}
export function UserManagementList() { return <MasterListPage config={usersConfig} /> }
export function UserManagementForm() { return <MasterFormPage config={usersConfig} /> }
