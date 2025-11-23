import { useState, useEffect } from 'react'
import { useAuth } from '@/context/auth'
import { useSearchParams } from 'react-router-dom'

// UI Components
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { User, Lock, Mail, Phone, Shield, AlertTriangle, Bell, Share2 } from 'lucide-react'
import ProfileSettings from '@/components/settings/ProfileSettings'
import PasswordSettings from '@/components/settings/PasswordSettings'
import EmailSettings from '@/components/settings/EmailSettings'
import PhoneSettings from '@/components/settings/PhoneSettings'
import TwoFactorSettings from '@/components/settings/TwoFactorSettings'
import AccountDeactivation from '@/components/settings/AccountDeactivation'
import NotificationSettings from '@/components/notifications/NotificationSettings'
import ParentConsentManagement from '@/components/settings/ParentConsentManagement'

const Settings = () => {
    const { user } = useAuth()
    const [searchParams] = useSearchParams()
    const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'profile')

    // Sync activeTab with URL query parameter
    useEffect(() => {
        const tabFromUrl = searchParams.get('tab')
        if (tabFromUrl && tabFromUrl !== activeTab) {
            setActiveTab(tabFromUrl)
        }
    }, [searchParams, activeTab])

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
                    <p className="text-gray-600 mt-2">
                        Manage your account settings and preferences
                    </p>
                </div>

                {/* Settings Tabs - Vertical Layout */}
                <Tabs
                    value={activeTab}
                    onValueChange={setActiveTab}
                    orientation="vertical"
                    className="w-full h-full"
                >
                    <div className="flex flex-col md:flex-row gap-6 items-start w-full">
                        {/* Vertical Tab List */}
                        <TabsList className="flex flex-col md:w-64 flex-shrink-0 w-full h-fit gap-1 bg-white border border-gray-200 rounded-lg p-2 shadow-sm sticky top-6">
                            <TabsTrigger
                                value="profile"
                                className="w-full justify-start gap-3 px-4 py-3 rounded-md data-[state=active]:bg-primary data-[state=active]:text-white hover:bg-gray-50 transition-colors"
                            >
                                <User className="h-5 w-5" />
                                <span className="font-medium">Profile Information</span>
                            </TabsTrigger>
                            <TabsTrigger
                                value="password"
                                className="w-full justify-start gap-3 px-4 py-3 rounded-md data-[state=active]:bg-primary data-[state=active]:text-white hover:bg-gray-50 transition-colors"
                            >
                                <Lock className="h-5 w-5" />
                                <span className="font-medium">Password</span>
                            </TabsTrigger>
                            <TabsTrigger
                                value="email"
                                className="w-full justify-start gap-3 px-4 py-3 rounded-md data-[state=active]:bg-primary data-[state=active]:text-white hover:bg-gray-50 transition-colors"
                            >
                                <Mail className="h-5 w-5" />
                                <span className="font-medium">Email Address</span>
                            </TabsTrigger>
                            <TabsTrigger
                                value="phone"
                                className="w-full justify-start gap-3 px-4 py-3 rounded-md data-[state=active]:bg-primary data-[state=active]:text-white hover:bg-gray-50 transition-colors"
                            >
                                <Phone className="h-5 w-5" />
                                <span className="font-medium">Phone Number</span>
                            </TabsTrigger>
                            {user?.role === 'parent' && (
                                <>
                                    <TabsTrigger
                                        value="2fa"
                                        className="w-full justify-start gap-3 px-4 py-3 rounded-md data-[state=active]:bg-primary data-[state=active]:text-white hover:bg-gray-50 transition-colors"
                                    >
                                        <Shield className="h-5 w-5" />
                                        <span className="font-medium">Two-Factor Auth</span>
                                    </TabsTrigger>
                                </>
                            )}

                            <TabsTrigger
                                value="notifications"
                                className="w-full justify-start gap-3 px-4 py-3 rounded-md data-[state=active]:bg-primary data-[state=active]:text-white hover:bg-gray-50 transition-colors"
                            >
                                <Bell className="h-5 w-5" />
                                <span className="font-medium">Notifications</span>
                            </TabsTrigger>

                            {user?.role === 'parent' && (
                                <TabsTrigger
                                    value="consent"
                                    className="w-full justify-start gap-3 px-4 py-3 rounded-md data-[state=active]:bg-primary data-[state=active]:text-white hover:bg-gray-50 transition-colors"
                                >
                                    <Share2 className="h-5 w-5" />
                                    <span className="font-medium">Sharing & Consent</span>
                                </TabsTrigger>
                            )}

                            <div className="border-t my-2" />

                            <TabsTrigger
                                value="account"
                                className="w-full justify-start gap-3 px-4 py-3 rounded-md data-[state=active]:bg-red-500 data-[state=active]:text-white hover:bg-red-50 hover:text-red-700 transition-colors"
                            >
                                <AlertTriangle className="h-5 w-5" />
                                <span className="font-medium">Deactivate Account</span>
                            </TabsTrigger>
                        </TabsList>

                        {/* Tab Content - Fixed Height */}
                        <div className="flex-1 w-full">
                            {/* Profile Tab */}
                            <TabsContent value="profile" className="mt-0 w-full h-full">
                                <Card className="shadow-sm h-full">
                                    <CardHeader className="border-b bg-gray-50/50">
                                        <CardTitle className="text-xl">
                                            Profile Information
                                        </CardTitle>
                                        <CardDescription>
                                            Update your personal information and professional
                                            details
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="p-6">
                                        <ProfileSettings />
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* Password Tab */}
                            <TabsContent value="password" className="mt-0 flex-1 min-w-0 w-full">
                                <Card className="shadow-sm h-full">
                                    <CardHeader className="border-b bg-gray-50/50">
                                        <CardTitle className="text-xl">Change Password</CardTitle>
                                        <CardDescription>
                                            Update your password to keep your account secure
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="p-6">
                                        <PasswordSettings />
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* Email Tab */}
                            <TabsContent value="email" className="mt-0 w-full h-full">
                                <Card className="shadow-sm h-full">
                                    <CardHeader className="border-b bg-gray-50/50">
                                        <CardTitle className="text-xl">Email Address</CardTitle>
                                        <CardDescription>
                                            Change your email address used for login and
                                            notifications
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="p-6">
                                        <EmailSettings />
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* Phone Tab */}
                            <TabsContent value="phone" className="mt-0 w-full h-full">
                                <Card className="shadow-sm h-full">
                                    <CardHeader className="border-b bg-gray-50/50">
                                        <CardTitle className="text-xl">Phone Number</CardTitle>
                                        <CardDescription>
                                            Update your phone number for account recovery and
                                            notifications
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="p-6">
                                        <PhoneSettings />
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* 2FA Tab */}
                            <TabsContent value="2fa" className="mt-0 w-full h-full">
                                <Card className="shadow-sm h-full">
                                    <CardHeader className="border-b bg-gray-50/50">
                                        <CardTitle className="text-xl">
                                            Two-Factor Authentication
                                        </CardTitle>
                                        <CardDescription>
                                            Add an extra layer of security to your account
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="p-6">
                                        <TwoFactorSettings />
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* Notifications Tab */}
                            <TabsContent value="notifications" className="mt-0 w-full h-full">
                                <Card className="shadow-sm h-full">
                                    <CardHeader className="border-b bg-gray-50/50">
                                        <CardTitle className="text-xl flex items-center gap-2">
                                            <Bell className="h-5 w-5 text-blue-600" />
                                            Notification Preferences
                                        </CardTitle>
                                        <CardDescription>
                                            Customize when and how you receive notifications
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        <NotificationSettings />
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* Sharing & Consent Tab (Parents Only) */}
                            {user?.role === 'parent' && (
                                <TabsContent value="consent" className="mt-0 w-full h-full">
                                    <Card className="shadow-sm h-full">
                                        <CardHeader className="border-b bg-gray-50/50">
                                            <CardTitle className="text-xl flex items-center gap-2">
                                                <Share2 className="h-5 w-5 text-blue-600" />
                                                Sharing & Consent Management
                                            </CardTitle>
                                            <CardDescription>
                                                Manage QR code shares, view access history, and understand your rights
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="p-0">
                                            <ParentConsentManagement />
                                        </CardContent>
                                    </Card>
                                </TabsContent>
                            )}

                            {/* Account Deactivation Tab */}
                            <TabsContent value="account" className="mt-0 w-full h-full">
                                <Card className="shadow-sm border-red-200 h-full">
                                    <CardHeader className="border-b bg-red-50/50">
                                        <CardTitle className="text-xl text-red-600">
                                            Danger Zone
                                        </CardTitle>
                                        <CardDescription>
                                            Permanently deactivate your account
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="p-6">
                                        <AccountDeactivation />
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </div>
                    </div>
                </Tabs>
            </div>
        </div>
    )
}

export default Settings
