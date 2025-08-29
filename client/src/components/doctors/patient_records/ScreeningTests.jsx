import React from 'react'

const ScreeningTests = ({ patient }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      <div>
        <h2 className="text-lg font-semibold mb-4">DELIVERY RECORD</h2>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-600">TYPE OF DELIVERY</label>
              <p className="font-medium">
                {patient.related_records?.delivery?.type_of_delivery || '—'}
              </p>
            </div>
            <div>
              <label className="text-sm text-gray-600">APGAR SCORE</label>
              <p className="font-medium">{patient.related_records?.delivery?.apgar_score || '—'}</p>
            </div>
            <div>
              <label className="text-sm text-gray-600">PATIENT BLOOD TYPE</label>
              <p className="font-medium">
                {patient.related_records?.delivery?.patient_blood_type || '—'}
              </p>
            </div>
            <div>
              <label className="text-sm text-gray-600">MOTHER'S BLOOD TYPE</label>
              <p className="font-medium">
                {patient.related_records?.delivery?.mother_blood_type || '—'}
              </p>
            </div>
            <div>
              <label className="text-sm text-gray-600">FATHER'S BLOOD TYPE</label>
              <p className="font-medium">
                {patient.related_records?.delivery?.father_blood_type || '—'}
              </p>
            </div>
            <div>
              <label className="text-sm text-gray-600">DISTINGUISHABLE MARKS</label>
              <p className="font-medium">
                {patient.related_records?.delivery?.distinguishable_marks || '—'}
              </p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-600">PEDIATRICIAN</label>
              <p className="font-medium">
                {patient.related_records?.delivery?.pediatrician || '—'}
              </p>
            </div>
            <div>
              <label className="text-sm text-gray-600">OBSTETRICIAN</label>
              <p className="font-medium">
                {patient.related_records?.delivery?.obstetrician || '—'}
              </p>
            </div>
            <div>
              <label className="text-sm text-gray-600">DISCHARGE DIAGNOSIS</label>
              <p className="font-medium">
                {patient.related_records?.delivery?.discharge_diagnosis || '—'}
              </p>
            </div>
            <div>
              <label className="text-sm text-gray-600">OTHER MEDICATIONS</label>
              <p className="font-medium">
                {patient.related_records?.delivery?.other_medications || '—'}
              </p>
            </div>
            <div>
              <label className="text-sm text-gray-600">FOLLOW-UP VISIT DATE</label>
              <p className="font-medium">
                {patient.related_records?.delivery?.follow_up_visit_date}
              </p>
            </div>
            <div>
              <label className="text-sm text-gray-600">FOLLOW-UP VISIT SITE</label>
              <p className="font-medium">
                {patient.related_records?.delivery?.follow_up_visit_site || '—'}
              </p>
            </div>
          </div>
        </div>

        <h3 className="text-md font-semibold mt-6 mb-4">VACCINATIONS & MEDICATIONS</h3>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-600">BCG VACCINATION DATE</label>
              <p className="font-medium">
                {patient.related_records?.delivery?.bcg_vaccination_date}
              </p>
            </div>
            <div>
              <label className="text-sm text-gray-600">BCG VACCINATION LOCATION</label>
              <p className="font-medium">
                {patient.related_records?.delivery?.bcg_vaccination_location || '—'}
              </p>
            </div>
            <div>
              <label className="text-sm text-gray-600">HEPATITIS B DATE</label>
              <p className="font-medium">{patient.related_records?.delivery?.hepatitis_b_date}</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-600">HEPATITIS B LOCATION</label>
              <p className="font-medium">
                {patient.related_records?.delivery?.hepatitis_b_location || '—'}
              </p>
            </div>
            <div>
              <label className="text-sm text-gray-600">VITAMIN K DATE</label>
              <p className="font-medium">{patient.related_records?.delivery?.vitamin_k_date}</p>
            </div>
            <div>
              <label className="text-sm text-gray-600">VITAMIN K LOCATION</label>
              <p className="font-medium">
                {patient.related_records?.delivery?.vitamin_k_location || '—'}
              </p>
            </div>
          </div>
        </div>
      </div>
      <div>
        <h2 className="text-lg font-semibold mb-4">SCREENING TEST</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-4">TEST</th>
                <th className="text-left py-2 px-4">DATE</th>
                <th className="text-left py-2 px-4">RIGHT EAR/FOOT</th>
                <th className="text-left py-2 px-4">LEFT EAR/FOOT</th>
                <th className="text-left py-2 px-4">REMARKS</th>
              </tr>
            </thead>
            <tbody>
              {/* Newborn Hearing Screening */}
              <tr className="border-b">
                <td className="py-2 px-4">Newborn Hearing Screening (NHS)</td>
                <td className="py-2 px-4">{patient.related_records?.screening?.nhs_date || '—'}</td>
                <td className="py-2 px-4">
                  {patient.related_records?.screening?.nhs_right_ear || '—'}
                </td>
                <td className="py-2 px-4">
                  {patient.related_records?.screening?.nhs_left_ear || '—'}
                </td>
                <td className="py-2 px-4">—</td>
              </tr>
              {/* Pulse Oximetry Screening */}
              <tr className="border-b">
                <td className="py-2 px-4">Pulse Oximetry Screening (POS)</td>
                <td className="py-2 px-4">{patient.related_records?.screening?.pos_date || '—'}</td>
                <td className="py-2 px-4">
                  {patient.related_records?.screening?.pos_for_cchd_right || '—'}
                </td>
                <td className="py-2 px-4">
                  {patient.related_records?.screening?.pos_for_cchd_left || '—'}
                </td>
                <td className="py-2 px-4">—</td>
              </tr>
              {/* Eye Screening */}
              <tr className="border-b">
                <td className="py-2 px-4">Eye Screening (ENS)</td>
                <td className="py-2 px-4">{patient.related_records?.screening?.ens_date || '—'}</td>
                <td className="py-2 px-4">—</td>
                <td className="py-2 px-4">—</td>
                <td className="py-2 px-4">
                  {patient.related_records?.screening?.ens_remarks || '—'}
                </td>
              </tr>
              {/* Red Reflex */}
              <tr className="border-b">
                <td className="py-2 px-4">Red Reflex (ROR)</td>
                <td className="py-2 px-4">{patient.related_records?.screening?.ror_date || '—'}</td>
                <td className="py-2 px-4">—</td>
                <td className="py-2 px-4">—</td>
                <td className="py-2 px-4">
                  {patient.related_records?.screening?.ror_remarks || '—'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default ScreeningTests
