import React from 'react'
import { Calendar, Syringe, AlertTriangle, CheckCircle } from 'lucide-react'

const PatientImmunization = ({ patient }) => {
  const vaccinations = patient?.related_records?.vaccinations || []

  const formatDate = (dateString) => {
    if (!dateString) return '—'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getStatusIcon = (nextDueDate) => {
    if (!nextDueDate) return <CheckCircle className="w-4 h-4 text-green-500" />

    const due = new Date(nextDueDate)
    const today = new Date()
    const daysUntilDue = Math.ceil((due - today) / (1000 * 60 * 60 * 24))

    if (daysUntilDue < 0) return <AlertTriangle className="w-4 h-4 text-red-500" />
    if (daysUntilDue <= 30) return <AlertTriangle className="w-4 h-4 text-yellow-500" />
    return <CheckCircle className="w-4 h-4 text-green-500" />
  }

  const getStatusText = (nextDueDate) => {
    if (!nextDueDate) return 'Complete'

    const due = new Date(nextDueDate)
    const today = new Date()
    const daysUntilDue = Math.ceil((due - today) / (1000 * 60 * 60 * 24))

    if (daysUntilDue < 0) return `Overdue by ${Math.abs(daysUntilDue)} days`
    if (daysUntilDue <= 30) return `Due in ${daysUntilDue} days`
    return 'Up to date'
  }

  return (
    <div className="bg-white rounded-b-lg shadow-sm p-6 mb-6">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-6">
          <Syringe className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-semibold">IMMUNIZATION RECORDS</h2>
        </div>

        {vaccinations.length > 0 ? (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full border border-gray-200 rounded-lg">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">VACCINE</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">DOSE</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">DATE GIVEN</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">ADMINISTERED BY</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">SITE</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">NEXT DUE</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {vaccinations.map((vaccination) => (
                    <tr key={vaccination.vax_id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-gray-900">
                            {vaccination.vaccine_name || '—'}
                          </p>
                          {vaccination.manufacturer && (
                            <p className="text-sm text-gray-500">
                              {vaccination.manufacturer}
                              {vaccination.lot_number && ` (Lot: ${vaccination.lot_number})`}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {vaccination.dose_number ? `Dose ${vaccination.dose_number}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-gray-400" />
                          {formatDate(vaccination.administered_date)}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {vaccination.administered_by_name || '—'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {vaccination.administration_site || '—'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {formatDate(vaccination.next_dose_due)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(vaccination.next_dose_due)}
                          <span className="text-sm">
                            {getStatusText(vaccination.next_dose_due)}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {vaccinations.some(v => v.notes) && (
              <div className="mt-6">
                <h3 className="text-md font-semibold mb-3">NOTES</h3>
                <div className="space-y-2">
                  {vaccinations
                    .filter(v => v.notes)
                    .map((vaccination) => (
                      <div key={vaccination.vax_id} className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-sm font-medium text-gray-700">
                          {vaccination.vaccine_name}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          {vaccination.notes}
                        </p>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <Syringe className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-500 mb-1">No Immunization Records</h3>
            <p className="text-sm text-gray-400">
              No vaccination records found for this patient.
            </p>
          </div>
        )}

        <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900 mb-1">Immunization Schedule</h4>
              <p className="text-sm text-blue-700">
                Follow the Department of Health immunization schedule for children.
                Ensure all vaccines are up to date and document any adverse reactions.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PatientImmunization
