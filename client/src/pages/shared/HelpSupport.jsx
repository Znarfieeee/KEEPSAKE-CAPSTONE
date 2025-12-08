/**
 * HelpSupport Page
 * Comprehensive FAQ and Knowledge Base page with accessibility features
 * Designed to be accessible for users of all ages including elderly
 */

import React, { useState, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/badge'
import {
    BookOpen,
    MessageSquarePlus,
    Phone,
    Mail,
    Printer,
    ArrowRight,
    HelpCircle,
} from 'lucide-react'
import FAQAccordion from '@/components/help/FAQAccordion'
import FAQSearch from '@/components/help/FAQSearch'
import FAQCategoryTabs from '@/components/help/FAQCategoryTabs'
import {
    FAQ_CONTENT,
    FAQ_CATEGORIES,
    CATEGORY_INFO,
    getFAQsByCategoryAndRole,
    searchFAQs,
} from '@/data/faqContent'
import { useAuth } from '@/context/auth'

/**
 * Quick Help Card Component
 */
const QuickHelpCard = ({
    icon: Icon,
    title,
    description,
    action,
    actionLabel,
    variant = 'default',
}) => {
    const variants = {
        default: 'border-gray-200 hover:border-cyan-300',
        primary: 'border-cyan-200 bg-cyan-50 hover:border-cyan-400',
        secondary: 'border-purple-200 bg-purple-50 hover:border-purple-400',
    }

    return (
        <Card className={`transition-all duration-200 hover:shadow-md ${variants[variant]}`}>
            <CardContent className="p-6">
                <div className="flex items-start gap-4">
                    <div
                        className={`p-3 rounded-xl ${
                            variant === 'primary'
                                ? 'bg-cyan-100'
                                : variant === 'secondary'
                                ? 'bg-purple-100'
                                : 'bg-gray-100'
                        }`}
                    >
                        <Icon
                            className={`h-6 w-6 ${
                                variant === 'primary'
                                    ? 'text-cyan-600'
                                    : variant === 'secondary'
                                    ? 'text-purple-600'
                                    : 'text-gray-600'
                            }`}
                        />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
                        <p className="text-gray-600 text-base mb-3">{description}</p>
                        {action && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={action}
                                className="p-0 h-auto text-cyan-600 hover:text-cyan-700 font-medium"
                            >
                                {actionLabel} <ArrowRight className="ml-1 h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

/**
 * Main HelpSupport Page Component
 */
const HelpSupport = () => {
    const { user } = useAuth()
    const userRole = user?.role || 'parent'

    // State
    const [selectedCategory, setSelectedCategory] = useState('all')
    const [searchTerm, setSearchTerm] = useState('')

    // Get role-mapped value for FAQ filtering
    const getRoleMappedValue = (role) => {
        const roleMap = {
            admin: 'admin',
            facility_admin: 'facility_admin',
            doctor: 'doctor',
            nurse: 'nurse',
            parent: 'parent',
            guardian: 'parent',
        }
        return roleMap[role] || 'parent'
    }

    const mappedRole = getRoleMappedValue(userRole)

    // Filter FAQs based on search and category
    const filteredFAQs = useMemo(() => {
        if (searchTerm) {
            return searchFAQs(searchTerm, mappedRole)
        }
        return getFAQsByCategoryAndRole(selectedCategory, mappedRole)
    }, [selectedCategory, searchTerm, mappedRole])

    // Calculate category counts for the user's role
    const categoryCounts = useMemo(() => {
        const counts = {}
        Object.keys(FAQ_CATEGORIES).forEach((key) => {
            const categoryId = FAQ_CATEGORIES[key]
            counts[categoryId] = getFAQsByCategoryAndRole(categoryId, mappedRole).length
        })
        return counts
    }, [mappedRole])

    // Handlers
    const handleSearch = useCallback((term) => {
        setSearchTerm(term)
        if (term) {
            setSelectedCategory('all') // Reset category when searching
        }
    }, [])

    const handleCategoryChange = useCallback((category) => {
        setSelectedCategory(category)
        setSearchTerm('') // Clear search when changing category
    }, [])

    const handlePrint = useCallback(() => {
        window.print()
    }, [])

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

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Print Styles */}
            <style>
                {`
                    @media print {
                        .no-print { display: none !important; }
                        .print-break { page-break-before: always; }
                    }
                `}
            </style>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 flex items-center gap-3">
                                <HelpCircle className="h-10 w-10 text-cyan-600" />
                                Help & Support
                            </h1>
                            <p className="mt-2 text-lg text-gray-600">
                                Find answers to common questions and learn how to use KEEPSAKE
                            </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3 no-print">
                            <Button variant="ghost" onClick={handlePrint} className="min-h-[48px]">
                                <Printer className="mr-2 h-5 w-5" />
                                Print FAQs
                            </Button>
                            <Link to={`${getBasePath()}/feedback`}>
                                <Button className="min-h-[48px] bg-cyan-600 hover:bg-cyan-700">
                                    <MessageSquarePlus className="mr-2 h-5 w-5" />
                                    Send Feedback
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Quick Help Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 no-print">
                    <QuickHelpCard
                        icon={BookOpen}
                        title="Getting Started"
                        description="New to KEEPSAKE? Start here to learn the basics."
                        action={() => handleCategoryChange(FAQ_CATEGORIES.GETTING_STARTED)}
                        actionLabel="View Guide"
                        variant="primary"
                    />
                    <QuickHelpCard
                        icon={MessageSquarePlus}
                        title="Send Feedback"
                        description="Share your thoughts, report bugs, or suggest features."
                        action={() => (window.location.href = `${getBasePath()}/feedback`)}
                        actionLabel="Give Feedback"
                        variant="secondary"
                    />
                    <QuickHelpCard
                        icon={Mail}
                        title="Contact Support"
                        description="Can't find what you need? Reach out to our support team."
                        actionLabel="Email Support"
                    />
                </div>

                {/* Search Section */}
                <Card className="mb-8 no-print">
                    <CardContent className="p-6">
                        <FAQSearch
                            onSearch={handleSearch}
                            placeholder="Type your question here... (e.g., 'how do I reset my password')"
                        />
                    </CardContent>
                </Card>

                {/* Category Tabs */}
                {!searchTerm && (
                    <div className="mb-8 no-print">
                        <FAQCategoryTabs
                            selectedCategory={selectedCategory}
                            onCategoryChange={handleCategoryChange}
                            categoryCounts={categoryCounts}
                        />
                    </div>
                )}

                {/* Search Results Header */}
                {searchTerm && (
                    <div className="mb-6 flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900">Search Results</h2>
                            <p className="text-gray-600">
                                Found {filteredFAQs.length} result
                                {filteredFAQs.length !== 1 ? 's' : ''} for "{searchTerm}"
                            </p>
                        </div>
                        <Button
                            variant="ghost"
                            onClick={() => handleSearch('')}
                            className="text-cyan-600 hover:text-cyan-700"
                        >
                            Clear Search
                        </Button>
                    </div>
                )}

                {/* Category Header */}
                {!searchTerm && selectedCategory !== 'all' && CATEGORY_INFO[selectedCategory] && (
                    <div className="mb-6">
                        <h2 className="text-2xl font-semibold text-gray-900">
                            {CATEGORY_INFO[selectedCategory].label}
                        </h2>
                        <p className="text-gray-600 mt-1">
                            {CATEGORY_INFO[selectedCategory].description}
                        </p>
                    </div>
                )}

                {/* FAQ Content */}
                <div className="mb-12">
                    <FAQAccordion faqs={filteredFAQs} allowMultiple={true} />
                </div>

                {/* Still Need Help Section */}
                <Card className="bg-gradient-to-r from-cyan-50 to-blue-50 border-cyan-200 no-print">
                    <CardContent className="p-8 text-center">
                        <h2 className="text-2xl font-bold text-gray-900 mb-3">Still Need Help?</h2>
                        <p className="text-lg text-gray-600 mb-6 max-w-2xl mx-auto">
                            If you couldn't find the answer to your question, our support team is
                            here to help. You can also submit feedback to help us improve KEEPSAKE.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link to={`${getBasePath()}/feedback`}>
                                <Button
                                    size="lg"
                                    className="min-h-[56px] px-8 text-lg bg-cyan-600 hover:bg-cyan-700"
                                >
                                    <MessageSquarePlus className="mr-2 h-5 w-5" />
                                    Submit a Question
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>

                {/* Footer Info */}
                <div className="mt-8 text-center text-gray-500 text-sm">
                    <p>KEEPSAKE Help Center • Last updated: {new Date().toLocaleDateString()}</p>
                </div>
            </div>
        </div>
    )
}

export default HelpSupport
