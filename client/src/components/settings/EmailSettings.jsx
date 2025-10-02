import { useState } from 'react'
import { useAuth } from '../../context/auth'
import { updateEmail } from '../../api/settings'
import { showToast } from '../../util/alertHelper'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Button } from '../ui/Button'
import { Loader2, Mail, AlertCircle, Eye, EyeOff } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '../ui/dialog'

const EmailSettings = () => {
    const { user, signOut } = useAuth()
    const [loading, setLoading] = useState(false)
    const [showConfirmDialog, setShowConfirmDialog] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [newEmail, setNewEmail] = useState('')
    const [password, setPassword] = useState('')

    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        return emailRegex.test(email)
    }

    const handleOpenDialog = () => {
        // Validation
        if (!newEmail || !password) {
            showToast('error', 'All fields are required')
            return
        }

        if (!validateEmail(newEmail)) {
            showToast('error', 'Please enter a valid email address')
            return
        }

        if (newEmail === user?.email) {
            showToast('error', 'New email must be different from current email')
            return
        }

        setShowConfirmDialog(true)
    }

    const handleConfirmUpdate = async () => {
        try {
            setLoading(true)
            const response = await updateEmail({
                new_email: newEmail,
                password: password,
            })

            if (response.status === 'success') {
                showToast('success', 'Email updated successfully. Please log in again.')
                setShowConfirmDialog(false)

                // Sign out user after email change
                setTimeout(() => {
                    signOut()
                }, 2000)
            }
        } catch (error) {
            showToast('error', error.message || 'Failed to update email')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-2xl space-y-6">
            {/* Warning Alert */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div className="flex-1">
                        <p className="text-sm font-medium text-yellow-900">Important Notice</p>
                        <p className="text-sm text-yellow-700 mt-1">
                            Changing your email will require you to log in again with your new email
                            address. Make sure you have access to the new email address before
                            proceeding.
                        </p>
                    </div>
                </div>
            </div>

            {/* Update Email Form */}
            <div className="space-y-6">
                {/* Current Email (Read-only) */}
                <div className="space-y-2">
                    <Label htmlFor="current_email">Current Email Address</Label>
                    <Input
                        id="current_email"
                        value={user?.email || ''}
                        readOnly
                        className="bg-gray-50"
                    />
                </div>

                {/* New Email */}
                <div className="space-y-2">
                    <Label htmlFor="new_email">
                        New Email Address <span className="text-red-500">*</span>
                    </Label>
                    <Input
                        id="new_email"
                        type="email"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        placeholder="Enter your new email address"
                    />
                </div>

                {/* Password */}
                <div className="space-y-2">
                    <Label htmlFor="password">
                        Current Password <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                        <Input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter your current password"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                            {showPassword ? (
                                <EyeOff className="h-4 w-4" />
                            ) : (
                                <Eye className="h-4 w-4" />
                            )}
                        </button>
                    </div>
                    <p className="text-sm text-gray-500">
                        For security, please enter your password to confirm this change
                    </p>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end pt-6 border-t">
                    <Button
                        onClick={handleOpenDialog}
                        disabled={loading || !newEmail || !password}
                        className="min-w-[140px]"
                    >
                        Update Email
                    </Button>
                </div>
            </div>

            {/* Confirmation Dialog */}
            <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                <DialogContent className="w-xl" showCloseButton={false}>
                    <DialogHeader>
                        <DialogTitle>Confirm Email Change</DialogTitle>
                        <DialogDescription className="space-y-3 pt-4">
                            <p className="font-semibold text-gray-900">
                                Are you sure you want to change your email address?
                            </p>
                            <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Current:</span>
                                    <span className="font-medium text-gray-900">{user?.email}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">New:</span>
                                    <span className="font-medium text-blue-600">{newEmail}</span>
                                </div>
                            </div>
                            <p className="text-gray-700">
                                You will be logged out and need to sign in again with your new email
                                address.
                            </p>
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 justify-between mt-12">
                        <Button
                            onClick={() => setShowConfirmDialog(false)}
                            variant="destructive"
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button onClick={handleConfirmUpdate} disabled={loading}>
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Updating...
                                </>
                            ) : (
                                'Confirm Change'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default EmailSettings
