/**
 * FAQSearch Component
 * Search bar for filtering FAQ content with accessibility features
 */

import React, { useState, useCallback, useEffect } from 'react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Search, X } from 'lucide-react'

/**
 * FAQSearch - Accessible search component for FAQs
 * @param {Function} onSearch - Callback when search term changes
 * @param {string} placeholder - Placeholder text for search input
 * @param {number} debounceMs - Debounce delay in milliseconds
 */
const FAQSearch = ({ onSearch, placeholder = 'Search for help topics...', debounceMs = 300 }) => {
    const [searchTerm, setSearchTerm] = useState('')
    const [debouncedTerm, setDebouncedTerm] = useState('')

    // Debounce search term
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedTerm(searchTerm)
        }, debounceMs)

        return () => clearTimeout(timer)
    }, [searchTerm, debounceMs])

    // Trigger search when debounced term changes
    useEffect(() => {
        if (onSearch) {
            onSearch(debouncedTerm)
        }
    }, [debouncedTerm, onSearch])

    const handleInputChange = useCallback((e) => {
        setSearchTerm(e.target.value)
    }, [])

    const handleClear = useCallback(() => {
        setSearchTerm('')
        setDebouncedTerm('')
        if (onSearch) {
            onSearch('')
        }
    }, [onSearch])

    const handleKeyDown = useCallback(
        (e) => {
            if (e.key === 'Escape') {
                handleClear()
            }
        },
        [handleClear]
    )

    return (
        <div className="w-full">
            {/* Search Label for accessibility */}
            <label htmlFor="faq-search" className="block text-lg font-medium text-gray-700 mb-2">
                Search Help Topics
            </label>

            <div className="relative">
                {/* Search Icon */}
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>

                {/* Search Input - Large and accessible */}
                <Input
                    id="faq-search"
                    type="text"
                    value={searchTerm}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    className="w-full pl-12 pr-12 py-4 text-lg border-2 border-gray-300 rounded-xl focus:border-cyan-500 focus:ring-cyan-500 focus:ring-2 transition-colors"
                    style={{ minHeight: '56px', fontSize: '18px' }}
                    aria-label="Search FAQs"
                    aria-describedby="search-help"
                />

                {/* Clear Button */}
                {searchTerm && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleClear}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center hover:bg-transparent"
                        aria-label="Clear search"
                    >
                        <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    </Button>
                )}
            </div>

            {/* Helper Text */}
            <p id="search-help" className="mt-2 text-sm text-gray-500">
                Type keywords to find answers to your questions. Press Escape to clear.
            </p>

            {/* Search Results Count */}
            {searchTerm && (
                <div className="mt-3 text-base text-gray-600" role="status" aria-live="polite">
                    {debouncedTerm ? (
                        <span>
                            Showing results for: <strong>"{debouncedTerm}"</strong>
                        </span>
                    ) : (
                        <span>Searching...</span>
                    )}
                </div>
            )}
        </div>
    )
}

export default FAQSearch
