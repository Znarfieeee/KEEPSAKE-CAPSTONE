import React, { useState, useEffect } from 'react'
import { format } from 'date-fns'

const PatientVitals = ({ patient }) => {
    const [isUpdating, setIsUpdating] = useState(false)

    // Show brief update animation when patient data changes
    useEffect(() => {
        if (patient) {
            setIsUpdating(true)
            const timer = setTimeout(() => setIsUpdating(false), 1000)
            return () => clearTimeout(timer)
        }
    }, [patient])

    return (
        <div className={`bg-white rounded-lg shadow-sm p-6 transition-all duration-300 ${
            isUpdating ? 'ring-2 ring-blue-200 ring-opacity-50' : ''
        }`}>
            <div className="mb-10">
                <h2 className="text-lg font-semibold my-4">DELIVERY RECORD</h2>
                <div className="grid grid-cols-3 gap-6">
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm text-gray-600">PEDIATRICIAN</label>
                            <p className="font-medium">
                                Dr. {patient.related_records?.delivery?.pediatrician || '—'}
                            </p>
                        </div>
                        <div>
                            <label className="text-sm text-gray-600">OBSTETRICIAN</label>
                            <p className="font-medium">
                                Dr. {patient.related_records?.delivery?.obstetrician || '—'}
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
                    {/* Screening and allergies adding functionality */}
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm text-gray-600">PATIENT BLOOD TYPE</label>
                            <p className="font-medium">{patient?.bloodtype || '—'}</p>
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
                            <p className="font-medium">
                                {patient.related_records?.delivery?.apgar_score || '—'}
                            </p>
                        </div>
                    </div>
                </div>

                <h3 className="text-md font-semibold mt-10 mb-4">ALLERGIES</h3>
                {patient.related_records?.allergies &&
                Array.isArray(patient.related_records.allergies) &&
                patient.related_records.allergies.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full border border-gray-200 rounded-lg">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                                        DATE
                                    </th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                                        ALLERGEN
                                    </th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                                        REACTION TYPE
                                    </th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                                        SEVERITY
                                    </th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                                        NOTES
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {patient.related_records.allergies.map((allergy, index) => (
                                    <tr
                                        key={allergy.allergy_id || `allergy-${index}`}
                                        className="hover:bg-gray-50"
                                    >
                                        <td className="px-4 py-3 text-sm text-gray-900">
                                            {format(allergy.date_identified, 'PP') || '—'}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-900">
                                            {allergy.allergen || '—'}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-900">
                                            {allergy.reaction_type || '—'}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-900 capitalize">
                                            {allergy.severity?.replace('_', ' ') || '—'}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-900">
                                            {allergy.notes || '—'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="text-sm text-gray-500 italic">No allergies recorded</p>
                )}
            </div>

            {/* Anthropometric Measurements Section */}
            <div className="mb-10">
                <h2 className="text-lg font-semibold mb-4">ANTHROPOMETRIC MEASUREMENTS</h2>
                {patient.related_records?.anthropometric_measurements?.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full border border-gray-200 rounded-lg">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                                        DATE
                                    </th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                                        WEIGHT (kg)
                                    </th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                                        HEIGHT (cm)
                                    </th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                                        HEAD CIRCUMFERENCE (cm)
                                    </th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                                        CHEST CIRCUMFERENCE (cm)
                                    </th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                                        ABDOMINAL CIRCUMFERENCE (cm)
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {patient.related_records.anthropometric_measurements.map(
                                    (measurement) => (
                                        <tr key={measurement.am_id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 text-sm text-gray-900">
                                                {measurement.measurement_date || '—'}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-900">
                                                {measurement.weight || '—'}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-900">
                                                {measurement.height || '—'}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-900">
                                                {measurement.head_circumference || '—'}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-900">
                                                {measurement.chest_circumference || '—'}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-900">
                                                {measurement.abdominal_circumference || '—'}
                                            </td>
                                        </tr>
                                    )
                                )}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="text-sm text-gray-500 italic">
                        No anthropometric measurements recorded
                    </p>
                )}
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
                                        {patient.related_records?.screening?.ens_remarks
                                            ? patient.related_records.screening.ens_remarks
                                                ? 'Normal'
                                                : 'Abnormal'
                                            : '—'}
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
                                        {patient.related_records?.screening?.nhs_right_ear !==
                                        undefined
                                            ? patient.related_records.screening.nhs_right_ear
                                                ? 'Pass'
                                                : 'Refer'
                                            : '—'}
                                    </td>
                                    <td className="py-3 px-4">
                                        {patient.related_records?.screening?.nhs_left_ear !==
                                        undefined
                                            ? patient.related_records.screening.nhs_left_ear
                                                ? 'Pass'
                                                : 'Refer'
                                            : '—'}
                                    </td>
                                </tr>
                                <tr>
                                    <td className="py-3 px-4">
                                        {patient.related_records?.screening?.pos_date || '—'}
                                    </td>
                                    <td className="py-3 px-4">PULSE OXIMETRY SCREENING FOR CCHD</td>
                                    <td className="py-3 px-4">
                                        {patient.related_records?.screening?.pos_for_cchd_right !==
                                        undefined
                                            ? patient.related_records.screening.pos_for_cchd_right
                                                ? 'Pass'
                                                : 'Fail'
                                            : '—'}
                                    </td>
                                    <td className="py-3 px-4">
                                        {patient.related_records?.screening?.pos_for_cchd_left !==
                                        undefined
                                            ? patient.related_records.screening.pos_for_cchd_left
                                                ? 'Pass'
                                                : 'Fail'
                                            : '—'}
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
