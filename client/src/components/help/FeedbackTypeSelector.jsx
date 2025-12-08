/**
 * FeedbackTypeSelector Component
 * Visual selector for choosing feedback type with accessibility features
 */

import React from 'react'
import { Card, CardContent } from '@/components/ui/Card'
import { Bug, Lightbulb, MessageSquare, HelpCircle, CheckCircle } from 'lucide-react'

// Feedback type configurations
const FEEDBACK_TYPES = [
    {
        id: 'bug_report',
        label: 'Report a Bug',
        description: 'Something is not working correctly',
        icon: Bug,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        selectedBg: 'bg-red-100',
        selectedBorder: 'border-red-500',
    },
    {
        id: 'feature_suggestion',
        label: 'Suggest a Feature',
        description: 'I have an idea to improve KEEPSAKE',
        icon: Lightbulb,
        color: 'text-amber-600',
        bgColor: 'bg-amber-50',
        borderColor: 'border-amber-200',
        selectedBg: 'bg-amber-100',
        selectedBorder: 'border-amber-500',
    },
    {
        id: 'general_feedback',
        label: 'General Feedback',
        description: 'Share your thoughts or experience',
        icon: MessageSquare,
        color: 'text-cyan-600',
        bgColor: 'bg-cyan-50',
        borderColor: 'border-cyan-200',
        selectedBg: 'bg-cyan-100',
        selectedBorder: 'border-cyan-500',
    },
    {
        id: 'question',
        label: 'Ask a Question',
        description: 'I need help with something',
        icon: HelpCircle,
        color: 'text-purple-600',
        bgColor: 'bg-purple-50',
        borderColor: 'border-purple-200',
        selectedBg: 'bg-purple-100',
        selectedBorder: 'border-purple-500',
    },
]

/**
 * Single Feedback Type Card
 */
const FeedbackTypeCard = ({ type, isSelected, onClick }) => {
    const Icon = type.icon

    return (
        <Card
            className={`
                cursor-pointer transition-all duration-200
                hover:shadow-md focus-within:ring-2 focus-within:ring-cyan-500
                ${
                    isSelected
                        ? `${type.selectedBg} ${type.selectedBorder} border-2 shadow-md`
                        : `${type.bgColor} ${type.borderColor} border-2 hover:border-gray-300`
                }
            `}
            onClick={() => onClick(type.id)}
            role="radio"
            aria-checked={isSelected}
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onClick(type.id)
                }
            }}
        >
            <CardContent className="p-6 flex flex-col items-center text-center relative">
                {/* Selected Indicator */}
                {isSelected && (
                    <div className="absolute top-3 right-3">
                        <CheckCircle className="h-6 w-6 text-green-600" />
                    </div>
                )}

                {/* Icon */}
                <div className={`p-4 rounded-full ${type.bgColor} mb-4`}>
                    <Icon className={`h-10 w-10 ${type.color}`} aria-hidden="true" />
                </div>

                {/* Label */}
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{type.label}</h3>

                {/* Description */}
                <p className="text-sm text-gray-600 leading-relaxed">{type.description}</p>
            </CardContent>
        </Card>
    )
}

/**
 * FeedbackTypeSelector - Grid of feedback type options
 * @param {string} selectedType - Currently selected feedback type
 * @param {Function} onTypeChange - Callback when type changes
 */
const FeedbackTypeSelector = ({ selectedType, onTypeChange }) => {
    return (
        <div className="w-full">
            {/* Section Label */}
            <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    What would you like to share?
                </h2>
                <p className="text-gray-600">Select the type of feedback you want to submit.</p>
            </div>

            {/* Type Grid */}
            <div
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
                role="radiogroup"
                aria-label="Feedback type selection"
            >
                {FEEDBACK_TYPES.map((type) => (
                    <FeedbackTypeCard
                        key={type.id}
                        type={type}
                        isSelected={selectedType === type.id}
                        onClick={onTypeChange}
                    />
                ))}
            </div>
        </div>
    )
}

export { FEEDBACK_TYPES }
export default FeedbackTypeSelector
