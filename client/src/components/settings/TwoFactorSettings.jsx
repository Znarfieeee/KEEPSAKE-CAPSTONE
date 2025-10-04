import { useState, useEffect } from 'react'
import { enable2FA, disable2FA, get2FAStatus, verify2FACode } from '@/api/settings'

// UI Components
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Shield, CheckCircle, XCircle, AlertCircle, Mail } from 'lucide-react'
import Loader from '@/components/ui/Loader'

// Helper
import { showToast } from '@/util/alertHelper'

const TwoFactorSettings = () => {
    const [loading, setLoading] = useState(false)
    const [fetchingStatus, setFetchingStatus] = useState(true)
    const [is2FAEnabled, setIs2FAEnabled] = useState(false)
    const [twoFAMethod, setTwoFAMethod] = useState(null)
    const [showVerification, setShowVerification] = useState(false)
    const [showDisableConfirm, setShowDisableConfirm] = useState(false)
    const [verificationCode, setVerificationCode] = useState('')
    const [password, setPassword] = useState('')
    const [codeSent, setCodeSent] = useState(false)

    // Fetch 2FA status on component mount
    useEffect(() => {
        fetchTwoFactorStatus()
    }, [])

    const fetchTwoFactorStatus = async () => {
        try {
            setFetchingStatus(true)
            const response = await get2FAStatus()

            if (response.status === 'success') {
                setIs2FAEnabled(response.data.enabled)
                setTwoFAMethod(response.data.method)
            }
        } catch (error) {
            console.error('Failed to fetch 2FA status:', error)
        } finally {
            setFetchingStatus(false)
        }
    }

    const handleEnable2FA = async () => {
        try {
            setLoading(true)
            const response = await enable2FA()

            if (response.status === 'success') {
                setCodeSent(true)
                setShowVerification(true)
                showToast('success', response.message || 'Verification code sent to your email')
                // For testing - remove in production
                if (response.code) {
                    console.log('2FA Verification Code:', response.code)
                }
            }
        } catch (error) {
            showToast('error', error.message || 'Failed to send verification code')
        } finally {
            setLoading(false)
        }
    }

    const handleVerifyCode = async () => {
        if (!verificationCode || verificationCode.length !== 6) {
            showToast('error', 'Please enter a valid 6-digit code')
            return
        }

        try {
            setLoading(true)
            const response = await verify2FACode(verificationCode)

            if (response.status === 'success') {
                showToast('success', response.message || '2FA enabled successfully')
                setIs2FAEnabled(true)
                setTwoFAMethod('email')
                setShowVerification(false)
                setVerificationCode('')
                setCodeSent(false)
            }
        } catch (error) {
            showToast('error', error.message || 'Invalid verification code')
        } finally {
            setLoading(false)
        }
    }

    const handleDisable2FA = async () => {
        if (!password) {
            showToast('error', 'Password is required to disable 2FA')
            return
        }

        try {
            setLoading(true)
            const response = await disable2FA(password)

            if (response.status === 'success') {
                showToast('success', response.message || '2FA disabled successfully')
                setIs2FAEnabled(false)
                setTwoFAMethod(null)
                setShowDisableConfirm(false)
                setPassword('')
            }
        } catch (error) {
            showToast('error', error.message || 'Failed to disable 2FA')
        } finally {
            setLoading(false)
        }
    }

    const handleCancelVerification = () => {
        setShowVerification(false)
        setVerificationCode('')
        setCodeSent(false)
    }

    const handleCancelDisable = () => {
        setShowDisableConfirm(false)
        setPassword('')
    }

    if (fetchingStatus) {
        return (
            <div className="max-w-2xl space-y-6">
                <div className=" rounded-lg p-6 bg-white relative min-h-[200px] flex items-center justify-center">
                    <div className="absolute inset-0 bg-white/80">
                        <Loader />
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-2xl space-y-6">
            {/* 2FA Status Card */}
            <div
                className={`border rounded-lg p-6 ${
                    is2FAEnabled ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                }`}
            >
                <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                        {is2FAEnabled ? (
                            <CheckCircle className="h-8 w-8 text-green-600" />
                        ) : (
                            <XCircle className="h-8 w-8 text-gray-400" />
                        )}
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">
                            Two-Factor Authentication
                        </h3>
                        <p
                            className={`mt-1 text-sm ${
                                is2FAEnabled ? 'text-green-700' : 'text-gray-600'
                            }`}
                        >
                            {is2FAEnabled
                                ? 'Your account is protected with 2FA'
                                : 'Your account is not protected with 2FA'}
                        </p>
                        {is2FAEnabled && twoFAMethod && (
                            <p className="mt-2 text-sm text-gray-700">
                                Method:{' '}
                                <span className="font-medium capitalize">{twoFAMethod}</span>
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Information */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                    <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div className="flex-1">
                        <p className="text-sm font-medium text-blue-900">
                            What is Two-Factor Authentication?
                        </p>
                        <p className="text-sm text-blue-700 mt-1">
                            Two-factor authentication (2FA) adds an extra layer of security to your
                            account. When enabled, you'll need to provide a second form of
                            verification in addition to your password when logging in.
                        </p>
                    </div>
                </div>
            </div>

            {/* Email Verification Form */}
            {showVerification && !is2FAEnabled && (
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <Mail className="h-6 w-6 text-blue-600" />
                        <h4 className="text-lg font-semibold text-gray-900">Verify Your Email</h4>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">
                        We've sent a 6-digit verification code to your email. Please enter it below
                        to enable 2FA.
                    </p>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="verification-code">Verification Code</Label>
                            <Input
                                id="verification-code"
                                type="text"
                                placeholder="000000"
                                maxLength={6}
                                value={verificationCode}
                                onChange={(e) =>
                                    setVerificationCode(e.target.value.replace(/\D/g, ''))
                                }
                                className="mt-1"
                            />
                        </div>
                        <div className="flex gap-3 justify-end">
                            <Button
                                onClick={handleCancelVerification}
                                variant="outline"
                                disabled={loading}
                            >
                                Cancel
                            </Button>
                            <Button onClick={handleVerifyCode} disabled={loading}>
                                {loading ? 'Verifying...' : 'Verify & Enable'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Disable 2FA Form */}
            {showDisableConfirm && is2FAEnabled && (
                <div className="bg-white border border-red-200 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Disable 2FA</h4>
                    <p className="text-sm text-gray-600 mb-4">
                        Please enter your password to confirm disabling two-factor authentication.
                    </p>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="password-confirm">Password</Label>
                            <Input
                                id="password-confirm"
                                type="password"
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="mt-1"
                            />
                        </div>
                        <div className="flex gap-3 justify-end">
                            <Button
                                onClick={handleCancelDisable}
                                variant="outline"
                                disabled={loading}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleDisable2FA}
                                variant="destructive"
                                disabled={loading}
                            >
                                {loading ? 'Disabling...' : 'Confirm Disable'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* SMS Coming Soon */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div className="flex-1">
                        <p className="text-sm font-medium text-yellow-900">
                            SMS Verification Coming Soon
                        </p>
                        <p className="text-sm text-yellow-700 mt-1">
                            SMS-based two-factor authentication will be available soon. Currently,
                            only email verification is supported.
                        </p>
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            {!showVerification && !showDisableConfirm && (
                <div className="flex justify-end pt-6 border-t">
                    {is2FAEnabled ? (
                        <Button
                            onClick={() => setShowDisableConfirm(true)}
                            disabled={loading}
                            variant="destructive"
                            className="min-w-[140px]"
                        >
                            Disable 2FA
                        </Button>
                    ) : (
                        <Button
                            onClick={handleEnable2FA}
                            disabled={loading}
                            className="min-w-[140px]"
                        >
                            {loading ? 'Sending...' : 'Enable 2FA'}
                        </Button>
                    )}
                </div>
            )}
        </div>
    )
}

export default TwoFactorSettings
