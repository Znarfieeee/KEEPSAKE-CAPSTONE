import React from 'react'

const PatientVitals = ({ patient }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      <div className="mb-10">
        <h2 className="text-lg font-semibold my-4">DELIVERY RECORD</h2>
        <div className="grid grid-cols-3 gap-6">
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
              <label className="text-sm text-gray-600">TYPE OF DELIVERY</label>
              <p className="font-medium">
                {patient.related_records?.delivery?.type_of_delivery || '—'}
              </p>
            </div>
            <div>
              <label className="text-sm text-gray-600">DISCHARGE DIAGNOSIS</label>
              <p className="font-medium">
                {patient.related_records?.delivery?.discharge_diagnosis || '—'}
              </p>
            </div>
          </div>
          <div className="space-y-4">
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
              <label className="text-sm text-gray-600">OTHER MEDICATIONS</label>
              <p className="font-medium">
                {patient.related_records?.delivery?.other_medications || '—'}
              </p>
            </div>
            <div>
              <label className="text-sm text-gray-600">FOLLOW-UP VISIT DATE</label>
              <p className="font-medium">
                {patient.related_records?.delivery?.follow_up_visit_date || '—'}
              </p>
            </div>
            <div>
              <label className="text-sm text-gray-600">FOLLOW-UP VISIT SITE</label>
              <p className="font-medium">
                {patient.related_records?.delivery?.follow_up_visit_site || '—'}
              </p>
            </div>
            <div>
              <label className="text-sm text-gray-600">APGAR SCORE</label>
              <p className="font-medium">{patient.related_records?.delivery?.apgar_score || '—'}</p>
            </div>
          </div>
        </div>

        <h3 className="text-md font-semibold mt-10 mb-4">ALLERGIES</h3>
        <div className="grid grid-cols-2 gap-6">
          {patient.related_records?.allergies?.length > 0 ? (
            patient.related_records.allergies.map((allergy) => (
              <div key={allergy.allergy_id} className="bg-gray-50 p-4 rounded-lg">
                <div className="space-y-2">
                  <div>
                    <label className="text-sm text-gray-600">ALLERGEN</label>
                    <p className="font-medium">{allergy.allergen || '—'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">REACTION TYPE</label>
                    <p className="font-medium">{allergy.reaction_type || '—'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">SEVERITY</label>
                    <p className="font-medium capitalize">
                      {allergy.severity?.replace('_', ' ') || '—'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">DATE IDENTIFIED</label>
                    <p className="font-medium">{allergy.date_identified || '—'}</p>
                  </div>
                  {allergy.notes && (
                    <div>
                      <label className="text-sm text-gray-600">NOTES</label>
                      <p className="font-medium">{allergy.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="col-span-2 text-sm text-gray-500 italic">No allergies recorded</p>
          )}
        </div>
      </div>
      <div className="w-full">
        <h2 className="text-lg font-semibold mb-4">SCREENING TEST</h2>
        <div className="space-y-6 flex flex-col items-center max-w-4xl mx-auto text-sm">
          {/* First Table - General Screening */}
          <div className="overflow-x-auto w-full">
            <table className="w-full rounded-lg mx-auto">
              <thead className="border-b border-b-gray-200">
                <tr className="font-semibold">
                  <th className="text-left py-3 px-4 w-1/4">DATE</th>
                  <th className="text-left py-3 px-4 w-2/4">DESCRIPTION</th>
                  <th className="text-left py-3 px-4 w-1/4">REMARKS</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="py-3 px-4">
                    {patient.related_records?.screening?.ens_date || '—'}
                  </td>
                  <td className="py-3 px-4">EXPANDED NEWBORN SCREENING</td>
                  <td className="py-3 px-4">
                    {patient.related_records?.screening?.ens_remarks || '—'}
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-4">
                    {patient.related_records?.screening?.ror_date || '—'}
                  </td>
                  <td className="py-3 px-4">RED ORANGE REFLEX</td>
                  <td className="py-3 px-4">
                    {patient.related_records?.screening?.ror_remarks || '—'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          {/* Second Table - Bilateral Tests */}
          <div className="overflow-x-auto w-full">
            <table className="w-full rounded-lg mx-auto">
              <thead className="border-b border-b-gray-300">
                <tr className="font-semibold">
                  <th className="text-left py-3 px-4 w-1/5">DATE</th>
                  <th className="text-left py-3 px-4 w-2/5">DESCRIPTION</th>
                  <th className="text-left py-3 px-4 w-1/5">RIGHT</th>
                  <th className="text-left py-3 px-4 w-1/5">LEFT</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="py-3 px-4">
                    {patient.related_records?.screening?.nhs_date || '—'}
                  </td>
                  <td className="py-3 px-4">NEWBORN HEARING SCREENING</td>
                  <td className="py-3 px-4">
                    {patient.related_records?.screening?.nhs_right_ear || '—'}
                  </td>
                  <td className="py-3 px-4">
                    {patient.related_records?.screening?.nhs_left_ear || '—'}
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-4">
                    {patient.related_records?.screening?.pos_date || '—'}
                  </td>
                  <td className="py-3 px-4">PULSE OXIMETRY SCREENING FOR CCHD</td>
                  <td className="py-3 px-4">
                    {patient.related_records?.screening?.pos_for_cchd_right || '—'}
                  </td>
                  <td className="py-3 px-4">
                    {patient.related_records?.screening?.pos_for_cchd_left || '—'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PatientVitals
