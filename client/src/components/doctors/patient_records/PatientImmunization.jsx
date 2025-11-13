import React, { useState } from 'react'
import { Calendar, Syringe, AlertTriangle, CheckCircle, Plus, Edit, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import AddImmunizationDialog from './AddImmunizationDialog'
import EditImmunizationDialog from './EditImmunizationDialog'
import ConfirmationDialog from '@/components/ui/ConfirmationDialog'
import { deleteVaccination } from '@/api/doctor/vaccinations'
import { showToast } from '@/util/alertHelper'

const PatientImmunization = ({ patient, onUpdate }) => {
    const [vaccinations, setVaccinations] = useState(patient?.related_records?.vaccinations || [])
    const [showAddDialog, setShowAddDialog] = useState(false)
    const [showEditDialog, setShowEditDialog] = useState(false)
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    const [selectedVaccination, setSelectedVaccination] = useState(null)
    const [deleteLoading, setDeleteLoading] = useState(false)

    const formatDate = (dateString) => {
        if (!dateString) return '—'
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
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

    // Handle successful immunization addition
    const handleImmunizationAdded = (newVaccination) => {
        setVaccinations((prev) => [newVaccination, ...prev])
        // Dispatch custom event for parent to update
        if (onUpdate) {
            onUpdate()
        }
        // Also dispatch a window event for real-time updates
        window.dispatchEvent(
            new CustomEvent('vaccination-created', {
                detail: newVaccination,
            })
        )
    }

    // Handle edit button click
    const handleEdit = (vaccination) => {
        setSelectedVaccination(vaccination)
        setShowEditDialog(true)
    }

    // Handle successful immunization update
    const handleImmunizationUpdated = (updatedVaccination) => {
        setVaccinations((prev) =>
            prev.map((v) => (v.vax_id === updatedVaccination.vax_id ? updatedVaccination : v))
        )
        // Dispatch custom event for parent to update
        if (onUpdate) {
            onUpdate()
        }
        // Also dispatch a window event for real-time updates
        window.dispatchEvent(
            new CustomEvent('vaccination-updated', {
                detail: updatedVaccination,
            })
        )
    }

    // Handle delete button click - show confirmation dialog
    const handleDeleteClick = (vaccination) => {
        setSelectedVaccination(vaccination)
        setShowDeleteDialog(true)
    }

    // Handle confirmed deletion - perform soft delete
    const handleConfirmDelete = async () => {
        if (!selectedVaccination) return

        setDeleteLoading(true)
        try {
            const response = await deleteVaccination(patient.patient_id, selectedVaccination.vax_id)

            if (response.status === 'success') {
                showToast('success', 'Immunization record deleted successfully')
                // Remove from local state
                setVaccinations((prev) =>
                    prev.filter((v) => v.vax_id !== selectedVaccination.vax_id)
                )
                // Dispatch custom event for parent to update
                if (onUpdate) {
                    onUpdate()
                }
                // Also dispatch a window event for real-time updates
                window.dispatchEvent(
                    new CustomEvent('vaccination-deleted', {
                        detail: { vax_id: selectedVaccination.vax_id },
                    })
                )
                // Close dialog
                setShowDeleteDialog(false)
                setSelectedVaccination(null)
            } else {
                showToast('error', response.message || 'Failed to delete immunization record')
            }
        } catch (error) {
            console.error('Error deleting immunization:', error)
            const errorMessage =
                error.response?.data?.message ||
                error.message ||
                'Failed to delete immunization record'
            showToast('error', errorMessage)
        } finally {
            setDeleteLoading(false)
        }
    }

    return (
        <div className="bg-white rounded-b-lg shadow-sm p-6 mb-6">
            <div className="mb-8">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <Syringe className="w-5 h-5 text-blue-600" />
                        <h2 className="text-lg font-semibold">IMMUNIZATION RECORDS</h2>
                    </div>
                    <Button
                        onClick={() => setShowAddDialog(true)}
                        className="flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Immunization
                    </Button>
                </div>

                {vaccinations.length > 0 ? (
                    <div className="space-y-4">
                        <div className="overflow-x-auto">
                            <table className="w-full border border-gray-200 rounded-lg">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                                            VACCINE
                                        </th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                                            DOSE
                                        </th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                                            DATE GIVEN
                                        </th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                                            ADMINISTERED BY
                                        </th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                                            SITE
                                        </th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                                            NEXT DUE
                                        </th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                                            STATUS
                                        </th>
                                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                                            ACTIONS
                                        </th>
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
                                                            {vaccination.lot_number &&
                                                                ` (Lot: ${vaccination.lot_number})`}
                                                        </p>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-900">
                                                {vaccination.dose_number
                                                    ? `Dose ${vaccination.dose_number}`
                                                    : '—'}
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
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-center gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => handleEdit(vaccination)}
                                                        className="h-8 w-8 p-0"
                                                        title="Edit vaccination"
                                                    >
                                                        <Edit className="w-4 h-4 text-blue-600" />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() =>
                                                            handleDeleteClick(vaccination)
                                                        }
                                                        className="h-8 w-8 p-0"
                                                        title="Delete vaccination"
                                                    >
                                                        <Trash2 className="w-4 h-4 text-red-600" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {vaccinations.some((v) => v.notes) && (
                            <div className="mt-6">
                                <h3 className="text-md font-semibold mb-3">NOTES</h3>
                                <div className="space-y-2">
                                    {vaccinations
                                        .filter((v) => v.notes)
                                        .map((vaccination) => (
                                            <div
                                                key={vaccination.vax_id}
                                                className="bg-gray-50 p-3 rounded-lg"
                                            >
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
                        <h3 className="text-lg font-medium text-gray-500 mb-1">
                            No Immunization Records
                        </h3>
                        <p className="text-sm text-gray-400 mb-4">
                            No vaccination records found for this patient.
                        </p>
                        <Button
                            onClick={() => setShowAddDialog(true)}
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-2 mx-auto"
                        >
                            <Plus className="w-4 h-4" />
                            Add First Immunization
                        </Button>
                    </div>
                )}

                <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <h4 className="font-medium text-blue-900 mb-1">
                                Immunization Schedule
                            </h4>
                            <p className="text-sm text-blue-700">
                                Follow the Department of Health immunization schedule for children.
                                Ensure all vaccines are up to date and document any adverse
                                reactions.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Add Immunization Dialog */}
            <AddImmunizationDialog
                open={showAddDialog}
                onOpenChange={setShowAddDialog}
                patient={patient}
                onSuccess={handleImmunizationAdded}
            />

            {/* Edit Immunization Dialog */}
            <EditImmunizationDialog
                open={showEditDialog}
                onOpenChange={setShowEditDialog}
                patient={patient}
                vaccination={selectedVaccination}
                onSuccess={handleImmunizationUpdated}
            />

            {/* Delete Confirmation Dialog */}
            <ConfirmationDialog
                open={showDeleteDialog}
                onOpenChange={setShowDeleteDialog}
                onConfirm={handleConfirmDelete}
                title="Delete Immunization Record"
                description={
                    selectedVaccination
                        ? `Are you sure you want to delete the ${selectedVaccination.vaccine_name} vaccination record for ${patient.firstname} ${patient.lastname}? This action will mark the record as deleted but preserve it for compliance purposes.`
                        : ''
                }
                loading={deleteLoading}
                destructive={true}
            />
        </div>
    )
}

export default PatientImmunization
