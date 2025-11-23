import React, { useState, useEffect, useMemo } from 'react'
import { format, isValid, parseISO } from 'date-fns'

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

    // Safely format date with error handling
    const formatDate = (dateString) => {
        if (!dateString) return '—'
        try {
            const date = typeof dateString === 'string' ? parseISO(dateString) : new Date(dateString)
            return isValid(date) ? format(date, 'PP') : '—'
        } catch {
            return '—'
        }
    }

    // Memoize related records with safe defaults
    const relatedRecords = useMemo(() => ({
        delivery: patient?.related_records?.delivery || null,
        allergies: Array.isArray(patient?.related_records?.allergies)
            ? patient.related_records.allergies
            : [],
        anthropometric_measurements: Array.isArray(patient?.related_records?.anthropometric_measurements)
            ? patient.related_records.anthropometric_measurements
            : [],
        screening: patient?.related_records?.screening || null
    }), [patient?.related_records])

    // Helper component for displaying labeled data
    const DataField = ({ label, value, className = '' }) => (
        <div className={`space-y-1 ${className}`}>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                {label}
            </label>
            <p className="font-medium text-gray-900">{value || '—'}</p>
        </div>
    )

    // Helper component for section headers
    const SectionHeader = ({ title, icon }) => (
        <div className="flex items-center gap-2 mb-6">
            {icon && <span className="text-blue-600">{icon}</span>}
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        </div>
    )

    // Early return if no patient data
    if (!patient) {
        return (
            <div className="flex items-center justify-center p-8">
                <p className="text-gray-500">No patient data available</p>
            </div>
        )
    }

    return (
        <div
            className={`space-y-8 transition-all duration-300 ${
                isUpdating ? 'ring-2 ring-blue-200 ring-opacity-50 rounded-lg' : ''
            }`}
        >
            {/* Delivery Record Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
                <SectionHeader
                    title="DELIVERY RECORD"
                    icon={
                        <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                        </svg>
                    }
                />

                {/* Medical Team & Delivery Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
                    <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                        <h3 className="font-medium text-gray-700 text-sm">Medical Team</h3>
                        <DataField
                            label="Pediatrician"
                            value={
                                relatedRecords.delivery?.pediatrician
                                    ? `Dr. ${relatedRecords.delivery.pediatrician}`
                                    : null
                            }
                        />
                        <DataField
                            label="Obstetrician"
                            value={
                                relatedRecords.delivery?.obstetrician
                                    ? `Dr. ${relatedRecords.delivery.obstetrician}`
                                    : null
                            }
                        />
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                        <h3 className="font-medium text-gray-700 text-sm">Delivery Details</h3>
                        <DataField
                            label="Type of Delivery"
                            value={relatedRecords.delivery?.type_of_delivery}
                        />
                        <DataField
                            label="APGAR Score"
                            value={relatedRecords.delivery?.apgar_score}
                        />
                        <DataField
                            label="Discharge Diagnosis"
                            value={relatedRecords.delivery?.discharge_diagnosis}
                        />
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4 space-y-4 sm:col-span-2 lg:col-span-1">
                        <h3 className="font-medium text-gray-700 text-sm">Follow-up Information</h3>
                        <DataField
                            label="Follow-up Visit Date"
                            value={relatedRecords.delivery?.follow_up_visit_date}
                        />
                        <DataField
                            label="Follow-up Visit Site"
                            value={relatedRecords.delivery?.follow_up_visit_site}
                        />
                        <DataField
                            label="Other Medications"
                            value={relatedRecords.delivery?.other_medications}
                        />
                    </div>
                </div>

                {/* Blood Type Information */}
                <div className="mb-8">
                    <h3 className="font-medium text-gray-700 text-sm mb-4">Blood Type Information</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="flex items-center gap-3 bg-red-50 rounded-lg p-4">
                            <div className="flex-shrink-0">
                                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                                    <span className="text-red-600 font-bold text-sm">P</span>
                                </div>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase">Patient</p>
                                <p className="font-semibold text-gray-900">
                                    {patient?.bloodtype || '—'}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 bg-pink-50 rounded-lg p-4">
                            <div className="flex-shrink-0">
                                <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center">
                                    <span className="text-pink-600 font-bold text-sm">M</span>
                                </div>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase">Mother</p>
                                <p className="font-semibold text-gray-900">
                                    {relatedRecords.delivery?.mother_blood_type || '—'}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 bg-blue-50 rounded-lg p-4">
                            <div className="flex-shrink-0">
                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                    <span className="text-blue-600 font-bold text-sm">F</span>
                                </div>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase">Father</p>
                                <p className="font-semibold text-gray-900">
                                    {relatedRecords.delivery?.father_blood_type || '—'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Distinguishable Marks */}
                <div className="mb-6">
                    <DataField
                        label="Distinguishable Marks"
                        value={relatedRecords.delivery?.distinguishable_marks}
                    />
                </div>
            </div>

            {/* Allergies Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
                <SectionHeader
                    title="ALLERGIES"
                    icon={
                        <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                            />
                        </svg>
                    }
                />

                {relatedRecords.allergies.length > 0 ? (
                    <div className="space-y-4">
                        {/* Desktop Table View */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full border border-gray-200 rounded-lg">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                                            Date
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                                            Allergen
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                                            Reaction Type
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                                            Severity
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                                            Notes
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {relatedRecords.allergies.map((allergy, index) => (
                                        <tr
                                            key={allergy.allergy_id || `allergy-${index}`}
                                            className="hover:bg-gray-50"
                                        >
                                            <td className="px-4 py-3 text-sm text-gray-900">
                                                {formatDate(allergy.date_identified)}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                                                {allergy.allergen || '—'}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-900">
                                                {allergy.reaction_type || '—'}
                                            </td>
                                            <td className="px-4 py-3 text-sm">
                                                <span
                                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                                                    ${
                                                        allergy.severity === 'severe'
                                                            ? 'bg-red-100 text-red-800'
                                                            : allergy.severity === 'moderate'
                                                            ? 'bg-yellow-100 text-yellow-800'
                                                            : 'bg-green-100 text-green-800'
                                                    }`}
                                                >
                                                    {allergy.severity?.replace('_', ' ') || '—'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-900">
                                                {allergy.notes || '—'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Card View */}
                        <div className="md:hidden space-y-3">
                            {relatedRecords.allergies.map((allergy, index) => (
                                <div
                                    key={allergy.allergy_id || `allergy-mobile-${index}`}
                                    className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <h4 className="font-semibold text-gray-900">
                                            {allergy.allergen || 'Unknown Allergen'}
                                        </h4>
                                        <span
                                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                                            ${
                                                allergy.severity === 'severe'
                                                    ? 'bg-red-100 text-red-800'
                                                    : allergy.severity === 'moderate'
                                                    ? 'bg-yellow-100 text-yellow-800'
                                                    : 'bg-green-100 text-green-800'
                                            }`}
                                        >
                                            {allergy.severity?.replace('_', ' ') || '—'}
                                        </span>
                                    </div>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Date:</span>
                                            <span className="text-gray-900">
                                                {formatDate(allergy.date_identified)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Reaction:</span>
                                            <span className="text-gray-900">
                                                {allergy.reaction_type || '—'}
                                            </span>
                                        </div>
                                        {allergy.notes && (
                                            <div className="pt-2 border-t border-gray-200">
                                                <p className="text-gray-500 text-xs mb-1">Notes:</p>
                                                <p className="text-gray-900">{allergy.notes}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                        <svg
                            className="mx-auto h-12 w-12 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg>
                        <p className="mt-2 text-sm text-gray-500">No allergies recorded</p>
                    </div>
                )}
            </div>

            {/* Anthropometric Measurements Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
                <SectionHeader
                    title="ANTHROPOMETRIC MEASUREMENTS"
                    icon={
                        <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                            />
                        </svg>
                    }
                />

                {relatedRecords.anthropometric_measurements.length > 0 ? (
                    <div className="space-y-4">
                        {/* Desktop Table View */}
                        <div className="hidden lg:block overflow-x-auto">
                            <table className="w-full border border-gray-200 rounded-lg">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                                            Date
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                                            Weight (kg)
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                                            Height (cm)
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                                            Head (cm)
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                                            Chest (cm)
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                                            Abdominal (cm)
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {relatedRecords.anthropometric_measurements.map(
                                        (measurement, index) => (
                                            <tr
                                                key={measurement.am_id || measurement.measurement_id || `measurement-${index}`}
                                                className="hover:bg-gray-50"
                                            >
                                                <td className="px-4 py-3 text-sm text-gray-900">
                                                    {measurement.measurement_date || '—'}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                                                    {measurement.weight || '—'}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-900 font-medium">
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

                        {/* Mobile/Tablet Card View */}
                        <div className="lg:hidden space-y-3">
                            {relatedRecords.anthropometric_measurements.map(
                                (measurement, index) => (
                                    <div
                                        key={measurement.am_id || measurement.measurement_id || `measurement-mobile-${index}`}
                                        className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                                    >
                                        <div className="flex justify-between items-center mb-3">
                                            <h4 className="font-semibold text-gray-900">
                                                {measurement.measurement_date || 'Unknown Date'}
                                            </h4>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3 text-sm">
                                            <div>
                                                <span className="text-gray-500 block text-xs">
                                                    Weight
                                                </span>
                                                <span className="text-gray-900 font-medium">
                                                    {measurement.weight
                                                        ? `${measurement.weight} kg`
                                                        : '—'}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-gray-500 block text-xs">
                                                    Height
                                                </span>
                                                <span className="text-gray-900 font-medium">
                                                    {measurement.height
                                                        ? `${measurement.height} cm`
                                                        : '—'}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-gray-500 block text-xs">
                                                    Head Circ.
                                                </span>
                                                <span className="text-gray-900">
                                                    {measurement.head_circumference
                                                        ? `${measurement.head_circumference} cm`
                                                        : '—'}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-gray-500 block text-xs">
                                                    Chest Circ.
                                                </span>
                                                <span className="text-gray-900">
                                                    {measurement.chest_circumference
                                                        ? `${measurement.chest_circumference} cm`
                                                        : '—'}
                                                </span>
                                            </div>
                                            <div className="col-span-2">
                                                <span className="text-gray-500 block text-xs">
                                                    Abdominal Circ.
                                                </span>
                                                <span className="text-gray-900">
                                                    {measurement.abdominal_circumference
                                                        ? `${measurement.abdominal_circumference} cm`
                                                        : '—'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                        <svg
                            className="mx-auto h-12 w-12 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                            />
                        </svg>
                        <p className="mt-2 text-sm text-gray-500">
                            No anthropometric measurements recorded
                        </p>
                    </div>
                )}
            </div>

            {/* Screening Tests Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
                <SectionHeader
                    title="SCREENING TESTS"
                    icon={
                        <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                            />
                        </svg>
                    }
                />

                <div className="space-y-6">
                    {/* General Screening Tests */}
                    <div>
                        <h3 className="font-medium text-gray-700 text-sm mb-3">General Screening</h3>
                        <div className="space-y-3">
                            {/* Expanded Newborn Screening */}
                            <div className="bg-gray-50 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="flex-1">
                                    <p className="font-medium text-gray-900">
                                        Expanded Newborn Screening
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        Date:{' '}
                                        {relatedRecords.screening?.ens_date || '—'}
                                    </p>
                                </div>
                                <div>
                                    <span
                                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium
                                        ${
                                            relatedRecords.screening?.ens_remarks === true
                                                ? 'bg-green-100 text-green-800'
                                                : relatedRecords.screening?.ens_remarks === false
                                                ? 'bg-red-100 text-red-800'
                                                : 'bg-gray-100 text-gray-600'
                                        }`}
                                    >
                                        {relatedRecords.screening?.ens_remarks === true
                                            ? 'Normal'
                                            : relatedRecords.screening?.ens_remarks === false
                                            ? 'Abnormal'
                                            : '—'}
                                    </span>
                                </div>
                            </div>

                            {/* Red Orange Reflex */}
                            <div className="bg-gray-50 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="flex-1">
                                    <p className="font-medium text-gray-900">Red Orange Reflex</p>
                                    <p className="text-sm text-gray-500">
                                        Date:{' '}
                                        {relatedRecords.screening?.ror_date || '—'}
                                    </p>
                                </div>
                                <div>
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                                        {relatedRecords.screening?.ror_remarks || '—'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bilateral Tests */}
                    <div>
                        <h3 className="font-medium text-gray-700 text-sm mb-3">Bilateral Tests</h3>
                        <div className="space-y-3">
                            {/* Newborn Hearing Screening */}
                            <div className="bg-gray-50 rounded-lg p-4">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                                    <div className="flex-1">
                                        <p className="font-medium text-gray-900">
                                            Newborn Hearing Screening
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            Date:{' '}
                                            {relatedRecords.screening?.nhs_date || '—'}
                                        </p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="text-center">
                                        <p className="text-xs text-gray-500 mb-1">Right Ear</p>
                                        <span
                                            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium
                                            ${
                                                relatedRecords.screening?.nhs_right_ear === true
                                                    ? 'bg-green-100 text-green-800'
                                                    : relatedRecords.screening?.nhs_right_ear === false
                                                    ? 'bg-yellow-100 text-yellow-800'
                                                    : 'bg-gray-100 text-gray-600'
                                            }`}
                                        >
                                            {relatedRecords.screening?.nhs_right_ear === true
                                                ? 'Pass'
                                                : relatedRecords.screening?.nhs_right_ear === false
                                                ? 'Refer'
                                                : '—'}
                                        </span>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-xs text-gray-500 mb-1">Left Ear</p>
                                        <span
                                            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium
                                            ${
                                                relatedRecords.screening?.nhs_left_ear === true
                                                    ? 'bg-green-100 text-green-800'
                                                    : relatedRecords.screening?.nhs_left_ear === false
                                                    ? 'bg-yellow-100 text-yellow-800'
                                                    : 'bg-gray-100 text-gray-600'
                                            }`}
                                        >
                                            {relatedRecords.screening?.nhs_left_ear === true
                                                ? 'Pass'
                                                : relatedRecords.screening?.nhs_left_ear === false
                                                ? 'Refer'
                                                : '—'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Pulse Oximetry Screening */}
                            <div className="bg-gray-50 rounded-lg p-4">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                                    <div className="flex-1">
                                        <p className="font-medium text-gray-900">
                                            Pulse Oximetry Screening for CCHD
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            Date:{' '}
                                            {relatedRecords.screening?.pos_date || '—'}
                                        </p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="text-center">
                                        <p className="text-xs text-gray-500 mb-1">Right</p>
                                        <span
                                            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium
                                            ${
                                                relatedRecords.screening?.pos_for_cchd_right === true
                                                    ? 'bg-green-100 text-green-800'
                                                    : relatedRecords.screening?.pos_for_cchd_right === false
                                                    ? 'bg-red-100 text-red-800'
                                                    : 'bg-gray-100 text-gray-600'
                                            }`}
                                        >
                                            {relatedRecords.screening?.pos_for_cchd_right === true
                                                ? 'Pass'
                                                : relatedRecords.screening?.pos_for_cchd_right === false
                                                ? 'Fail'
                                                : '—'}
                                        </span>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-xs text-gray-500 mb-1">Left</p>
                                        <span
                                            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium
                                            ${
                                                relatedRecords.screening?.pos_for_cchd_left === true
                                                    ? 'bg-green-100 text-green-800'
                                                    : relatedRecords.screening?.pos_for_cchd_left === false
                                                    ? 'bg-red-100 text-red-800'
                                                    : 'bg-gray-100 text-gray-600'
                                            }`}
                                        >
                                            {relatedRecords.screening?.pos_for_cchd_left === true
                                                ? 'Pass'
                                                : relatedRecords.screening?.pos_for_cchd_left === false
                                                ? 'Fail'
                                                : '—'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default PatientVitals
