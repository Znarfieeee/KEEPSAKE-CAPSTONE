import { useState } from 'react'
import { useAuth } from '../../context/auth'
import { requestEmailChange, verifyEmailChange } from '../../api/settings'
import { showToast } from '../../util/alertHelper'
import { Input } from '../ui/Input'
import { Label } from '../ui/label'
import { Button } from '../ui/Button'
import { Loader2, Mail, AlertCircle, ShieldCheck } from 'lucide-react'
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
    const [showVerificationDialog, setShowVerificationDialog] = useState(false)
    const [newEmail, setNewEmail] = useState('')
    const [verificationCode, setVerificationCode] = useState('')
    const [codeSent, setCodeSent] = useState(false)

    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        return emailRegex.test(email)
    }

    const handleRequestEmailChange = async () => {
        // Validation
        if (!newEmail) {
            showToast('error', 'Please enter a new email address')
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

        try {
            setLoading(true)
            const response = await requestEmailChange(newEmail)

            if (response.status === 'success') {
                setCodeSent(true)
                setShowVerificationDialog(true)
                showToast('success', response.message || 'Verification code sent to your email')
            }
        } catch (error) {
            showToast('error', error.message || 'Failed to send verification code')
        } finally {
            setLoading(false)
        }
    }

    const handleVerifyEmailChange = async () => {
        if (!verificationCode || verificationCode.length !== 6) {
            showToast('error', 'Please enter a valid 6-digit code')
            return
        }

        try {
            setLoading(true)
            const response = await verifyEmailChange(verificationCode)

            if (response.status === 'success') {
                showToast(
                    'success',
                    'Email updated successfully. Please log in again with your new email.'
                )
                setShowVerificationDialog(false)
                setNewEmail('')
                setVerificationCode('')
                setCodeSent(false)

                // Sign out user after email change
                setTimeout(() => {
                    signOut()
                }, 2000)
            }
        } catch (error) {
            showToast('error', error.message || 'Invalid verification code')
        } finally {
            setLoading(false)
        }
    }

    const handleCancelVerification = () => {
        setShowVerificationDialog(false)
        setVerificationCode('')
        setCodeSent(false)
    }

    return (
        <div className="max-w-2xl space-y-6">
            {/* Warning Alert */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                    <ShieldCheck className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div className="flex-1">
                        <p className="text-sm font-medium text-blue-900">
                            Email Verification Required
                        </p>
                        <p className="text-sm text-blue-700 mt-1">
                            For security, we'll send a verification code to your current email
                            address before changing it. Make sure you have access to your current
                            email.
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
                        disabled={codeSent}
                    />
                </div>

                {/* Submit Button */}
                <div className="flex justify-end pt-6 border-t">
                    <Button
                        onClick={handleRequestEmailChange}
                        disabled={loading || !newEmail || codeSent}
                        className="min-w-[180px]"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Sending Code...
                            </>
                        ) : (
                            'Send Verification Code'
                        )}
                    </Button>
                </div>
            </div>

            {/* Verification Dialog */}
            <Dialog open={showVerificationDialog} onOpenChange={setShowVerificationDialog}>
                <DialogContent className="w-xl" showCloseButton={false}>
                    <DialogHeader>
                        <DialogTitle>Verify Email Change</DialogTitle>
                        <DialogDescription className="space-y-4 pt-4">
                            <div className="flex items-center gap-3">
                                <Mail className="h-6 w-6 text-blue-600" />
                                <p className="font-semibold text-gray-900">
                                    We've sent a verification code to your current email
                                </p>
                            </div>

                            <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Current Email:</span>
                                    <span className="font-medium text-gray-900">{user?.email}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">New Email:</span>
                                    <span className="font-medium text-blue-600">{newEmail}</span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="verification_code">
                                    Verification Code <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="verification_code"
                                    type="text"
                                    placeholder="000000"
                                    maxLength={6}
                                    value={verificationCode}
                                    onChange={(e) =>
                                        setVerificationCode(e.target.value.replace(/\D/g, ''))
                                    }
                                    className="text-center text-2xl tracking-widest"
                                />
                                <p className="text-sm text-gray-500">
                                    Enter the 6-digit code sent to your current email address
                                </p>
                            </div>

                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                                <div className="flex items-start gap-2">
                                    <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
                                    <p className="text-sm text-yellow-700">
                                        You will be logged out after successfully changing your
                                        email. Please log in again with your new email address.
                                    </p>
                                </div>
                            </div>
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 justify-between mt-6">
                        <Button
                            onClick={handleCancelVerification}
                            variant="outline"
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button onClick={handleVerifyEmailChange} disabled={loading}>
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Verifying...
                                </>
                            ) : (
                                'Verify & Update Email'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default EmailSettings
