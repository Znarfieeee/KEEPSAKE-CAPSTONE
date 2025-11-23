/**
 * FAQCategoryTabs Component
 * Category navigation tabs for filtering FAQs with accessibility features
 */

import React from 'react'
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/badge"
import {
    BookOpen,
    Users,
    Wrench,
    Shield,
    LayoutGrid
} from 'lucide-react'
import { FAQ_CATEGORIES, CATEGORY_INFO } from '@/data/faqContent'

// Icon mapping for categories
const CATEGORY_ICONS = {
    [FAQ_CATEGORIES.GETTING_STARTED]: BookOpen,
    [FAQ_CATEGORIES.ROLE_GUIDES]: Users,
    [FAQ_CATEGORIES.TROUBLESHOOTING]: Wrench,
    [FAQ_CATEGORIES.PRIVACY_SECURITY]: Shield,
}

/**
 * Single Category Tab Button
 */
const CategoryTab = ({
    category,
    isSelected,
    onClick,
    faqCount,
    info
}) => {
    const Icon = category === 'all' ? LayoutGrid : CATEGORY_ICONS[category]
    const label = category === 'all' ? 'All Topics' : info?.label || category
    const description = category === 'all'
        ? 'View all help topics'
        : info?.description || ''

    return (
        <Button
            variant={isSelected ? "default" : "outline"}
            onClick={() => onClick(category)}
            className={`
                flex flex-col items-center justify-center gap-2 p-4 h-auto min-h-[100px] w-full
                rounded-xl transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2
                ${isSelected
                    ? 'bg-cyan-600 text-white shadow-lg hover:bg-cyan-700'
                    : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-cyan-300 hover:bg-cyan-50'
                }
            `}
            aria-pressed={isSelected}
            aria-label={`${label}. ${faqCount} items. ${description}`}
        >
            {/* Icon */}
            {Icon && (
                <Icon
                    className={`h-8 w-8 ${isSelected ? 'text-white' : 'text-cyan-600'}`}
                    aria-hidden="true"
                />
            )}

            {/* Label */}
            <span className="text-base font-semibold text-center leading-tight">
                {label}
            </span>

            {/* Count Badge */}
            <Badge
                variant={isSelected ? "secondary" : "outline"}
                className={`
                    text-xs mt-1
                    ${isSelected
                        ? 'bg-white/20 text-white'
                        : 'bg-gray-100 text-gray-600'
                    }
                `}
            >
                {faqCount} {faqCount === 1 ? 'topic' : 'topics'}
            </Badge>
        </Button>
    )
}

/**
 * FAQCategoryTabs - Grid of category filter tabs
 * @param {string} selectedCategory - Currently selected category
 * @param {Function} onCategoryChange - Callback when category changes
 * @param {Object} categoryCounts - Object with count of FAQs per category
 */
const FAQCategoryTabs = ({
    selectedCategory = 'all',
    onCategoryChange,
    categoryCounts = {}
}) => {
    // Build categories array with 'all' first
    const categories = [
        { id: 'all', info: null },
        ...Object.entries(CATEGORY_INFO).map(([id, info]) => ({ id, info }))
    ]

    // Calculate total for 'all' category
    const totalCount = Object.values(categoryCounts).reduce((sum, count) => sum + count, 0)

    return (
        <div className="w-full">
            {/* Section Label */}
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Browse by Category
            </h2>
            <p className="text-gray-600 mb-6">
                Select a category to filter help topics, or view all topics at once.
            </p>

            {/* Category Grid */}
            <div
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4"
                role="tablist"
                aria-label="FAQ Categories"
            >
                {categories.map(({ id, info }) => (
                    <CategoryTab
                        key={id}
                        category={id}
                        info={info}
                        isSelected={selectedCategory === id}
                        onClick={onCategoryChange}
                        faqCount={id === 'all' ? totalCount : (categoryCounts[id] || 0)}
                    />
                ))}
            </div>
        </div>
    )
}

export default FAQCategoryTabs
