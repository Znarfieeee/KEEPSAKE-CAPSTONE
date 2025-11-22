import React, { useState, useEffect } from 'react'
import {
    getConsentPreferences,
    updateConsentPreferences
} from '@/api/consent'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import {
    FiSave,
    FiClock,
    FiHash,
    FiLock,
    FiBell,
    FiAlertTriangle,
    FiCheckCircle,
    FiRefreshCw,
    FiInfo,
    FiShield
} from 'react-icons/fi'
import { AiOutlineLoading3Quarters } from 'react-icons/ai'

const SCOPE_OPTIONS = [
    { value: 'view_only', label: 'View Only (Basic Info)', description: 'Name, DOB, blood type' },
    { value: 'allergies', label: 'Allergies', description: 'Known allergies and reactions' },
    { value: 'prescriptions', label: 'Prescriptions', description: 'Current and past medications' },
    { value: 'vaccinations', label: 'Vaccinations', description: 'Immunization records' },
    { value: 'appointments', label: 'Appointments', description: 'Scheduled and past visits' },
    { value: 'vitals', label: 'Vitals & Measurements', description: 'Growth charts, BMI, vitals' }
]

const EXPIRY_OPTIONS = [
    { value: 1, label: '1 Day' },
    { value: 3, label: '3 Days' },
    { value: 7, label: '1 Week' },
    { value: 14, label: '2 Weeks' },
    { value: 30, label: '1 Month' },
    { value: 90, label: '3 Months' },
    { value: 180, label: '6 Months' },
    { value: 365, label: '1 Year' }
]

