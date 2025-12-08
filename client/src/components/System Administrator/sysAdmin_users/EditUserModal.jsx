import React, { useState, useEffect, useCallback } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/Button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/label'
import { PhoneNumberInput } from '@/components/ui/phone-number'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { showToast } from '@/util/alertHelper'
import { cn } from '@/lib/utils'
import { User, Briefcase, Shield, Save, Ban } from 'lucide-react'

// Import API functions
import { updateUser, updateUserStatus } from '@/api/admin/users'
import { sanitizeObject } from '@/util/sanitize'

// Tab Item Component
const TabItem = ({ value, icon: Icon, children, className }) => (
    <TabsTrigger
        value={value}
        className={cn(
            'bg-muted overflow-hidden rounded-b-none border-x border-t border-gray-200 data-[state=active]:z-10 data-[state=active]:shadow-none',
            className
        )}
    >
        {Icon && <Icon className="-ms-0.5 me-1.5 opacity-60" size={16} aria-hidden="true" />}
        {children}
    </TabsTrigger>
)

const EditUserModal = ({ open, user, onClose }) => {
    // Form states
    const [basicForm, setBasicForm] = useState({})
    const [professionalForm, setProfessionalForm] = useState({})
    const [subscriptionForm, setSubscriptionForm] = useState({})

    // Modal states
    const [activeTab, setActiveTab] = useState('basic')
    const [loading, setLoading] = useState(false)
    const [statusLoading, setStatusLoading] = useState(false)

    // Initialize form data - optimized without unnecessary callbacks
    useEffect(() => {
        if (!user || !open) return

        const phoneNumber = user.contact && user.contact !== '—' ? user.contact : ''
        const roleValue = user.role?.toLowerCase().replace(' ', '_') || ''

        setBasicForm({
            email: user.email || '',
            firstname: user.firstname || '',
            lastname: user.lastname || '',
            phone_number: phoneNumber,
        })

        setProfessionalForm({
            role: roleValue,
            specialty: user.specialty === '—' ? '' : user.specialty || '',
            license_number: user.license_number === '—' ? '' : user.license_number || '',
        })

        setSubscriptionForm({
            is_subscribed: user.plan === 'Premium',
            subscription_expires: user.sub_exp || '',
        })
    }, [user?.id, open])

    // Helper to update form fields
    const updateForm = (setFormFn, field, value) =>
        setFormFn((prev) => ({ ...prev, [field]: value }))

    // Validate form
    const validateForm = () => {
        if (!basicForm.firstname?.trim()) {
            showToast('error', 'First name is required')
            setActiveTab('basic')
            return false
        }

        if (!basicForm.lastname?.trim()) {
            showToast('error', 'Last name is required')
            setActiveTab('basic')
            return false
        }

        if (!professionalForm.role) {
            showToast('error', 'Role is required')
            setActiveTab('professional')
            return false
        }

        // Specialty is only required for non-parent users
        if (professionalForm.role !== 'parent' && !professionalForm.specialty?.trim()) {
            showToast('error', 'Specialty is required for medical professionals')
            setActiveTab('professional')
            return false
        }

        return true
    }

    // Handle form submission
    const handleSubmit = async () => {
        if (!validateForm()) return

        try {
            setLoading(true)

            const updatePayload = sanitizeObject({
                firstname: basicForm.firstname.trim(),
                lastname: basicForm.lastname.trim(),
                phone_number: basicForm.phone_number || null,
                role: professionalForm.role,
                specialty: professionalForm.specialty?.trim() || null,
                license_number: professionalForm.license_number?.trim() || null,
                is_subscribed: subscriptionForm.is_subscribed,
                subscription_expires: subscriptionForm.subscription_expires || null,
            })

            const response = await updateUser(user.id, updatePayload)

            if (response.status === 'success') {
                showToast('success', 'User updated successfully')

                // Dispatch event for real-time updates with complete data
                if (typeof window !== 'undefined') {
                    const updatedUser = {
                        ...user,
                        ...updatePayload,
                        id: user.id,
                    }
                    window.dispatchEvent(
                        new CustomEvent('user-updated', {
                            detail: updatedUser,
                        })
                    )
                }

                onClose()
            } else {
                showToast('error', response.message || 'Failed to update user')
            }
        } catch (error) {
            console.error('Update error:', error)
            showToast('error', error.message || 'Failed to update user')
        } finally {
            setLoading(false)
        }
    }

    // Handle status toggle (disable/enable)
    const handleStatusToggle = async () => {
        const newStatus = user.status === 'active' ? 'inactive' : 'active'
        const action = newStatus === 'active' ? 'enable' : 'disable'

        if (!confirm(`Are you sure you want to ${action} this user?`)) {
            return
        }

        try {
            setStatusLoading(true)
            const response = await updateUserStatus(user.id, newStatus)

            if (response.status === 'success') {
                showToast('success', `User ${action}d successfully`)

                // Dispatch event for real-time updates
                if (typeof window !== 'undefined') {
                    window.dispatchEvent(
                        new CustomEvent('user-updated', {
                            detail: { ...user, status: newStatus },
                        })
                    )
                }

                onClose()
            } else {
                showToast('error', response.message || `Failed to ${action} user`)
            }
        } catch (error) {
            console.error('Status update error:', error)
            showToast('error', error.message || `Failed to ${action} user`)
        } finally {
            setStatusLoading(false)
        }
    }

    // Delete functionality commented out - use Disable/Enable User instead
    // const handleDelete = async () => {
    //     const confirmText = `${user.firstname} ${user.lastname}`
    //     const userInput = prompt(
    //         `Are you sure you want to delete this user? This action cannot be undone.\n\nType "${confirmText}" to confirm:`
    //     )

    //     if (userInput !== confirmText) {
    //         if (userInput !== null) {
    //             showToast('error', 'Confirmation text does not match')
    //         }
    //         return
    //     }

    //     try {
    //         setDeleteLoading(true)
    //         const response = await deleteUser(user.id)

    //         if (response.status === 'success') {
    //             showToast('success', 'User deleted successfully')

    //             // Dispatch event for real-time updates
    //             if (typeof window !== 'undefined') {
    //                 window.dispatchEvent(
    //                     new CustomEvent('user-deleted', {
    //                         detail: { id: user.id },
    //                     })
    //                 )
    //             }

    //             onClose()
    //         } else {
    //             showToast('error', response.message || 'Failed to delete user')
    //         }
    //     } catch (error) {
    //         console.error('Delete error:', error)
    //         showToast('error', error.message || 'Failed to delete user')
    //     } finally {
    //         setDeleteLoading(false)
    //     }
    // }

    // Handle modal close
    const handleClose = () => {
        if (!loading && !statusLoading) {
            onClose()
        }
    }

    if (!open) return null
    if (!user) return null

    // Define tabs
    const tabs = [
        {
            value: 'basic',
            label: 'BASIC INFO',
            icon: User,
            content: (
                <div className="space-y-4">
                    <div>
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                            id="email"
                            type="email"
                            value={basicForm.email}
                            readOnly
                            className="bg-gray-50 cursor-not-allowed"
                            placeholder="user@example.com"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                            Email cannot be changed for security reasons
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="firstname">First Name *</Label>
                            <Input
                                id="firstname"
                                value={basicForm.firstname}
                                onChange={(e) =>
                                    updateForm(setBasicForm, 'firstname', e.target.value)
                                }
                                placeholder="Juan"
                                autoComplete="given-name"
                            />
                        </div>
                        <div>
                            <Label htmlFor="lastname">Last Name *</Label>
                            <Input
                                id="lastname"
                                value={basicForm.lastname}
                                onChange={(e) =>
                                    updateForm(setBasicForm, 'lastname', e.target.value)
                                }
                                placeholder="De la Cruz"
                                autoComplete="family-name"
                            />
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="phone_number">Phone Number</Label>
                        <PhoneNumberInput
                            value={basicForm.phone_number}
                            onChange={(value) =>
                                updateForm(setBasicForm, 'phone_number', value || '')
                            }
                            placeholder="Enter phone number"
                        />
                    </div>
                </div>
            ),
        },
        {
            value: 'professional',
            label: 'PROFESSIONAL',
            icon: Briefcase,
            content: (
                <div className="space-y-4">
                    {professionalForm.role === 'parent' && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                            <p className="text-sm text-blue-800">
                                <strong>Parent User:</strong> Specialty and license fields are not
                                required for parent accounts.
                            </p>
                        </div>
                    )}

                    <div>
                        <Label htmlFor="role">Role *</Label>
                        <Select
                            value={professionalForm.role}
                            onValueChange={(value) => {
                                // Auto-clear specialty and license for parent users
                                if (value === 'parent') {
                                    setProfessionalForm((prev) => ({
                                        ...prev,
                                        role: value,
                                        specialty: '',
                                        license_number: '',
                                    }))
                                } else {
                                    updateForm(setProfessionalForm, 'role', value)
                                }
                            }}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select a role" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="doctor">Doctor</SelectItem>
                                <SelectItem value="nurse">Nurse</SelectItem>
                                <SelectItem value="staff">Staff</SelectItem>
                                <SelectItem value="facility_admin">Facility Admin</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="parent">Parent</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <Label htmlFor="specialty">
                            Specialty {professionalForm.role !== 'parent' && '*'}
                        </Label>
                        <Input
                            id="specialty"
                            value={professionalForm.specialty}
                            onChange={(e) =>
                                updateForm(setProfessionalForm, 'specialty', e.target.value)
                            }
                            placeholder={
                                professionalForm.role === 'parent'
                                    ? 'N/A for parent users'
                                    : 'e.g., Pediatrician'
                            }
                            disabled={professionalForm.role === 'parent'}
                        />
                        {professionalForm.role !== 'parent' && (
                            <p className="text-xs text-muted-foreground mt-1">
                                Required for medical professionals
                            </p>
                        )}
                    </div>

                    <div>
                        <Label htmlFor="license_number">License Number</Label>
                        <Input
                            id="license_number"
                            value={professionalForm.license_number}
                            onChange={(e) =>
                                updateForm(setProfessionalForm, 'license_number', e.target.value)
                            }
                            placeholder={
                                professionalForm.role === 'parent'
                                    ? 'N/A for parent users'
                                    : 'Professional license number'
                            }
                            disabled={professionalForm.role === 'parent'}
                        />
                        {professionalForm.role !== 'parent' && (
                            <p className="text-xs text-muted-foreground mt-1">
                                Required for doctors and nurses
                            </p>
                        )}
                    </div>
                </div>
            ),
        },
        {
            value: 'subscription',
            label: 'SUBSCRIPTION',
            icon: Shield,
            content: (
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                            <Label htmlFor="is_subscribed" className="text-base">
                                Premium Subscription
                            </Label>
                            <p className="text-sm text-muted-foreground">
                                Enable premium features for this user
                            </p>
                        </div>
                        <Switch
                            id="is_subscribed"
                            checked={subscriptionForm.is_subscribed}
                            onCheckedChange={(checked) =>
                                updateForm(setSubscriptionForm, 'is_subscribed', checked)
                            }
                        />
                    </div>

                    {subscriptionForm.is_subscribed && (
                        <div>
                            <Label htmlFor="subscription_expires">Subscription Expires</Label>
                            <Input
                                type="date"
                                id="subscription_expires"
                                value={subscriptionForm.subscription_expires}
                                onChange={(e) =>
                                    updateForm(
                                        setSubscriptionForm,
                                        'subscription_expires',
                                        e.target.value
                                    )
                                }
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                                Leave empty for no expiration
                            </p>
                        </div>
                    )}

                    <div className="p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-medium mb-2">Current Status</h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-muted-foreground">Status:</span>
                                <span
                                    className={cn(
                                        'ml-2 font-medium',
                                        user.status === 'active' ? 'text-green-600' : 'text-red-600'
                                    )}
                                >
                                    {user.status === 'active' ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                            <div>
                                <span className="text-muted-foreground">Plan:</span>
                                <span className="ml-2 font-medium">
                                    {subscriptionForm.is_subscribed ? 'Premium' : 'Free'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            ),
        },
    ]

    return (
        <Dialog open={open} onOpenChange={handleClose} modal>
            <DialogContent className="max-w-4xl max-h-[95vh]" showCloseButton={false}>
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold">
                        Edit User: {user.firstname} {user.lastname}
                    </DialogTitle>
                    <DialogDescription>
                        Update user information using the tabs below. Navigate between sections
                        freely.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-hidden mt-6">
                    <Tabs
                        value={activeTab}
                        onValueChange={setActiveTab}
                        className="w-full h-full flex flex-col"
                    >
                        <ScrollArea className="w-full">
                            <TabsList className="before:bg-border relative h-auto w-max gap-0.5 bg-transparent p-0 before:absolute before:inset-x-0 before:bottom-0 before:h-px">
                                {tabs.map((tab) => (
                                    <TabItem key={tab.value} value={tab.value} icon={tab.icon}>
                                        {tab.label}
                                    </TabItem>
                                ))}
                            </TabsList>
                            <ScrollBar orientation="horizontal" />
                        </ScrollArea>

                        <div className="flex-1 overflow-y-auto">
                            {tabs.map((tab) => (
                                <TabsContent key={tab.value} value={tab.value} className="mt-4">
                                    <div className="space-y-4">{tab.content}</div>
                                </TabsContent>
                            ))}
                        </div>
                    </Tabs>
                </div>

                <DialogFooter className="flex justify-between mt-8">
                    <div className="flex gap-2">
                        {/* <Button
                            variant="outline"
                            onClick={handleStatusToggle}
                            disabled={loading || statusLoading}
                            className={cn(
                                user.status === 'active'
                                    ? 'border-orange-500 text-orange-600 hover:bg-orange-50'
                                    : 'border-green-500 text-green-600 hover:bg-green-50'
                            )}
                        >
                            <Ban size={16} className="mr-2" />
                            {statusLoading
                                ? 'Processing...'
                                : user.status === 'active'
                                ? 'Disable User'
                                : 'Enable User'}
                        </Button> */}
                        {/* Delete functionality commented out - use Disable User instead */}
                        {/* <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={loading || statusLoading}
                        >
                            <Trash2 size={16} className="mr-2" />
                            {deleteLoading ? 'Deleting...' : 'Delete User'}
                        </Button> */}
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={handleClose}
                            disabled={loading || statusLoading}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={loading || statusLoading}
                            className={cn(
                                'bg-primary text-primary-foreground hover:bg-primary/90',
                                loading && 'opacity-50 cursor-not-allowed'
                            )}
                        >
                            <Save size={16} className="mr-2" />
                            {loading ? 'Updating...' : 'Update User'}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default React.memo(EditUserModal)
