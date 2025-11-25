/**
 * Feedback Page
 * Feedback and Feature Suggestion submission page
 * Designed to be accessible for users of all ages including elderly
 */

import React from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/Button'
import {
    MessageSquare,
    ArrowLeft,
    Lightbulb,
    Bug,
    HelpCircle,
    Shield,
    CheckCircle2,
} from 'lucide-react'
import FeedbackForm from '@/components/help/FeedbackForm'
import { useAuth } from '@/context/auth'

/**
 * Info Card for sidebar
 */
const InfoCard = ({ icon: Icon, title, children, variant = 'default' }) => {
    const variants = {
        default: 'border-gray-200 bg-white',
        info: 'border-cyan-200 bg-cyan-50',
        success: 'border-green-200 bg-green-50',
    }

    const iconColors = {
        default: 'text-gray-600 bg-gray-100',
        info: 'text-cyan-600 bg-cyan-100',
        success: 'text-green-600 bg-green-100',
    }

    return (
        <Card className={variants[variant]}>
            <CardContent className="p-5">
                <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${iconColors[variant]}`}>
                        <Icon className="h-5 w-5" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
                        <div className="text-sm text-gray-600">{children}</div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

/**
 * Main Feedback Page Component
 */
const Feedback = () => {
    const { user } = useAuth()
    const userRole = user?.role || 'parent'

    // Get the base path for the current role
    const getBasePath = () => {
        const pathMap = {
            admin: '/admin',
            facility_admin: '/facility_admin',
            doctor: '/pediapro',
            nurse: '/nurse',
            parent: '/parent',
            guardian: '/parent',
        }
        return pathMap[userRole] || '/parent'
    }

    const handleSuccess = () => {
        // Optional: Could redirect or show additional confirmation
        console.log('Feedback submitted successfully')
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    {/* Back Link */}
                    {/* <Link
                        to={`${getBasePath()}/help-support`}
                        className="inline-flex items-center text-cyan-600 hover:text-cyan-700 mb-4 text-base font-medium"
                    >
                        <ArrowLeft className="mr-2 h-5 w-5" />
                        Back to Help & Support
                    </Link> */}

                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-cyan-100 rounded-xl">
                            <MessageSquare className="h-8 w-8 text-cyan-600" />
                        </div>
                        <div>
                            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
                                Send Feedback
                            </h1>
                            <p className="mt-1 text-lg text-gray-600">
                                Help us improve KEEPSAKE by sharing your thoughts
                            </p>
                        </div>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Feedback Form - Main Content */}
                    <div className="lg:col-span-2">
                        <Card className="border-2">
                            <CardHeader className="pb-4">
                                <CardTitle className="text-xl">Submit Your Feedback</CardTitle>
                                <CardDescription className="text-base">
                                    We value your input. Whether it's a bug report, feature
                                    suggestion, or general feedback, we want to hear from you.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <FeedbackForm userRole={userRole} onSuccess={handleSuccess} />
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar */}
                    <div className="lg:col-span-1 space-y-4">
                        {/* What to Include */}
                        <InfoCard icon={Lightbulb} title="Tips for Great Feedback" variant="info">
                            <ul className="space-y-2 mt-2">
                                <li className="flex items-start gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-cyan-600 mt-0.5 flex-shrink-0" />
                                    <span>Be specific about what happened</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-cyan-600 mt-0.5 flex-shrink-0" />
                                    <span>Include steps to reproduce bugs</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-cyan-600 mt-0.5 flex-shrink-0" />
                                    <span>Describe the expected behavior</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-cyan-600 mt-0.5 flex-shrink-0" />
                                    <span>Mention the page or feature affected</span>
                                </li>
                            </ul>
                        </InfoCard>

                        {/* Feedback Types */}
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg">Feedback Types</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex items-start gap-3">
                                    <Bug className="h-5 w-5 text-red-500 mt-0.5" />
                                    <div>
                                        <p className="font-medium text-gray-900">Bug Report</p>
                                        <p className="text-sm text-gray-600">
                                            Something is not working correctly
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Lightbulb className="h-5 w-5 text-amber-500 mt-0.5" />
                                    <div>
                                        <p className="font-medium text-gray-900">
                                            Feature Suggestion
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            Ideas to improve KEEPSAKE
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <MessageSquare className="h-5 w-5 text-cyan-500 mt-0.5" />
                                    <div>
                                        <p className="font-medium text-gray-900">
                                            General Feedback
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            Share your experience
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <HelpCircle className="h-5 w-5 text-purple-500 mt-0.5" />
                                    <div>
                                        <p className="font-medium text-gray-900">Question</p>
                                        <p className="text-sm text-gray-600">
                                            Ask for help with something
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Privacy Notice */}
                        <InfoCard icon={Shield} title="Your Privacy" variant="success">
                            <p className="mt-1">
                                You can choose to submit feedback anonymously. Anonymous feedback
                                helps us improve while protecting your identity.
                            </p>
                        </InfoCard>

                        {/* Response Time */}
                        <Card className="border-gray-200">
                            <CardContent className="p-5">
                                <h3 className="font-semibold text-gray-900 mb-2">Response Times</h3>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Bug Reports</span>
                                        <span className="font-medium">1-2 business days</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Feature Suggestions</span>
                                        <span className="font-medium">Reviewed monthly</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Questions</span>
                                        <span className="font-medium">1-3 business days</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-12 text-center">
                    <p className="text-gray-500 text-sm">
                        Thank you for helping us improve KEEPSAKE!
                    </p>
                </div>
            </div>
        </div>
    )
}

export default Feedback
