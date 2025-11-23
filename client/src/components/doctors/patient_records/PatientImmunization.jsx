import React, { useState, useMemo } from 'react'
import {
    Calendar,
    Syringe,
    AlertTriangle,
    CheckCircle,
    Plus,
    Edit,
    Trash2,
    Clock,
    ChevronDown,
    ChevronUp,
    LayoutGrid,
    List,
    Info,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import AddImmunizationDialog from './AddImmunizationDialog'
import EditImmunizationDialog from './EditImmunizationDialog'
import ConfirmationDialog from '@/components/ui/ConfirmationDialog'
import { deleteVaccination } from '@/api/doctor/vaccinations'
import { showToast } from '@/util/alertHelper'
import VaccineDoseProgress, { VaccineStatusBadge } from './VaccineDoseProgress'
import ImmunizationScheduleView from './ImmunizationScheduleView'
import { getVaccinationSummary, getVaccineInfo } from '@/constants/vaccineData'
import { cn } from '@/lib/utils'

const PatientImmunization = ({ patient, onUpdate, readOnly = false }) => {
    const [vaccinations, setVaccinations] = useState(patient?.related_records?.vaccinations || [])
    const [showAddDialog, setShowAddDialog] = useState(false)
    const [showEditDialog, setShowEditDialog] = useState(false)
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    const [selectedVaccination, setSelectedVaccination] = useState(null)
    const [deleteLoading, setDeleteLoading] = useState(false)
    const [viewMode, setViewMode] = useState('table') // 'table', 'cards', 'schedule'
    const [expandedCard, setExpandedCard] = useState(null)

    // Get vaccination summary for dose tracking
    const vaccinationSummary = useMemo(
        () => getVaccinationSummary(vaccinations),
        [vaccinations]
    )

    // Calculate statistics
    const stats = useMemo(() => {
        const total = vaccinationSummary.length
        const complete = vaccinationSummary.filter((v) => v.status === 'complete').length
        const overdue = vaccinationSummary.filter((v) => v.status === 'overdue').length
        const inProgress = vaccinationSummary.filter((v) => v.status === 'in_progress').length
        return { total, complete, overdue, inProgress }
    }, [vaccinationSummary])

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

    // Get dose info for a vaccination
    const getDoseInfo = (vaccination) => {
        const vaccineInfo = getVaccineInfo(vaccination.vaccine_name)
        if (!vaccineInfo) return null

        // Count doses of this vaccine
        const dosesGiven = vaccinations.filter(
            (v) => v.vaccine_name === vaccination.vaccine_name && !v.is_deleted
        ).length

        return {
            current: vaccination.dose_number || 1,
            total: vaccineInfo.totalDoses,
            given: dosesGiven,
        }
    }

    // Handle successful immunization addition
    const handleImmunizationAdded = (newVaccination) => {
        setVaccinations((prev) => [newVaccination, ...prev])
        if (onUpdate) onUpdate()
        window.dispatchEvent(
            new CustomEvent('vaccination-created', { detail: newVaccination })
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
        if (onUpdate) onUpdate()
        window.dispatchEvent(
            new CustomEvent('vaccination-updated', { detail: updatedVaccination })
        )
    }

    // Handle delete button click
    const handleDeleteClick = (vaccination) => {
        setSelectedVaccination(vaccination)
        setShowDeleteDialog(true)
    }

    // Handle confirmed deletion
    const handleConfirmDelete = async () => {
        if (!selectedVaccination) return

        setDeleteLoading(true)
        try {
            const response = await deleteVaccination(patient.patient_id, selectedVaccination.vax_id)

            if (response.status === 'success') {
                showToast('success', 'Immunization record deleted successfully')
                setVaccinations((prev) =>
                    prev.filter((v) => v.vax_id !== selectedVaccination.vax_id)
                )
                if (onUpdate) onUpdate()
                window.dispatchEvent(
                    new CustomEvent('vaccination-deleted', {
                        detail: { vax_id: selectedVaccination.vax_id },
                    })
                )
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

    // Mobile Card View
    const renderMobileCard = (vaccination) => {
        const doseInfo = getDoseInfo(vaccination)
        const isExpanded = expandedCard === vaccination.vax_id

        return (
            <div
                key={vaccination.vax_id}
                className={cn(
                    'border rounded-lg overflow-hidden transition-all',
                    vaccination.next_dose_due && new Date(vaccination.next_dose_due) < new Date()
                        ? 'border-red-200 bg-red-50'
                        : 'border-gray-200 bg-white'
                )}
            >
                {/* Card Header - Always visible */}
                <button
                    className="w-full px-4 py-3 flex items-center justify-between text-left"
                    onClick={() => setExpandedCard(isExpanded ? null : vaccination.vax_id)}
                >
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <Syringe className="w-4 h-4 text-blue-600 flex-shrink-0" />
                            <h4 className="font-medium text-gray-900 truncate">
                                {vaccination.vaccine_name || '—'}
                            </h4>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                            {doseInfo && (
                                <VaccineDoseProgress
                                    vaccineName={vaccination.vaccine_name}
                                    completedDoses={doseInfo.given}
                                    totalDoses={doseInfo.total}
                                    compact
                                />
                            )}
                            <span className="text-sm text-gray-500">
                                {formatDate(vaccination.administered_date)}
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 ml-2">
                        {getStatusIcon(vaccination.next_dose_due)}
                        {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-gray-400" />
                        ) : (
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                        )}
                    </div>
                </button>

                {/* Expanded Content */}
                {isExpanded && (
                    <div className="px-4 pb-4 pt-2 border-t border-gray-100 space-y-3">
                        <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                                <span className="text-gray-500">Dose</span>
                                <p className="font-medium">
                                    {vaccination.dose_number ? `Dose ${vaccination.dose_number}` : '—'}
                                    {doseInfo && ` of ${doseInfo.total}`}
                                </p>
                            </div>
                            <div>
                                <span className="text-gray-500">Administered By</span>
                                <p className="font-medium">{vaccination.administered_by_name || '—'}</p>
                            </div>
                            <div>
                                <span className="text-gray-500">Site</span>
                                <p className="font-medium">{vaccination.administration_site || vaccination.body_site || '—'}</p>
                            </div>
                            <div>
                                <span className="text-gray-500">Next Due</span>
                                <p className="font-medium">{formatDate(vaccination.next_dose_due)}</p>
                            </div>
                            {vaccination.manufacturer && (
                                <div className="col-span-2">
                                    <span className="text-gray-500">Manufacturer</span>
                                    <p className="font-medium">
                                        {vaccination.manufacturer}
                                        {vaccination.lot_number && ` (Lot: ${vaccination.lot_number})`}
                                    </p>
                                </div>
                            )}
                            {vaccination.route_of_administration && (
                                <div>
                                    <span className="text-gray-500">Route</span>
                                    <p className="font-medium">{vaccination.route_of_administration}</p>
                                </div>
                            )}
                        </div>

                        {vaccination.notes && (
                            <div className="text-sm">
                                <span className="text-gray-500">Notes</span>
                                <p className="text-gray-700 mt-1">{vaccination.notes}</p>
                            </div>
                        )}

                        {vaccination.adverse_reaction && (
                            <div className="p-2 bg-red-100 rounded-lg text-sm">
                                <span className="text-red-800 font-medium">Adverse Reaction Reported</span>
                                {vaccination.adverse_reaction_details && (
                                    <p className="text-red-700 mt-1">{vaccination.adverse_reaction_details}</p>
                                )}
                            </div>
                        )}

                        {/* Status */}
                        <div className="flex items-center gap-2 pt-2">
                            {getStatusIcon(vaccination.next_dose_due)}
                            <span className="text-sm font-medium">
                                {getStatusText(vaccination.next_dose_due)}
                            </span>
                        </div>

                        {/* Actions */}
                        {!readOnly && (
                            <div className="flex gap-2 pt-2 border-t border-gray-100">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleEdit(vaccination)}
                                    className="flex-1"
                                >
                                    <Edit className="w-4 h-4 mr-1" />
                                    Edit
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleDeleteClick(vaccination)}
                                    className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                    <Trash2 className="w-4 h-4 mr-1" />
                                    Delete
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        )
    }

    // Desktop Table View
    const renderTable = () => (
        <div className="overflow-x-auto">
            <table className="w-full border border-gray-200 rounded-lg">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                            VACCINE
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                            DOSE PROGRESS
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                            DATE GIVEN
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 hidden lg:table-cell">
                            ADMINISTERED BY
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 hidden md:table-cell">
                            SITE / ROUTE
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                            NEXT DUE
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                            STATUS
                        </th>
                        {!readOnly && (
                            <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                                ACTIONS
                            </th>
                        )}
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                    {vaccinations.map((vaccination) => {
                        const doseInfo = getDoseInfo(vaccination)
                        return (
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
                                <td className="px-4 py-3">
                                    {doseInfo ? (
                                        <VaccineDoseProgress
                                            vaccineName={vaccination.vaccine_name}
                                            completedDoses={doseInfo.given}
                                            totalDoses={doseInfo.total}
                                            compact
                                        />
                                    ) : (
                                        <span className="text-sm text-gray-500">
                                            {vaccination.dose_number ? `Dose ${vaccination.dose_number}` : '—'}
                                        </span>
                                    )}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-900">
                                    <div className="flex items-center gap-1">
                                        <Calendar className="w-3 h-3 text-gray-400" />
                                        {formatDate(vaccination.administered_date)}
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-900 hidden lg:table-cell">
                                    {vaccination.administered_by_name || '—'}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-900 hidden md:table-cell">
                                    <div>
                                        {vaccination.body_site || vaccination.administration_site || '—'}
                                        {vaccination.route_of_administration && (
                                            <p className="text-xs text-gray-500">
                                                {vaccination.route_of_administration}
                                            </p>
                                        )}
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-900">
                                    {formatDate(vaccination.next_dose_due)}
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-2">
                                        {getStatusIcon(vaccination.next_dose_due)}
                                        <span className="text-sm hidden xl:inline">
                                            {getStatusText(vaccination.next_dose_due)}
                                        </span>
                                    </div>
                                </td>
                                {!readOnly && (
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
                                                onClick={() => handleDeleteClick(vaccination)}
                                                className="h-8 w-8 p-0"
                                                title="Delete vaccination"
                                            >
                                                <Trash2 className="w-4 h-4 text-red-600" />
                                            </Button>
                                        </div>
                                    </td>
                                )}
                            </tr>
                        )
                    })}
                </tbody>
            </table>
        </div>
    )

    return (
        <div className="bg-white rounded-b-lg shadow-sm p-4 sm:p-6 mb-6">
            <div className="mb-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-2">
                        <Syringe className="w-5 h-5 text-blue-600" />
                        <h2 className="text-lg font-semibold">IMMUNIZATION RECORDS</h2>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {/* View Toggle */}
                        <div className="flex border rounded-lg overflow-hidden">
                            <button
                                className={cn(
                                    'px-3 py-1.5 text-sm flex items-center gap-1',
                                    viewMode === 'table'
                                        ? 'bg-blue-50 text-blue-600'
                                        : 'bg-white text-gray-600 hover:bg-gray-50'
                                )}
                                onClick={() => setViewMode('table')}
                                title="Table View"
                            >
                                <List className="w-4 h-4" />
                                <span className="hidden sm:inline">Table</span>
                            </button>
                            <button
                                className={cn(
                                    'px-3 py-1.5 text-sm flex items-center gap-1 border-l',
                                    viewMode === 'cards'
                                        ? 'bg-blue-50 text-blue-600'
                                        : 'bg-white text-gray-600 hover:bg-gray-50'
                                )}
                                onClick={() => setViewMode('cards')}
                                title="Card View"
                            >
                                <LayoutGrid className="w-4 h-4" />
                                <span className="hidden sm:inline">Cards</span>
                            </button>
                            <button
                                className={cn(
                                    'px-3 py-1.5 text-sm flex items-center gap-1 border-l',
                                    viewMode === 'schedule'
                                        ? 'bg-blue-50 text-blue-600'
                                        : 'bg-white text-gray-600 hover:bg-gray-50'
                                )}
                                onClick={() => setViewMode('schedule')}
                                title="Schedule View"
                            >
                                <Calendar className="w-4 h-4" />
                                <span className="hidden sm:inline">Schedule</span>
                            </button>
                        </div>

                        {!readOnly && (
                            <Button
                                onClick={() => setShowAddDialog(true)}
                                className="flex items-center gap-2"
                            >
                                <Plus className="w-4 h-4" />
                                <span className="hidden sm:inline">Add Immunization</span>
                                <span className="sm:hidden">Add</span>
                            </Button>
                        )}
                    </div>
                </div>

                {/* Statistics Bar */}
                {vaccinations.length > 0 && viewMode !== 'schedule' && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                        <div className="bg-blue-50 rounded-lg p-3">
                            <p className="text-xs sm:text-sm text-blue-600">Total Records</p>
                            <p className="text-xl sm:text-2xl font-bold text-blue-900">
                                {vaccinations.length}
                            </p>
                        </div>
                        <div className="bg-green-50 rounded-lg p-3">
                            <p className="text-xs sm:text-sm text-green-600">Vaccines Complete</p>
                            <p className="text-xl sm:text-2xl font-bold text-green-900">
                                {stats.complete}
                            </p>
                        </div>
                        <div className="bg-yellow-50 rounded-lg p-3">
                            <p className="text-xs sm:text-sm text-yellow-600">In Progress</p>
                            <p className="text-xl sm:text-2xl font-bold text-yellow-900">
                                {stats.inProgress}
                            </p>
                        </div>
                        {stats.overdue > 0 && (
                            <div className="bg-red-50 rounded-lg p-3">
                                <p className="text-xs sm:text-sm text-red-600">Overdue</p>
                                <p className="text-xl sm:text-2xl font-bold text-red-900">
                                    {stats.overdue}
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* Content based on view mode */}
                {vaccinations.length > 0 ? (
                    <>
                        {viewMode === 'schedule' ? (
                            <ImmunizationScheduleView
                                patient={patient}
                                vaccinations={vaccinations}
                                onAddVaccine={() => setShowAddDialog(true)}
                            />
                        ) : viewMode === 'cards' ? (
                            /* Mobile/Card View */
                            <div className="space-y-3">
                                {vaccinations.map((vaccination) => renderMobileCard(vaccination))}
                            </div>
                        ) : (
                            /* Table View - Hidden on mobile, shown on tablet+ */
                            <>
                                <div className="hidden sm:block">{renderTable()}</div>
                                <div className="sm:hidden space-y-3">
                                    {vaccinations.map((vaccination) => renderMobileCard(vaccination))}
                                </div>
                            </>
                        )}

                        {/* Notes Section */}
                        {viewMode !== 'schedule' && vaccinations.some((v) => v.notes) && (
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
                    </>
                ) : (
                    <div className="text-center py-8">
                        <Syringe className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <h3 className="text-lg font-medium text-gray-500 mb-1">
                            No Immunization Records
                        </h3>
                        <p className="text-sm text-gray-400 mb-4">
                            No vaccination records found for this patient.
                        </p>
                        {!readOnly && (
                            <Button
                                onClick={() => setShowAddDialog(true)}
                                variant="outline"
                                size="sm"
                                className="flex items-center gap-2 mx-auto"
                            >
                                <Plus className="w-4 h-4" />
                                Add First Immunization
                            </Button>
                        )}
                    </div>
                )}

                {/* Info Panel */}
                <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-start gap-3">
                        <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <h4 className="font-medium text-blue-900 mb-1">
                                Immunization Schedule
                            </h4>
                            <p className="text-sm text-blue-700">
                                Follow the Department of Health immunization schedule for children.
                                Ensure all vaccines are up to date and document any adverse reactions.
                                Use the Schedule view to see the complete WHO/DOH vaccination timeline.
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
                existingVaccinations={vaccinations}
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
