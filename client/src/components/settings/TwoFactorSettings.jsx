import { useState } from 'react'
import { enable2FA, disable2FA } from '@/api/settings'

// UI Components
import { Button } from '@/components/ui/Button'
import { Loader2, Shield, CheckCircle, XCircle, AlertCircle } from 'lucide-react'

// Helper
import { showToast } from '@/util/alertHelper'

const TwoFactorSettings = () => {
    const [loading, setLoading] = useState(false)
    const [is2FAEnabled, setIs2FAEnabled] = useState(false)
    const [twoFAMethod, setTwoFAMethod] = useState(null)

    // 2FA is not yet implemented, so these are hardcoded to false
    // When implementing 2FA, fetch from backend or user context

    const handleEnable2FA = async () => {
        try {
            setLoading(true)
            const response = await enable2FA()

            if (response.status === 'success') {
                showToast('info', response.message || '2FA feature coming soon')
            }
        } catch (error) {
            showToast('error', error.message || 'Failed to enable 2FA')
        } finally {
            setLoading(false)
        }
    }

    const handleDisable2FA = async () => {
        try {
            setLoading(true)
            const response = await disable2FA()

            if (response.status === 'success') {
                showToast('info', response.message || '2FA feature coming soon')
            }
        } catch (error) {
            showToast('error', error.message || 'Failed to disable 2FA')
        } finally {
            setLoading(false)
        }
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

            {/* Coming Soon Notice */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div className="flex-1">
                        <p className="text-sm font-medium text-yellow-900">Feature Coming Soon</p>
                        <p className="text-sm text-yellow-700 mt-1">
                            Two-factor authentication is currently under development. We're working
                            on implementing multiple authentication methods including:
                        </p>
                        <ul className="mt-2 space-y-1 text-sm text-yellow-700 list-disc list-inside">
                            <li>Authenticator apps (TOTP)</li>
                            <li>SMS verification</li>
                            <li>Email verification codes</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end pt-6 border-t">
                {is2FAEnabled ? (
                    <Button
                        onClick={handleDisable2FA}
                        disabled={loading}
                        variant="destructive"
                        className="min-w-[140px]"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Disabling...
                            </>
                        ) : (
                            'Disable 2FA'
                        )}
                    </Button>
                ) : (
                    <Button onClick={handleEnable2FA} disabled={loading} className="min-w-[140px]">
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Enabling...
                            </>
                        ) : (
                            'Enable 2FA'
                        )}
                    </Button>
                )}
            </div>
        </div>
    )
}

export default TwoFactorSettings
