import React, { useState, useEffect } from 'react'
import { Bell, Volume2, Clock, Mail, Monitor, Save, RefreshCw } from 'lucide-react'
import { Button } from '../ui/Button'
import { Switch } from '../ui/switch'
import { Label } from '../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Input } from '../ui/input'
import { Skeleton } from '../ui/skeleton'
import { useNotificationPreferences } from '../../hooks/useNotificationSound'
import { showToast } from '@/util/alertHelper'

/**
 * NotificationSettings Component
 * Allows users to customize notification preferences
 */
const NotificationSettings = () => {
    const { preferences, loading, saving, updatePreferences, refreshPreferences } =
        useNotificationPreferences()

    const [formData, setFormData] = useState({
        appointment_reminder_enabled: true,
        upcoming_appointment_enabled: true,
        vaccination_due_enabled: true,
        qr_access_alert_enabled: true,
        system_announcement_enabled: true,
        sound_enabled: true,
        sound_type: 'default',
        custom_sound_url: '',
        appointment_reminder_time: 60,
        vaccination_reminder_days: 7,
        desktop_notifications: true,
        email_notifications: false,
    })

    // Update form data when preferences are loaded
    useEffect(() => {
        if (preferences) {
            setFormData({
                appointment_reminder_enabled: preferences.appointment_reminder_enabled ?? true,
                upcoming_appointment_enabled: preferences.upcoming_appointment_enabled ?? true,
                vaccination_due_enabled: preferences.vaccination_due_enabled ?? true,
                qr_access_alert_enabled: preferences.qr_access_alert_enabled ?? true,
                system_announcement_enabled: preferences.system_announcement_enabled ?? true,
                sound_enabled: preferences.sound_enabled ?? true,
                sound_type: preferences.sound_type || 'default',
                custom_sound_url: preferences.custom_sound_url || '',
                appointment_reminder_time: preferences.appointment_reminder_time || 60,
                vaccination_reminder_days: preferences.vaccination_reminder_days || 7,
                desktop_notifications: preferences.desktop_notifications ?? true,
                email_notifications: preferences.email_notifications ?? false,
            })
        }
    }, [preferences])

    const handleToggle = (field) => {
        setFormData((prev) => ({ ...prev, [field]: !prev[field] }))
    }

    const handleSelectChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }))
    }

    const handleInputChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }))
    }

    const handleSave = async () => {
        const success = await updatePreferences(formData)

        if (success) {
            showToast('Notification preferences saved successfully!')
        } else {
            showToast('Failed to save notification preferences.')
        }
    }

    const playTestSound = () => {
        const audio = new Audio()

        if (formData.sound_type === 'custom' && formData.custom_sound_url) {
            audio.src = formData.custom_sound_url
        } else {
            audio.src = `/sounds/notification-${formData.sound_type}.mp3`
        }

        audio.play().catch(() => {
            showToast('Could not play sound. Make sure the sound file exists.')
        })
    }

    if (loading) {
        return (
            <div className="max-w-4xl mx-auto p-6 space-y-8">
                <div>
                    <Skeleton className="h-9 w-64 mb-2" />
                    <Skeleton className="h-5 w-96" />
                </div>

                {/* Notification Types Skeleton */}
                <div className="bg-white rounded-lg shadow p-6 space-y-6">
                    <Skeleton className="h-6 w-48" />
                    <div className="space-y-4">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="flex items-center justify-between">
                                <div className="space-y-2">
                                    <Skeleton className="h-5 w-48" />
                                    <Skeleton className="h-4 w-64" />
                                </div>
                                <Skeleton className="h-6 w-11 rounded-full" />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Sound Settings Skeleton */}
                <div className="bg-white rounded-lg shadow p-6 space-y-6">
                    <Skeleton className="h-6 w-40" />
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-2">
                                <Skeleton className="h-5 w-56" />
                                <Skeleton className="h-4 w-72" />
                            </div>
                            <Skeleton className="h-6 w-11 rounded-full" />
                        </div>
                    </div>
                </div>

                {/* Timing Settings Skeleton */}
                <div className="bg-white rounded-lg shadow p-6 space-y-6">
                    <Skeleton className="h-6 w-40" />
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Skeleton className="h-5 w-64" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                        <div className="space-y-2">
                            <Skeleton className="h-5 w-64" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                    </div>
                </div>

                {/* Save Button Skeleton */}
                <div className="flex justify-end gap-3">
                    <Skeleton className="h-10 w-20" />
                    <Skeleton className="h-10 w-40" />
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Notification Settings</h1>
                <p className="text-gray-600">Customize how and when you receive notifications</p>
            </div>

            {/* Notification Types */}
            <div className="bg-white rounded-lg shadow p-6 space-y-6">
                <div className="flex items-center gap-2 mb-4">
                    <Bell className="h-5 w-5 text-blue-600" />
                    <h2 className="text-xl font-semibold text-gray-900">Notification Types</h2>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <Label htmlFor="appointment-reminder" className="text-base font-medium">
                                Appointment Reminders
                            </Label>
                            <p className="text-sm text-gray-600">
                                Get notified before upcoming appointments
                            </p>
                        </div>
                        <Switch
                            id="appointment-reminder"
                            checked={formData.appointment_reminder_enabled}
                            onCheckedChange={() => handleToggle('appointment_reminder_enabled')}
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <Label htmlFor="upcoming-appointment" className="text-base font-medium">
                                Upcoming Appointments
                            </Label>
                            <p className="text-sm text-gray-600">
                                Daily reminders for appointments within 24 hours
                            </p>
                        </div>
                        <Switch
                            id="upcoming-appointment"
                            checked={formData.upcoming_appointment_enabled}
                            onCheckedChange={() => handleToggle('upcoming_appointment_enabled')}
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <Label htmlFor="vaccination-due" className="text-base font-medium">
                                Vaccination Dues
                            </Label>
                            <p className="text-sm text-gray-600">
                                Reminders for upcoming vaccination schedules
                            </p>
                        </div>
                        <Switch
                            id="vaccination-due"
                            checked={formData.vaccination_due_enabled}
                            onCheckedChange={() => handleToggle('vaccination_due_enabled')}
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <Label htmlFor="qr-access" className="text-base font-medium">
                                QR Access Alerts
                            </Label>
                            <p className="text-sm text-gray-600">
                                Get notified when someone accesses patient QR codes
                            </p>
                        </div>
                        <Switch
                            id="qr-access"
                            checked={formData.qr_access_alert_enabled}
                            onCheckedChange={() => handleToggle('qr_access_alert_enabled')}
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <Label htmlFor="system-announcement" className="text-base font-medium">
                                System Announcements
                            </Label>
                            <p className="text-sm text-gray-600">
                                Important updates and announcements from the system
                            </p>
                        </div>
                        <Switch
                            id="system-announcement"
                            checked={formData.system_announcement_enabled}
                            onCheckedChange={() => handleToggle('system_announcement_enabled')}
                        />
                    </div>
                </div>
            </div>

            {/* Sound Settings */}
            <div className="bg-white rounded-lg shadow p-6 space-y-6">
                <div className="flex items-center gap-2 mb-4">
                    <Volume2 className="h-5 w-5 text-purple-600" />
                    <h2 className="text-xl font-semibold text-gray-900">Sound Settings</h2>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <Label htmlFor="sound-enabled" className="text-base font-medium">
                                Enable Notification Sounds
                            </Label>
                            <p className="text-sm text-gray-600">
                                Play a sound when new notifications arrive
                            </p>
                        </div>
                        <Switch
                            id="sound-enabled"
                            checked={formData.sound_enabled}
                            onCheckedChange={() => handleToggle('sound_enabled')}
                        />
                    </div>

                    {formData.sound_enabled && (
                        <>
                            <div className="space-y-2">
                                <Label htmlFor="sound-type">Notification Sound</Label>
                                <div className="flex gap-2">
                                    <Select
                                        value={formData.sound_type}
                                        onValueChange={(value) =>
                                            handleSelectChange('sound_type', value)
                                        }
                                    >
                                        <SelectTrigger id="sound-type" className="flex-1">
                                            <SelectValue placeholder="Select sound" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="default">Default</SelectItem>
                                            <SelectItem value="chime">Chime</SelectItem>
                                            <SelectItem value="bell">Bell</SelectItem>
                                            <SelectItem value="ding">Ding</SelectItem>
                                            <SelectItem value="ping">Ping</SelectItem>
                                            <SelectItem value="pop">Pop</SelectItem>
                                            <SelectItem value="custom">Custom URL</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Button onClick={playTestSound} variant="outline">
                                        Test Sound
                                    </Button>
                                </div>
                            </div>

                            {formData.sound_type === 'custom' && (
                                <div className="space-y-2">
                                    <Label htmlFor="custom-sound-url">Custom Sound URL</Label>
                                    <Input
                                        id="custom-sound-url"
                                        type="url"
                                        placeholder="https://example.com/sound.mp3"
                                        value={formData.custom_sound_url}
                                        onChange={(e) =>
                                            handleInputChange('custom_sound_url', e.target.value)
                                        }
                                    />
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Timing Settings */}
            <div className="bg-white rounded-lg shadow p-6 space-y-6">
                <div className="flex items-center gap-2 mb-4">
                    <Clock className="h-5 w-5 text-green-600" />
                    <h2 className="text-xl font-semibold text-gray-900">Reminder Timing</h2>
                </div>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="appointment-reminder-time">
                            Appointment Reminder (minutes before)
                        </Label>
                        <Input
                            id="appointment-reminder-time"
                            type="number"
                            min="15"
                            max="1440"
                            value={formData.appointment_reminder_time}
                            onChange={(e) =>
                                handleInputChange(
                                    'appointment_reminder_time',
                                    parseInt(e.target.value)
                                )
                            }
                        />
                        <p className="text-sm text-gray-600">
                            Get reminded {formData.appointment_reminder_time} minutes before
                            appointments
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="vaccination-reminder-days">
                            Vaccination Reminder (days before)
                        </Label>
                        <Input
                            id="vaccination-reminder-days"
                            type="number"
                            min="1"
                            max="30"
                            value={formData.vaccination_reminder_days}
                            onChange={(e) =>
                                handleInputChange(
                                    'vaccination_reminder_days',
                                    parseInt(e.target.value)
                                )
                            }
                        />
                        <p className="text-sm text-gray-600">
                            Get reminded {formData.vaccination_reminder_days} days before
                            vaccination due dates
                        </p>
                    </div>
                </div>
            </div>

            {/* Delivery Methods */}
            <div className="bg-white rounded-lg shadow p-6 space-y-6">
                <div className="flex items-center gap-2 mb-4">
                    <Monitor className="h-5 w-5 text-orange-600" />
                    <h2 className="text-xl font-semibold text-gray-900">Delivery Methods</h2>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <Label
                                htmlFor="desktop-notifications"
                                className="text-base font-medium"
                            >
                                Desktop Notifications
                            </Label>
                            <p className="text-sm text-gray-600">
                                Show notifications in your browser
                            </p>
                        </div>
                        <Switch
                            id="desktop-notifications"
                            checked={formData.desktop_notifications}
                            onCheckedChange={() => handleToggle('desktop_notifications')}
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <Label htmlFor="email-notifications" className="text-base font-medium">
                                Email Notifications
                            </Label>
                            <p className="text-sm text-gray-600">
                                Receive important notifications via email
                            </p>
                        </div>
                        <Switch
                            id="email-notifications"
                            checked={formData.email_notifications}
                            onCheckedChange={() => handleToggle('email_notifications')}
                        />
                    </div>
                </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={refreshPreferences} disabled={saving}>
                    Reset
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? 'Saving...' : 'Save Preferences'}
                </Button>
            </div>
        </div>
    )
}

export default NotificationSettings
