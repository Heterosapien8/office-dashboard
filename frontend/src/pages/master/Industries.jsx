import MasterListPage from '../../components/common/MasterListPage'
import MasterFormPage from '../../components/common/MasterFormPage'
import { MONITORING_TYPES, INDUSTRY_TYPES } from '../../config/constants'

const config = {
  title:      'Industries / Water Sources',
  addTitle:   'Add New Industry',
  editTitle:  'Edit Industry',
  collection: 'industries',
  basePath:   '/master/industries',
  columns: [
    { key: 'name',       label: 'Industry Name' },
    { key: 'industryId', label: 'Party ID' },
    { key: 'address',    label: 'Address / Location' },
    { key: 'contactNo',  label: 'Contact No.' },
    {
      key: 'complianceStatus', label: 'Status',
      render: (val) => {
        const colors = {
          compliant: 'badge-compliant',
          violation: 'badge-violation',
          pending:   'badge-pending',
        }
        return (
          <span className={colors[val] ?? 'badge-pending'}>
            {val ?? 'Pending'}
          </span>
        )
      }
    },
  ],
  formFields: [
    { key: 'monitoringType', label: 'Monitoring',        type: 'select',   options: MONITORING_TYPES, required: true },
    { key: 'name',           label: 'Party Name',        type: 'text',     required: true },
    { key: 'industryId',     label: 'Party ID',          type: 'text',     required: true,
      placeholder: 'e.g. IND-001' },
    { key: 'industryType',   label: 'Industry Type',     type: 'select',
      options: INDUSTRY_TYPES.map(t => ({ value: t.toLowerCase(), label: t })) },
    { key: 'address',        label: 'Address / Location',type: 'textarea', colSpan: 2 },
    { key: 'email',          label: 'Email ID',          type: 'email' },
    { key: 'contactNo',      label: 'Contact Number',    type: 'tel' },
    { key: 'lat',            label: 'Latitude',          type: 'number',   placeholder: 'e.g. 21.2787' },
    { key: 'lng',            label: 'Longitude',         type: 'number',   placeholder: 'e.g. 81.8661' },
    { key: 'remark',         label: 'Remark',            type: 'textarea', colSpan: 2 },
  ],
}

export function IndustriesList() {
  return <MasterListPage config={config} />
}
export function IndustriesForm() {
  return <MasterFormPage config={config} />
}
