import React, { useState, memo, useCallback, useEffect } from 'react'

// UI Components
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import ConfirmationDialog from '@/components/ui/ConfirmationDialog'
import { Trash2, AlertCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

// Helper
import { showToast } from '@/util/alertHelper'
import { deactivateFacility } from '@/api/admin/facility'
import { TooltipHelper } from '@/util/TooltipHelper'

const EditFacilityModal = memo(({ open, facility, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        facility_name: '',
        address: '',
        city: '',
        zip_code: '',
        contact_number: '',
        email: '',
        website: '',
        type: 'hospital',
        plan: 'standard',
        subscription_status: 'active',
    })

    const [isLoading, setIsLoading] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [errors, setErrors] = useState({})
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)

    useEffect(() => {
        if (facility) {
            const locationParts = facility.location
                ? facility.location.split(',').map((part) => part.trim())
                : []

            setFormData({
                facility_name: facility.name || '',
                address: locationParts[0] || '',
                city: locationParts[1] || '',
                zip_code: locationParts[2] || '',
                contact_number: facility.contact || '',
                email: facility.email || '',
                website: facility.website || '',
                type: facility.type || 'hospital',
                plan: facility.plan || 'basic',
                subscription_status: facility.status || 'active',
            })
            setErrors({})
        }
    }, [facility])

    const sanitizeInput = (val) => {
        if (typeof val !== 'string') return val
        return val.trim().replace(/[<>"'&]/g, (match) => {
            const entities = {
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#x27;',
                '&': '&amp;',
            }
            return entities[match] || match
        })
    }

    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        return emailRegex.test(email)
    }

    const validatePhone = (phone) => {
        const phoneRegex = /^[\d\s\-+()]+$/
        return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10
    }

    const validateWebsite = (website) => {
        if (!website || website === '') return true
        try {
            const url = new URL(website.startsWith('http') ? website : `https://${website}`)
            return ['http:', 'https:'].includes(url.protocol)
        } catch {
            return false
        }
    }

    const handleChange = useCallback(
        (field, value) => {
            const sanitizedValue = typeof value === 'string' ? sanitizeInput(value) : value
            setFormData((prev) => ({ ...prev, [field]: sanitizedValue }))

            if (errors[field]) {
                setErrors((prev) => ({ ...prev, [field]: null }))
            }
        },
        [errors]
    )

    const validateForm = useCallback(() => {
        const newErrors = {}

        if (!formData.facility_name.trim()) {
            newErrors.facility_name = 'Facility name is required'
        } else if (formData.facility_name.length < 2) {
            newErrors.facility_name = 'Facility name must be at least 2 characters'
        } else if (formData.facility_name.length > 100) {
            newErrors.facility_name = 'Facility name must be less than 100 characters'
        }

        if (!formData.email.trim()) {
            newErrors.email = 'Email is required'
        } else if (!validateEmail(formData.email)) {
            newErrors.email = 'Please enter a valid email address'
        }

        if (!formData.contact_number.trim()) {
            newErrors.contact_number = 'Contact number is required'
        } else if (!validatePhone(formData.contact_number)) {
            newErrors.contact_number = 'Please enter a valid phone number (minimum 10 digits)'
        }

        if (!formData.address.trim()) {
            newErrors.address = 'Address is required'
        } else if (formData.address.length < 5) {
            newErrors.address = 'Address must be at least 5 characters'
        }

        if (!formData.city.trim()) {
            newErrors.city = 'City is required'
        } else if (formData.city.length < 2) {
            newErrors.city = 'City name must be at least 2 characters'
        }

        if (formData.website && !validateWebsite(formData.website)) {
            newErrors.website = 'Please enter a valid website URL'
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }, [formData])

    const handleSubmit = useCallback(
        async (e) => {
            e.preventDefault()

            if (!validateForm()) return

            setIsLoading(true)

            try {
                const updatedFacility = {
                    id: facility.id,
                    facility_name: formData.facility_name,
                    address: formData.address,
                    city: formData.city,
                    zip_code: formData.zip_code,
                    contact_number: formData.contact_number,
                    email: formData.email,
                    website: formData.website,
                    type: formData.type,
                    plan: formData.plan,
                    subscription_status: formData.subscription_status,
                }

                await onSave(updatedFacility)
                showToast('success', 'Facility updated successfully!')
                onClose()
            } catch (error) {
                console.error('Error updating facility:', error)
                showToast('error', 'Failed to update facility. Please try again.')
            } finally {
                setIsLoading(false)
            }
        },
        [formData, facility, onSave, onClose, validateForm]
    )

    const handleDelete = useCallback(async () => {
        if (!facility?.id) {
            showToast('error', 'Facility ID not found')
            return
        }

        setIsDeleting(true)

        try {
            const response = await deactivateFacility(facility.id)

            if (response && response.status === 'success') {
                showToast('success', 'Facility deleted successfully!')
                setShowDeleteDialog(false)
                onClose()
                if (typeof window !== 'undefined') {
                    window.dispatchEvent(
                        new CustomEvent('facility-deleted', {
                            detail: { id: facility.id, name: facility.name },
                        })
                    )
                }
            } else {
                throw new Error(response?.message || 'Failed to delete facility')
            }
        } catch (error) {
            console.error('Error deleting facility:', error)
            showToast('error', error.message || 'Failed to delete facility. Please try again.')
        } finally {
            setIsDeleting(false)
        }
    }, [facility, onClose])

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'active':
                return 'bg-green-500'
            case 'inactive':
                return 'bg-gray-400'
            case 'pending':
                return 'bg-yellow-500'
            case 'suspended':
                return 'bg-red-500'
            default:
                return 'bg-muted'
        }
    }

    const getPlanColor = (plan) => {
        switch (plan?.toLowerCase()) {
            case 'basic':
                return 'bg-blue-100 text-blue-800 border-blue-200'
            case 'standard':
                return 'bg-green-100 text-green-800 border-green-200'
            case 'premium':
                return 'bg-purple-100 text-purple-800 border-purple-200'
            case 'enterprise':
                return 'bg-indigo-100 text-indigo-800 border-indigo-200'
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200'
        }
    }

    if (!open || !facility) return null

    const typeOptions = [
        { value: 'hospital', label: 'Hospital' },
        { value: 'clinic', label: 'Clinic' },
        { value: 'pharmacy', label: 'Pharmacy' },
    ]

    const planOptions = [
        { value: 'basic', label: 'Basic' },
        { value: 'standard', label: 'Standard' },
        { value: 'premium', label: 'Premium' },
        { value: 'enterprise', label: 'Enterprise' },
    ]

    const statusOptions = [
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
        { value: 'pending', label: 'Pending' },
        { value: 'suspended', label: 'Suspended' },
    ]

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent
                className="max-w-xl w-full min-h-[600px]"
                scrollable={true}
                showCloseButton={false}
            >
                <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4 mb-4 border-b border-b-gray-400 bg-white">
                    <div className="flex items-center space-x-3">
                        <DialogTitle className="text-xl font-semibold text-gray-900">
                            <div className="flex items-center gap-3 mb-1">
                                <span className="relative flex h-3 w-3">
                                    <span
                                        className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${getStatusColor(
                                            facility.status
                                        )}`}
                                    ></span>
                                    <span
                                        className={`relative inline-flex rounded-full h-3 w-3 ${getStatusColor(
                                            facility.status
                                        )}`}
                                    ></span>
                                </span>
                                Edit {facility.name}
                            </div>
                        </DialogTitle>

                        <Badge variant="outline" className={getPlanColor(facility.plan)}>
                            {facility.plan?.toUpperCase() || 'BASIC'}
                        </Badge>
                    </div>
                    <TooltipHelper content="Delete Facility">
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={isLoading || isDeleting}
                            onClick={() => setShowDeleteDialog(true)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                        >
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </TooltipHelper>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-8 mt-6">
                        {/* Basic Information */}
                        <div className="space-y-4">
                            <h3 className="text-base font-semibold text-gray-900 pb-2 border-b border-b-gray-200">
                                Basic Information
                            </h3>

                            <div className="space-y-1">
                                <Label htmlFor="facility_name" className="text-sm font-medium">
                                    Facility Name *
                                </Label>
                                <Input
                                    id="facility_name"
                                    value={formData.facility_name}
                                    onChange={(e) => handleChange('facility_name', e.target.value)}
                                    className={`w-full min-w-[350px] ${
                                        errors.facility_name
                                            ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                                            : ''
                                    }`}
                                    placeholder="Enter facility name"
                                    maxLength={100}
                                    required
                                />
                                {errors.facility_name && (
                                    <div className="flex items-center space-x-1 text-xs text-red-600">
                                        <AlertCircle className="w-3 h-3" />
                                        <span>{errors.facility_name}</span>
                                    </div>
                                )}
                            </div>

                            <div className="w-full flex justify-between space-y-1 gap-6 ">
                                <div className="w-full">
                                    <Label className="text-sm font-medium">Type *</Label>
                                    <Select
                                        value={formData.type}
                                        onValueChange={(value) => handleChange('type', value)}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select facility type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {typeOptions.map((option) => (
                                                <SelectItem key={option.value} value={option.value}>
                                                    {option.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="w-full">
                                    <Label className="text-sm font-medium">
                                        Subscription Plan *
                                    </Label>
                                    <Select
                                        value={formData.plan}
                                        onValueChange={(value) => handleChange('plan', value)}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select plan" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {planOptions.map((option) => (
                                                <SelectItem key={option.value} value={option.value}>
                                                    {option.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="w-full">
                                    <Label className="text-sm font-medium">Status *</Label>
                                    <Select
                                        value={formData.subscription_status}
                                        onValueChange={(value) =>
                                            handleChange('subscription_status', value)
                                        }
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {statusOptions.map((option) => (
                                                <SelectItem key={option.value} value={option.value}>
                                                    {option.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        {/* Contact Information */}
                        <div className="space-y-4">
                            <h3 className="text-base font-semibold text-gray-900 pb-2 border-b border-b-gray-200">
                                Contact Information
                            </h3>

                            <div className="space-y-1">
                                <Label htmlFor="email" className="text-sm font-medium">
                                    Email Address *
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => handleChange('email', e.target.value)}
                                    className={
                                        errors.email
                                            ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                                            : ''
                                    }
                                    placeholder="facility@example.com"
                                    required
                                />
                                {errors.email && (
                                    <div className="flex items-center space-x-1 text-xs text-red-600">
                                        <AlertCircle className="w-3 h-3" />
                                        <span>{errors.email}</span>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-1">
                                <Label htmlFor="contact_number" className="text-sm font-medium">
                                    Contact Number *
                                </Label>
                                <Input
                                    id="contact_number"
                                    value={formData.contact_number}
                                    onChange={(e) => handleChange('contact_number', e.target.value)}
                                    className={
                                        errors.contact_number
                                            ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                                            : ''
                                    }
                                    placeholder="(555) 123-4567"
                                    required
                                />
                                {errors.contact_number && (
                                    <div className="flex items-center space-x-1 text-xs text-red-600">
                                        <AlertCircle className="w-3 h-3" />
                                        <span>{errors.contact_number}</span>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-1">
                                <Label htmlFor="website" className="text-sm font-medium">
                                    Website URL
                                </Label>
                                <Input
                                    id="website"
                                    value={formData.website}
                                    onChange={(e) => handleChange('website', e.target.value)}
                                    className={
                                        errors.website
                                            ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                                            : ''
                                    }
                                    placeholder="https://www.example.com"
                                />
                                {errors.website && (
                                    <div className="flex items-center space-x-1 text-xs text-red-600">
                                        <AlertCircle className="w-3 h-3" />
                                        <span>{errors.website}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Location */}
                        <div className="space-y-4">
                            <h3 className="text-base font-semibold text-gray-900 pb-2 border-b border-b-gray-200">
                                Location
                            </h3>

                            <div className="space-y-1">
                                <Label htmlFor="address" className="text-sm font-medium">
                                    Street Address *
                                </Label>
                                <Input
                                    id="address"
                                    value={formData.address}
                                    onChange={(e) => handleChange('address', e.target.value)}
                                    className={
                                        errors.address
                                            ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                                            : ''
                                    }
                                    placeholder="123 Main Street"
                                    required
                                />
                                {errors.address && (
                                    <div className="flex items-center space-x-1 text-xs text-red-600">
                                        <AlertCircle className="w-3 h-3" />
                                        <span>{errors.address}</span>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-1">
                                <Label htmlFor="city" className="text-sm font-medium">
                                    City *
                                </Label>
                                <Input
                                    id="city"
                                    value={formData.city}
                                    onChange={(e) => handleChange('city', e.target.value)}
                                    className={
                                        errors.city
                                            ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                                            : ''
                                    }
                                    placeholder="New York"
                                    required
                                />
                                {errors.city && (
                                    <div className="flex items-center space-x-1 text-xs text-red-600">
                                        <AlertCircle className="w-3 h-3" />
                                        <span>{errors.city}</span>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-1">
                                <Label htmlFor="zip_code" className="text-sm font-medium">
                                    ZIP Code
                                </Label>
                                <Input
                                    id="zip_code"
                                    value={formData.zip_code}
                                    onChange={(e) => handleChange('zip_code', e.target.value)}
                                    className={
                                        errors.zip_code
                                            ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                                            : ''
                                    }
                                    placeholder="12345"
                                    maxLength={10}
                                />
                                {errors.zip_code && (
                                    <div className="flex items-center space-x-1 text-xs text-red-600">
                                        <AlertCircle className="w-3 h-3" />
                                        <span>{errors.zip_code}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end space-x-3 pt-6 ">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={isLoading || isDeleting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isLoading || isDeleting}
                            className="bg-primary hover:bg-primary/80"
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                    Saving...
                                </>
                            ) : (
                                'Save Changes'
                            )}
                        </Button>
                    </div>
                </form>

                <ConfirmationDialog
                    open={showDeleteDialog}
                    onOpenChange={setShowDeleteDialog}
                    title="Delete Facility"
                    description={
                        <>
                            Are you sure you want to delete <strong>"{facility.name}"</strong>?
                            <br />
                            <br />
                            This action will:
                            <ul className="list-disc list-inside mt-2 space-y-1 text-left">
                                <li>Deactivate the facility</li>
                                <li>Prevent new user assignments</li>
                                <li>Maintain data for auditing purposes</li>
                            </ul>
                            <br />
                            <span className="font-semibold text-red-600">
                                This action cannot be easily undone.
                            </span>
                        </>
                    }
                    confirmText="DELETE"
                    onConfirm={handleDelete}
                    requireTyping={true}
                    destructive={true}
                    loading={isDeleting}
                />
            </DialogContent>
        </Dialog>
    )
})

export default EditFacilityModal
