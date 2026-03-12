// ─────────────────────────────────────────────────────────────
//  Regional Offices — Master Page
// ─────────────────────────────────────────────────────────────
import MasterListPage from '../../components/common/MasterListPage'
import MasterFormPage from '../../components/common/MasterFormPage'
import { MONITORING_TYPES } from '../../config/constants'

const config = {
  title:      'Regional Offices',
  addTitle:   'Add New RO',
  editTitle:  'Edit Regional Office',
  collection: 'regionalOffices',
  basePath:   '/master/regional-offices',
  columns: [
    { key: 'name',      label: 'Regional Office Name' },
    { key: 'officeId',  label: 'Office ID' },
    { key: 'address',   label: 'Address' },
    { key: 'contactNo', label: 'Contact No.' },
  ],
  formFields: [
    { key: 'monitoringType', label: 'Monitoring', type: 'select',
      options: MONITORING_TYPES, required: true },
    { key: 'name',      label: 'RO Name',        type: 'text',     required: true },
    { key: 'officeId',  label: 'ID',              type: 'text',     required: true },
    { key: 'address',   label: 'Address',         type: 'textarea', colSpan: 2 },
    { key: 'email',     label: 'Email ID',        type: 'email' },
    { key: 'contactNo', label: 'Contact Number',  type: 'tel' },
    { key: 'remark',    label: 'Remark',          type: 'textarea', colSpan: 2 },
  ],
}

export function RegionalOfficesList() {
  return <MasterListPage config={config} />
}
export function RegionalOfficesForm() {
  return <MasterFormPage config={config} />
}
