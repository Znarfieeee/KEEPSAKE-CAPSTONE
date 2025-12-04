import React from 'react'

/**
 * PageHeader Component
 * Reusable hero section for public pages
 *
 * @param {string} title - Main heading text
 * @param {string} subtitle - Supporting description text
 * @param {boolean} gradient - Whether to apply background gradient (default: true)
 */
const PageHeader = ({ title, subtitle, gradient = true }) => {
    const backgroundClass = gradient
        ? 'bg-gradient-to-b from-blue-50 via-white to-blue-50'
        : 'bg-white'

    return (
        <section className={`py-16 md:py-24 ${backgroundClass}`}>
            <div className="max-w-7xl mx-auto px-6 text-center">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 leading-tight">
                    {title}
                </h1>
                {subtitle && (
                    <p className="text-lg md:text-xl text-gray-600 mt-4 max-w-3xl mx-auto leading-relaxed">
                        {subtitle}
                    </p>
                )}
            </div>
        </section>
    )
}

export default PageHeader
