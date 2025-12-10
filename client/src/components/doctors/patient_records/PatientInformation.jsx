import React, { useState } from 'react'

// UI Components
import { Button } from '@/components/ui/Button'
import { Users, Mail, Phone, Calendar, UserCheck, UserPlus } from 'lucide-react'
import InviteParentModal from './InviteParentModal'

const PatientInformation = ({ patient, onUpdate, readOnly = false }) => {
    const [showInviteModal, setShowInviteModal] = useState(false)
    const parentAccessUsers = patient.related_records?.parent_access || []

    const handleInviteSuccess = () => {
        // Refresh the patient data to show new parent
        if (onUpdate) {
            onUpdate()
        }
    }

    const getRelationshipIcon = (relationship) => {
        switch (relationship) {
            case 'parent':
                return <Users className="h-4 w-4 text-blue-600" />
            case 'guardian':
                return <UserCheck className="h-4 w-4 text-green-600" />
            case 'caregiver':
                return <Users className="h-4 w-4 text-purple-600" />
            case 'family_member':
                return <Users className="h-4 w-4 text-orange-600" />
            default:
                return <Users className="h-4 w-4 text-gray-600" />
        }
    }

    const getRelationshipColor = (relationship) => {
        switch (relationship) {
            case 'parent':
                return 'bg-blue-50 border-blue-200'
            case 'guardian':
                return 'bg-green-50 border-green-200'
            case 'caregiver':
                return 'bg-purple-50 border-purple-200'
            case 'family_member':
                return 'bg-orange-50 border-orange-200'
            default:
                return 'bg-gray-50 border-gray-200'
        }
    }

    return (
        <div className="bg-white rounded-b-lg shadow-sm p-6 mb-6">
            <div className="mb-10">
                <h2 className="text-lg font-semibold my-4">PATIENT'S INFORMATION</h2>
                <div className="grid grid-cols-3 gap-6">
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm text-gray-600">LAST NAME</label>
                            <p className="font-medium">{patient.lastname || '—'}</p>
                        </div>
                        <div>
                            <label className="text-sm text-gray-600">AGE</label>
                            <p className="font-medium">{`${patient.age}` || '—'}</p>
                        </div>
                        <div>
                            <label className="text-sm text-gray-600">MOTHER'S NAME</label>
                            <p className="font-medium">{patient.mother || 'N/A'}</p>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm text-gray-600">FIRST NAME</label>
                            <p className="font-medium">{patient.firstname || '—'}</p>
                        </div>
                        <div>
                            <label className="text-sm text-gray-600">BIRTHDATE</label>
                            <p className="font-medium">{patient.date_of_birth}</p>
                        </div>
                        <div>
                            <label className="text-sm text-gray-600">FATHER'S NAME</label>
                            <p className="font-medium">{patient.father || 'N/A'}</p>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm text-gray-600">MIDDLE NAME</label>
                            <p className="font-medium">{patient.middlename || 'N/A'}</p>
                        </div>
                        <div>
                            <label className="text-sm text-gray-600">SEX</label>
                            <p className="font-medium capitalize">{patient.sex || '—'}</p>
                        </div>
                    </div>
                </div>
            </div>

            {!readOnly && (
                <div className="mb-10">
                    <div className="flex items-center justify-between mb-4 mt-4">
                        <h2 className="text-lg font-semibold">AUTHORIZED CONTACTS & CAREGIVERS</h2>
                        <Button onClick={() => setShowInviteModal(true)} variant="ghost">
                            <UserPlus className="h-4 w-4" />
                            Invite/Assign Parent
                        </Button>
                    </div>
                    {parentAccessUsers && parentAccessUsers.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {parentAccessUsers.map((access, index) => {
                                const user = access.users || {}
                                return (
                                    <div
                                        key={access.access_id || `access-${index}`}
                                        className={`p-4 rounded-lg border-2 transition-all duration-200 hover:shadow-md ${getRelationshipColor(
                                            access.relationship
                                        )}`}
                                    >
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center space-x-2">
                                                {getRelationshipIcon(access.relationship)}
                                                <span className="text-sm font-semibold capitalize text-gray-700">
                                                    {access.relationship?.replace('_', ' ') ||
                                                        'Contact'}
                                                </span>
                                            </div>
                                            <div className="flex items-center text-xs text-gray-500">
                                                <Calendar className="h-3 w-3 mr-1" />
                                                {access.granted_at
                                                    ? new Date(access.granted_at).toLocaleDateString()
                                                    : 'N/A'}
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <div>
                                                <label className="text-xs text-gray-600 uppercase tracking-wide">
                                                    Full Name
                                                </label>
                                                <p className="font-medium text-gray-900">
                                                    {user.firstname && user.lastname
                                                        ? `${user.firstname} ${user.lastname}`
                                                        : '—'}
                                                </p>
                                            </div>

                                            <div>
                                                <div className="flex items-center space-x-1">
                                                    <Mail className="h-3 w-3 text-gray-500" />
                                                    <label className="text-xs text-gray-600 uppercase tracking-wide">
                                                        Email
                                                    </label>
                                                </div>
                                                <p className="font-medium text-gray-900 break-all">
                                                    {user.email || '—'}
                                                </p>
                                            </div>

                                            {user.phone_number && (
                                                <div>
                                                    <div className="flex items-center space-x-1">
                                                        <Phone className="h-3 w-3 text-gray-500" />
                                                        <label className="text-xs text-gray-600 uppercase tracking-wide">
                                                            Phone
                                                        </label>
                                                    </div>
                                                    <p className="font-medium text-gray-900">
                                                        {user.phone_number}
                                                    </p>
                                                </div>
                                            )}

                                            <div className="pt-2 border-t border-gray-200">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs text-gray-500">
                                                        Access Status
                                                    </span>
                                                    <span
                                                        className={`text-xs font-semibold px-2 py-1 rounded-full ${
                                                            access.is_active
                                                                ? 'bg-green-100 text-green-800'
                                                                : 'bg-red-100 text-red-800'
                                                        }`}
                                                    >
                                                        {access.is_active ? 'Active' : 'Inactive'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-500 text-sm">
                                No authorized contacts or caregivers found
                            </p>
                            <p className="text-gray-400 text-xs mt-1">
                                Contact information will appear here when parent/guardian access is
                                granted
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* Invite Parent Modal */}
            {!readOnly && (
                <InviteParentModal
                    open={showInviteModal}
                    onClose={() => setShowInviteModal(false)}
                    patient={patient}
                    onSuccess={handleInviteSuccess}
                />
            )}
        </div>
    )
}

export default PatientInformation