const ConsentPreferencesForm = () => {
    const [preferences, setPreferences] = useState({
        default_expiry_days: 7,
        default_max_uses: 10,
        default_scope: ['view_only', 'allergies', 'vaccinations'],
        always_require_pin: false,
        notify_on_access: true,
        notify_on_expiry: true,
        notify_before_expiry_days: 3,
        allow_emergency_override: false,
        emergency_contact_notified: true
    })
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState(null)
    const [success, setSuccess] = useState(false)
    const [hasChanges, setHasChanges] = useState(false)
    const [originalPreferences, setOriginalPreferences] = useState(null)

    useEffect(() => {
        fetchPreferences()
    }, [])

    const fetchPreferences = async () => {
        setLoading(true)
        setError(null)
        try {
            const response = await getConsentPreferences()
            const prefs = response.preferences || {}
            setPreferences({
                default_expiry_days: prefs.default_expiry_days || 7,
                default_max_uses: prefs.default_max_uses || 10,
                default_scope: prefs.default_scope || ['view_only', 'allergies', 'vaccinations'],
                always_require_pin: prefs.always_require_pin || false,
                notify_on_access: prefs.notify_on_access !== false,
                notify_on_expiry: prefs.notify_on_expiry !== false,
                notify_before_expiry_days: prefs.notify_before_expiry_days || 3,
                allow_emergency_override: prefs.allow_emergency_override || false,
                emergency_contact_notified: prefs.emergency_contact_notified !== false
            })
            setOriginalPreferences(prefs)
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleChange = (field, value) => {
        setPreferences(prev => ({ ...prev, [field]: value }))
        setHasChanges(true)
        setSuccess(false)
    }

    const handleScopeToggle = (scopeValue) => {
        setPreferences(prev => {
            const currentScope = prev.default_scope || []
            const newScope = currentScope.includes(scopeValue)
                ? currentScope.filter(s => s !== scopeValue)
                : [...currentScope, scopeValue]

            // Ensure at least view_only is always selected
            if (newScope.length === 0) {
                newScope.push('view_only')
            }

            return { ...prev, default_scope: newScope }
        })
        setHasChanges(true)
        setSuccess(false)
    }

    const handleSave = async () => {
        setSaving(true)
        setError(null)
        setSuccess(false)
        try {
            await updateConsentPreferences(preferences)
            setOriginalPreferences(preferences)
            setHasChanges(false)
            setSuccess(true)
            setTimeout(() => setSuccess(false), 3000)
        } catch (err) {
            setError(err.message)
        } finally {
            setSaving(false)
        }
    }

    const handleReset = () => {
        if (originalPreferences) {
            setPreferences({
                default_expiry_days: originalPreferences.default_expiry_days || 7,
                default_max_uses: originalPreferences.default_max_uses || 10,
                default_scope: originalPreferences.default_scope || ['view_only', 'allergies', 'vaccinations'],
                always_require_pin: originalPreferences.always_require_pin || false,
                notify_on_access: originalPreferences.notify_on_access !== false,
                notify_on_expiry: originalPreferences.notify_on_expiry !== false,
                notify_before_expiry_days: originalPreferences.notify_before_expiry_days || 3,
                allow_emergency_override: originalPreferences.allow_emergency_override || false,
                emergency_contact_notified: originalPreferences.emergency_contact_notified !== false
            })
            setHasChanges(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <AiOutlineLoading3Quarters className="text-3xl text-primary animate-spin mr-3" />
                <span className="text-gray-600">Loading preferences...</span>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <FiShield className="text-primary" />
                    Default Sharing Preferences
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                    Set your default preferences for new QR code shares. These can be changed for individual shares.
                </p>
            </div>

            {/* Error Alert */}
            {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                    <FiAlertTriangle className="text-red-500" />
                    <span className="text-sm text-red-700">{error}</span>
                </div>
            )}

            {/* Success Alert */}
            {success && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                    <FiCheckCircle className="text-green-500" />
                    <span className="text-sm text-green-700">Preferences saved successfully!</span>
                </div>
            )}

            {/* Default Expiry */}
            <Card className="p-5">
                <div className="flex items-center gap-2 mb-4">
                    <FiClock className="text-blue-500" />
                    <h4 className="font-medium text-gray-900">Default Expiration Period</h4>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                    How long should QR codes be valid by default?
                </p>
                <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
                    {EXPIRY_OPTIONS.map(option => (
                        <button
                            key={option.value}
                            type="button"
                            onClick={() => handleChange('default_expiry_days', option.value)}
                            className={`px-3 py-2 text-sm rounded-md border transition-colors ${
                                preferences.default_expiry_days === option.value
                                    ? 'bg-primary text-white border-primary'
                                    : 'bg-white text-gray-700 border-gray-300 hover:border-primary'
                            }`}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
            </Card>

            {/* Default Max Uses */}
            <Card className="p-5">
                <div className="flex items-center gap-2 mb-4">
                    <FiHash className="text-purple-500" />
                    <h4 className="font-medium text-gray-900">Default Maximum Uses</h4>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                    How many times should a QR code be scannable by default?
                </p>
                <div className="flex items-center gap-3">
                    <input
                        type="number"
                        min="1"
                        max="100"
                        value={preferences.default_max_uses}
                        onChange={(e) => handleChange('default_max_uses', Math.min(100, Math.max(1, parseInt(e.target.value) || 1)))}
                        className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
                    />
                    <span className="text-sm text-gray-500">times (max 100)</span>
                </div>
            </Card>

            {/* Default Scope */}
            <Card className="p-5">
                <div className="flex items-center gap-2 mb-4">
                    <FiShield className="text-green-500" />
                    <h4 className="font-medium text-gray-900">Default Data Scope</h4>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                    What information should be included by default when sharing?
                </p>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {SCOPE_OPTIONS.map(scope => (
                        <label
                            key={scope.value}
                            className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                                preferences.default_scope?.includes(scope.value)
                                    ? 'border-primary bg-primary/5'
                                    : 'border-gray-200 hover:border-gray-300'
                            }`}
                        >
                            <input
                                type="checkbox"
                                checked={preferences.default_scope?.includes(scope.value) || false}
                                onChange={() => handleScopeToggle(scope.value)}
                                className="mt-0.5 w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                            />
                            <div>
                                <div className="font-medium text-sm text-gray-900">{scope.label}</div>
                                <div className="text-xs text-gray-500">{scope.description}</div>
                            </div>
                        </label>
                    ))}
                </div>
            </Card>

            {/* Security Settings */}
            <Card className="p-5">
                <div className="flex items-center gap-2 mb-4">
                    <FiLock className="text-orange-500" />
                    <h4 className="font-medium text-gray-900">Security Settings</h4>
                </div>

                <div className="space-y-4">
                    {/* PIN Protection */}
                    <label className="flex items-start gap-3">
                        <input
                            type="checkbox"
                            checked={preferences.always_require_pin}
                            onChange={(e) => handleChange('always_require_pin', e.target.checked)}
                            className="mt-1 w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                        />
                        <div>
                            <div className="font-medium text-sm text-gray-900">Always require PIN protection</div>
                            <div className="text-xs text-gray-500">
                                All new QR codes will require a 4-digit PIN to access
                            </div>
                        </div>
                    </label>

                    {/* Emergency Override */}
                    <label className="flex items-start gap-3">
                        <input
                            type="checkbox"
                            checked={preferences.allow_emergency_override}
                            onChange={(e) => handleChange('allow_emergency_override', e.target.checked)}
                            className="mt-1 w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                        />
                        <div>
                            <div className="font-medium text-sm text-gray-900">Allow emergency access override</div>
                            <div className="text-xs text-gray-500">
                                Healthcare providers can access critical info in emergencies with PIN
                            </div>
                        </div>
                    </label>
                    {preferences.allow_emergency_override && (
                        <div className="ml-7 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                            <div className="flex items-start gap-2">
                                <FiInfo className="text-amber-600 mt-0.5 flex-shrink-0" />
                                <p className="text-xs text-amber-800">
                                    Emergency access allows providers to bypass facility restrictions
                                    if they have the PIN code. They will still need to enter the PIN.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </Card>

            {/* Notification Settings */}
            <Card className="p-5">
                <div className="flex items-center gap-2 mb-4">
                    <FiBell className="text-blue-500" />
                    <h4 className="font-medium text-gray-900">Notification Preferences</h4>
                </div>

                <div className="space-y-4">
                    {/* Notify on Access */}
                    <label className="flex items-start gap-3">
                        <input
                            type="checkbox"
                            checked={preferences.notify_on_access}
                            onChange={(e) => handleChange('notify_on_access', e.target.checked)}
                            className="mt-1 w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                        />
                        <div>
                            <div className="font-medium text-sm text-gray-900">Notify when records are accessed</div>
                            <div className="text-xs text-gray-500">
                                Receive an alert whenever someone scans your QR code
                            </div>
                        </div>
                    </label>

                    {/* Notify on Expiry */}
                    <label className="flex items-start gap-3">
                        <input
                            type="checkbox"
                            checked={preferences.notify_on_expiry}
                            onChange={(e) => handleChange('notify_on_expiry', e.target.checked)}
                            className="mt-1 w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                        />
                        <div>
                            <div className="font-medium text-sm text-gray-900">Notify before QR codes expire</div>
                            <div className="text-xs text-gray-500">
                                Receive a reminder before your shared QR codes expire
                            </div>
                        </div>
                    </label>

                    {preferences.notify_on_expiry && (
                        <div className="ml-7 flex items-center gap-3">
                            <span className="text-sm text-gray-600">Notify</span>
                            <select
                                value={preferences.notify_before_expiry_days}
                                onChange={(e) => handleChange('notify_before_expiry_days', parseInt(e.target.value))}
                                className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                            >
                                <option value={1}>1 day</option>
                                <option value={2}>2 days</option>
                                <option value={3}>3 days</option>
                                <option value={5}>5 days</option>
                                <option value={7}>7 days</option>
                            </select>
                            <span className="text-sm text-gray-600">before expiry</span>
                        </div>
                    )}

                    {/* Emergency Contact Notification */}
                    {preferences.allow_emergency_override && (
                        <label className="flex items-start gap-3">
                            <input
                                type="checkbox"
                                checked={preferences.emergency_contact_notified}
                                onChange={(e) => handleChange('emergency_contact_notified', e.target.checked)}
                                className="mt-1 w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                            />
                            <div>
                                <div className="font-medium text-sm text-gray-900">Notify on emergency access</div>
                                <div className="text-xs text-gray-500">
                                    Receive an immediate alert if emergency access is used
                                </div>
                            </div>
                        </label>
                    )}
                </div>
            </Card>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-4 border-t">
                <Button
                    onClick={handleReset}
                    variant="outline"
                    disabled={!hasChanges || saving}
                >
                    <FiRefreshCw className="mr-2" />
                    Reset Changes
                </Button>

                <Button
                    onClick={handleSave}
                    disabled={!hasChanges || saving}
                    className="bg-primary hover:bg-primary/90"
                >
                    {saving ? (
                        <>
                            <AiOutlineLoading3Quarters className="animate-spin mr-2" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <FiSave className="mr-2" />
                            Save Preferences
                        </>
                    )}
                </Button>
            </div>
        </div>
    )
}

export default ConsentPreferencesForm
