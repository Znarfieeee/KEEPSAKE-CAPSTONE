import React, { useState, useEffect } from 'react'
import { searchParents, assignExistingParent, createAndAssignParent } from '@/api/doctors/patient'
import { useAuth } from '@/context/auth'

// UI Components
import { X, UserPlus, Search, AlertCircle, CheckCircle, Copy, Check, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/Input'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'

// Helpers
import { showToast } from '@/util/alertHelper'

const InviteParentModal = ({ open, onClose, patient, onSuccess }) => {
    const { user } = useAuth()
    const [mode, setMode] = useState('create') // 'create' or 'search'
    const [loading, setLoading] = useState(false)
    const [searchLoading, setSearchLoading] = useState(false)
    const [searchResults, setSearchResults] = useState([])
    const [generatedPassword, setGeneratedPassword] = useState(null)
    const [copied, setCopied] = useState(false)

    // Form state
    const [formData, setFormData] = useState({
        email: '',
        firstname: '',
        lastname: '',
        phone_number: '',
        relationship: 'parent',
    })

    // Search state
    const [searchQuery, setSearchQuery] = useState('')

    // Reset state when modal opens/closes
    useEffect(() => {
        if (open) {
            setMode('create')
            setFormData({
                email: '',
                firstname: '',
                lastname: '',
                phone_number: '',
                relationship: 'parent',
            })
            setSearchQuery('')
            setSearchResults([])
            setGeneratedPassword(null)
            setCopied(false)
        }
    }, [open])

    const handleSearchParents = async () => {
        if (!searchQuery.trim()) {
            showToast('warning', 'Please enter an email or phone number to search')
            return
        }

        setSearchLoading(true)
        try {
            const isEmail = searchQuery.includes('@')
            const response = await searchParents(
                isEmail ? searchQuery : '',
                isEmail ? '' : searchQuery
            )

            if (response.status === 'success') {
                setSearchResults(response.data.parents || [])
                if (response.data.parents.length === 0) {
                    showToast('info', 'No parents found. Try creating a new parent account.')
                }
            }
        } catch (error) {
            showToast('error', error.message || 'Failed to search for parents')
            setSearchResults([])
        } finally {
            setSearchLoading(false)
        }
    }

    const handleAssignExisting = async (parentUser) => {
        setLoading(true)
        try {
            const response = await assignExistingParent(patient.patient_id || patient.id, {
                parent_user_id: parentUser.user_id,
                relationship: formData.relationship,
            })

            if (response.status === 'success') {
                showToast('success', response.message || 'Parent assigned successfully')
                if (onSuccess) onSuccess()
                onClose()
            }
        } catch (error) {
            showToast('error', error.message || 'Failed to assign parent')
        } finally {
            setLoading(false)
        }
    }

    const handleCreateAndAssign = async (e) => {
        e.preventDefault()

        // Validation
        if (
            !formData.email ||
            !formData.firstname ||
            !formData.lastname ||
            !formData.relationship
        ) {
            showToast('warning', 'Please fill in all required fields')
            return
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(formData.email)) {
            showToast('warning', 'Please enter a valid email address')
            return
        }

        setLoading(true)
        try {
            const response = await createAndAssignParent(patient.patient_id || patient.id, {
                ...formData,
                facility_id: user?.facility_id,
            })

            if (response.status === 'success') {
                setGeneratedPassword(
                    response.data.generated_password ||
                        response.data.default_password ||
                        'keepsake123'
                )
                showToast(
                    'success',
                    response.message || 'Parent account created and assigned successfully'
                )
                if (onSuccess) onSuccess()
                // Don't close immediately, show the password first
            }
        } catch (error) {
            console.error('Create parent error:', error)

            // Handle specific error cases
            if (error.status === 409) {
                // Conflict - user already exists
                const suggestion =
                    error.suggestion ||
                    'This email is already in use. Try using "Assign Existing Parent" instead.'
                showToast('warning', `${error.message}\n\n${suggestion}`)

                // If user already exists, switch to search mode
                if (
                    error.message.includes('already exists') ||
                    error.message.includes('already registered')
                ) {
                    setMode('search')
                    setSearchQuery(formData.email)
                }
            } else {
                showToast('error', error.message || 'Failed to create parent account')
            }
        } finally {
            setLoading(false)
        }
    }

    const handleCopyPassword = () => {
        if (generatedPassword) {
            navigator.clipboard.writeText(generatedPassword)
            setCopied(true)
            showToast('success', 'Password copied to clipboard')
            setTimeout(() => setCopied(false), 2000)
        }
    }

    const handleCloseAfterSuccess = () => {
        setGeneratedPassword(null)
        onClose()
    }

    if (!open) return null

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                            <UserPlus className="h-6 w-6 text-blue-600" />
                            Invite/Assign Parent or Guardian
                        </h2>
                        <p className="text-sm text-gray-600 mt-1">
                            For patient: {patient?.firstname} {patient?.lastname}
                        </p>
                    </div>
                </div>

                {/* Success Screen - Show generated password */}
                {generatedPassword && (
                    <div className="p-6">
                        <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6 mb-4">
                            <div className="flex items-start gap-3">
                                <CheckCircle className="h-6 w-6 text-green-600 mt-0.5 flex-shrink-0" />
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold text-green-900 mb-2">
                                        Parent Account Created Successfully!
                                    </h3>
                                    <p className="text-sm text-green-800 mb-4">
                                        A parent account has been created for {formData.firstname}{' '}
                                        {formData.lastname} and assigned to the patient.
                                    </p>

                                    <div className="bg-white rounded-md p-4 border border-green-200">
                                        <label className="text-sm font-medium text-gray-700 block mb-2">
                                            Login Credentials
                                        </label>
                                        <div className="space-y-3">
                                            <div>
                                                <span className="text-xs text-gray-600 uppercase tracking-wide block mb-1">
                                                    Email:
                                                </span>
                                                <div className="flex items-center gap-2">
                                                    <code className="flex-1 bg-gray-100 px-3 py-2 rounded border border-gray-300 font-mono text-sm">
                                                        {formData.email}
                                                    </code>
                                                </div>
                                            </div>
                                            <div>
                                                <span className="text-xs text-gray-600 uppercase tracking-wide block mb-1">
                                                    Default Password:
                                                </span>
                                                <div className="flex items-center gap-2">
                                                    <code className="flex-1 bg-gray-100 px-3 py-2 rounded border border-gray-300 font-mono text-sm font-bold">
                                                        {generatedPassword}
                                                    </code>
                                                    <Button onClick={handleCopyPassword} size="sm">
                                                        {copied ? (
                                                            <Check className="mr-2 h-4 w-4" />
                                                        ) : (
                                                            <Copy className="mr-2 h-4 w-4" />
                                                        )}
                                                        {copied ? 'Copied!' : 'Copy'}
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                                        <p className="text-sm text-yellow-800">
                                            <strong>Important:</strong> Share these credentials with
                                            the parent securely. They will be required to change the
                                            password on their first login.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <Button onClick={handleCloseAfterSuccess}>Done</Button>
                        </div>
                    </div>
                )}

                {/* Form Content */}
                {!generatedPassword && (
                    <>
                        {/* Mode Selector */}
                        <div className="px-6 pt-4">
                            <div className="flex gap-2 border-b">
                                <Button
                                    variant="ghost"
                                    onClick={() => setMode('create')}
                                    className={`rounded-none border-b-2 ${
                                        mode === 'create'
                                            ? 'border-blue-600 text-blue-600'
                                            : 'border-transparent text-gray-600 hover:text-gray-900'
                                    }`}
                                >
                                    Create New Parent
                                </Button>
                                <Button
                                    variant="ghost"
                                    onClick={() => setMode('search')}
                                    className={`rounded-none border-b-2 ${
                                        mode === 'search'
                                            ? 'border-blue-600 text-blue-600'
                                            : 'border-transparent text-gray-600 hover:text-gray-900'
                                    }`}
                                >
                                    Assign Existing Parent
                                </Button>
                            </div>
                        </div>

                        {/* Create New Parent Form */}
                        {mode === 'create' && (
                            <form onSubmit={handleCreateAndAssign} className="p-6 space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label className="required">
                                            First Name <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            type="text"
                                            value={formData.firstname}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    firstname: e.target.value,
                                                })
                                            }
                                            placeholder="Enter first name"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <Label>
                                            Last Name <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            type="text"
                                            value={formData.lastname}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    lastname: e.target.value,
                                                })
                                            }
                                            placeholder="Enter last name"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <Label>
                                        Email <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) =>
                                            setFormData({ ...formData, email: e.target.value })
                                        }
                                        placeholder="parent@example.com"
                                        required
                                    />
                                </div>

                                <div>
                                    <Label>Phone Number</Label>
                                    <Input
                                        type="tel"
                                        value={formData.phone_number}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                phone_number: e.target.value,
                                            })
                                        }
                                        placeholder="(123) 456-7890"
                                    />
                                </div>

                                <div>
                                    <Label>
                                        Relationship <span className="text-red-500">*</span>
                                    </Label>
                                    <Select
                                        value={formData.relationship}
                                        onValueChange={(value) =>
                                            setFormData({
                                                ...formData,
                                                relationship: value,
                                            })
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select relationship" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="parent">Parent</SelectItem>
                                            <SelectItem value="guardian">Guardian</SelectItem>
                                            <SelectItem value="caregiver">Caregiver</SelectItem>
                                            <SelectItem value="family_member">
                                                Family Member
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <div className="flex items-start gap-2">
                                        <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                                        <div className="text-sm text-blue-800">
                                            <p className="font-medium mb-1">
                                                Default Login Credentials
                                            </p>
                                            <p>
                                                The parent account will be created with the default
                                                password:{' '}
                                                <span className="font-mono font-bold">
                                                    keepsake123
                                                </span>
                                            </p>
                                            <p className="mt-1">
                                                The parent will be required to change this password
                                                on their first login.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        onClick={onClose}
                                        className="flex-1"
                                        disabled={loading}
                                    >
                                        Cancel
                                    </Button>
                                    <Button type="submit" className="flex-1" disabled={loading}>
                                        {loading && (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        )}
                                        {loading ? 'Creating...' : 'Create & Assign Parent'}
                                    </Button>
                                </div>
                            </form>
                        )}

                        {/* Search Existing Parent */}
                        {mode === 'search' && (
                            <div className="p-6 space-y-4">
                                <div>
                                    <Label>Search by Email or Phone Number</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            onKeyPress={(e) =>
                                                e.key === 'Enter' && handleSearchParents()
                                            }
                                            className="flex-1"
                                            placeholder="Enter email or phone number"
                                        />
                                        <Button
                                            onClick={handleSearchParents}
                                            disabled={searchLoading}
                                        >
                                            {searchLoading ? (
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            ) : (
                                                <Search className="mr-2 h-4 w-4" />
                                            )}
                                            {searchLoading ? 'Searching...' : 'Search'}
                                        </Button>
                                    </div>
                                </div>

                                <div>
                                    <Label>
                                        Relationship <span className="text-red-500">*</span>
                                    </Label>
                                    <Select
                                        value={formData.relationship}
                                        onValueChange={(value) =>
                                            setFormData({
                                                ...formData,
                                                relationship: value,
                                            })
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select relationship" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="parent">Parent</SelectItem>
                                            <SelectItem value="guardian">Guardian</SelectItem>
                                            <SelectItem value="caregiver">Caregiver</SelectItem>
                                            <SelectItem value="family_member">
                                                Family Member
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Search Results */}
                                {searchResults.length > 0 && (
                                    <div className="space-y-2">
                                        <h3 className="text-sm font-medium text-gray-700">
                                            Search Results
                                        </h3>
                                        <div className="space-y-2 max-h-64 overflow-y-auto">
                                            {searchResults.map((parent) => (
                                                <div
                                                    key={parent.user_id}
                                                    className="border border-gray-200 rounded-lg p-3 hover:border-blue-300 transition-colors"
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex-1">
                                                            <p className="font-medium text-gray-900">
                                                                {parent.firstname} {parent.lastname}
                                                            </p>
                                                            <p className="text-sm text-gray-600">
                                                                {parent.email}
                                                            </p>
                                                            {parent.phone_number && (
                                                                <p className="text-sm text-gray-600">
                                                                    {parent.phone_number}
                                                                </p>
                                                            )}
                                                            <span
                                                                className={`inline-block mt-1 px-2 py-0.5 text-xs rounded-full ${
                                                                    parent.is_active
                                                                        ? 'bg-green-100 text-green-800'
                                                                        : 'bg-red-100 text-red-800'
                                                                }`}
                                                            >
                                                                {parent.is_active
                                                                    ? 'Active'
                                                                    : 'Inactive'}
                                                            </span>
                                                        </div>
                                                        <Button
                                                            onClick={() =>
                                                                handleAssignExisting(parent)
                                                            }
                                                            size="sm"
                                                            disabled={loading || !parent.is_active}
                                                        >
                                                            {loading && (
                                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                            )}
                                                            {loading ? 'Assigning...' : 'Assign'}
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {searchQuery && searchResults.length === 0 && !searchLoading && (
                                    <div className="text-center py-8 text-gray-500">
                                        <p>No parents found with that email or phone number.</p>
                                        <p className="text-sm mt-1">
                                            Try the "Create New Parent" tab to create a new account.
                                        </p>
                                    </div>
                                )}

                                <div className="flex justify-end pt-4">
                                    <Button onClick={onClose} variant="destructive">
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}

export default InviteParentModal
