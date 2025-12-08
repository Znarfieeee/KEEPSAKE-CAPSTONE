import React, { useState, useEffect } from 'react'
import { X, UserPlus, Search } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import InviteParentModal from './InviteParentModal'

const InviteParentWithPatientSelectionModal = ({ open, onClose, patients, onSuccess }) => {
    const [selectedPatient, setSelectedPatient] = useState(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [filteredPatients, setFilteredPatients] = useState([])

    // Reset state when modal opens/closes
    useEffect(() => {
        if (open) {
            setSelectedPatient(null)
            setSearchQuery('')
            setFilteredPatients(patients || [])
        }
    }, [open, patients])

    // Filter patients based on search query
    useEffect(() => {
        if (!searchQuery.trim()) {
            setFilteredPatients(patients || [])
        } else {
            const query = searchQuery.toLowerCase()
            const filtered = (patients || []).filter((patient) => {
                const fullName = `${patient.firstname} ${patient.lastname}`.toLowerCase()
                return (
                    fullName.includes(query) ||
                    patient.firstname?.toLowerCase().includes(query) ||
                    patient.lastname?.toLowerCase().includes(query)
                )
            })
            setFilteredPatients(filtered)
        }
    }, [searchQuery, patients])

    const handlePatientSelect = (patient) => {
        setSelectedPatient(patient)
    }

    const handleBackToPatientList = () => {
        setSelectedPatient(null)
    }

    const handleInviteSuccess = () => {
        if (onSuccess) onSuccess()
        // Go back to patient list after successful invite
        setSelectedPatient(null)
    }

    const handleCloseAll = () => {
        setSelectedPatient(null)
        onClose()
    }

    if (!open) return null

    // If patient selected, show InviteParentModal
    if (selectedPatient) {
        return (
            <InviteParentModal
                open={true}
                onClose={handleBackToPatientList}
                patient={selectedPatient}
                onSuccess={handleInviteSuccess}
            />
        )
    }

    // Otherwise, show patient selection
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                            <UserPlus className="h-6 w-6 text-blue-600" />
                            Select Patient to Assign Parent/Guardian
                        </h2>
                        <p className="text-sm text-gray-600 mt-1">
                            Choose a patient to assign a parent or guardian to
                        </p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={handleCloseAll}>
                        <X className="h-6 w-6" />
                    </Button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    {/* Search Bar */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Search Patient
                        </label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <Input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                                placeholder="Search by name..."
                            />
                        </div>
                    </div>

                    {/* Patient List */}
                    {filteredPatients.length > 0 ? (
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                            <h3 className="text-sm font-medium text-gray-700">
                                {filteredPatients.length} Patient
                                {filteredPatients.length !== 1 ? 's' : ''} Found
                            </h3>
                            {filteredPatients.map((patient) => (
                                <div
                                    key={patient.id || patient.patient_id}
                                    className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors cursor-pointer"
                                    onClick={() => handlePatientSelect(patient)}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <p className="font-medium text-gray-900">
                                                {patient.firstname} {patient.lastname}
                                            </p>
                                            <div className="flex items-center gap-4 mt-1">
                                                {patient.age && (
                                                    <span className="text-sm text-gray-600">
                                                        Age: {patient.age} {patient.ageUnit || ''}
                                                    </span>
                                                )}
                                                {patient.sex && (
                                                    <span className="text-sm text-gray-600 capitalize">
                                                        Sex: {patient.sex}
                                                    </span>
                                                )}
                                            </div>
                                            {patient.birthdate && (
                                                <span className="text-xs text-gray-500 mt-1 block">
                                                    DOB:{' '}
                                                    {new Date(
                                                        patient.birthdate
                                                    ).toLocaleDateString()}
                                                </span>
                                            )}
                                        </div>
                                        <Button
                                            size="sm"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                handlePatientSelect(patient)
                                            }}
                                        >
                                            Select
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-gray-500">
                            <p>No patients found matching "{searchQuery}"</p>
                            <p className="text-sm mt-1">Try a different search term</p>
                        </div>
                    )}

                    {/* Footer */}
                    <div className="flex justify-end pt-4 border-t">
                        <Button variant="outline" onClick={handleCloseAll}>
                            Cancel
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default InviteParentWithPatientSelectionModal
