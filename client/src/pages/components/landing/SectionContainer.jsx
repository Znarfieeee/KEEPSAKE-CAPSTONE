import React from 'react'

/**
 * SectionContainer Component
 * Provides consistent max-width and spacing for page sections
 *
 * @param {React.ReactNode} children - Content to be wrapped
 * @param {string} className - Additional Tailwind classes to apply
 * @param {string} background - Background color class (default: '')
 */
const SectionContainer = ({ children, className = '', background = '' }) => {
    return (
        <section className={`${background}`}>
            <div className={`max-w-7xl mx-auto px-6 py-16 md:py-20 ${className}`}>
                {children}
            </div>
        </section>
    )
}

export default SectionContainer
