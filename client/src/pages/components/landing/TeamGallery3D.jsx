import React, { useState } from 'react'
import { ChevronRight } from 'lucide-react'

/**
 * TeamGallery3D Component
 * Large screens: 3D gallery with text overlays on each team member card
 * Small screens: Infinite loop carousel with next button
 */
const TeamGallery3D = ({ teamMembers = [] }) => {
    const [activeIndex, setActiveIndex] = useState(null)
    const [currentCarouselIndex, setCurrentCarouselIndex] = useState(0)

    if (!teamMembers || teamMembers.length === 0) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-500">No team members to display</p>
            </div>
        )
    }

    // Carousel navigation - infinite loop
    const goToNext = () => {
        setCurrentCarouselIndex((prevIndex) => (prevIndex + 1) % teamMembers.length)
    }

    return (
        <>
            {/* Mobile Carousel - visible on small screens only */}
            <div className="block md:hidden relative w-full py-8">
                <div className="relative w-full max-w-sm mx-auto px-4">
                    {/* Carousel Card */}
                    <div className="relative w-full h-[500px] rounded-xl overflow-hidden shadow-2xl">
                        {/* Background Image */}
                        <div
                            className="absolute inset-0 bg-cover bg-center"
                            style={{
                                backgroundImage: `url(${teamMembers[currentCarouselIndex].image})`,
                            }}
                        />

                        {/* Gradient Overlay */}
                        <div className="absolute bottom-0 left-0 right-0 h-2/3 bg-gradient-to-t from-black/95 via-black/60 to-transparent" />

                        {/* Text Content */}
                        <div className="absolute bottom-0 left-0 right-0 flex flex-col justify-end p-6">
                            {/* Role */}
                            <p className="text-sm font-semibold text-blue-400 mb-2 uppercase tracking-widest">
                                {teamMembers[currentCarouselIndex].role}
                            </p>

                            {/* Name */}
                            <h3 className="text-2xl font-bold text-white mb-3 leading-tight">
                                {teamMembers[currentCarouselIndex].name}
                            </h3>

                            {/* Bio */}
                            <p className="text-sm text-gray-200 leading-relaxed mb-6">
                                {teamMembers[currentCarouselIndex].bio}
                            </p>
                        </div>
                    </div>

                    {/* Next Button */}
                    <button
                        onClick={goToNext}
                        className="absolute top-1/2 -translate-y-1/2 -right-2 z-10 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-3 shadow-lg transition-all duration-300 hover:scale-110"
                        aria-label="Next team member"
                    >
                        <ChevronRight className="h-6 w-6" />
                    </button>

                    {/* Dots Indicator */}
                    <div className="flex justify-center gap-2 mt-6">
                        {teamMembers.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrentCarouselIndex(index)}
                                className={`h-2 rounded-full transition-all duration-300 ${
                                    index === currentCarouselIndex
                                        ? 'w-8 bg-blue-600'
                                        : 'w-2 bg-gray-300 hover:bg-gray-400'
                                }`}
                                aria-label={`Go to team member ${index + 1}`}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* Desktop 3D Gallery - visible on medium screens and up */}
            <div className="hidden md:block relative w-full py-12 overflow-visible">
                <div
                    className="flex justify-center items-center gap-3 md:gap-4 lg:gap-6 mx-auto overflow-visible"
                    style={{
                        perspective: '1200px',
                        maxWidth: '1400px',
                        minHeight: '500px'
                    }}
                >
                    {teamMembers.map((member, index) => {
                        const isActive = activeIndex === index

                        return (
                            <div
                                key={index}
                                className="relative cursor-pointer transition-all duration-700 ease-out will-change-transform flex-shrink-0 rounded-lg"
                                style={{
                                    width: isActive ? 'clamp(300px, 40vw, 450px)' : 'clamp(120px, 18vw, 220px)',
                                    height: 'clamp(400px, 50vh, 550px)',
                                    filter: isActive ? 'grayscale(0) brightness(1)' : 'grayscale(0.8) brightness(0.6)',
                                    transform: isActive ? 'translateZ(80px) scale(1.05)' : 'translateZ(0)',
                                    zIndex: isActive ? 100 : 'auto',
                                    willChange: 'transform, filter, width',
                                    overflow: 'hidden'
                                }}
                                onMouseEnter={() => setActiveIndex(index)}
                                onMouseLeave={() => setActiveIndex(null)}
                                onFocus={() => setActiveIndex(index)}
                                onBlur={() => setActiveIndex(null)}
                                tabIndex={0}
                                role="button"
                                aria-label={`${member.name} - ${member.role}`}
                            >
                                {/* Background Image */}
                                <div
                                    className="absolute inset-0 bg-cover bg-center rounded-lg shadow-lg"
                                    style={{
                                        backgroundImage: `url(${member.image})`,
                                    }}
                                />

                                {/* Gradient Overlay - Only bottom half, darkens on hover */}
                                <div
                                    className={`absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-black/90 via-black/50 to-transparent rounded-b-lg transition-opacity duration-500 ${
                                        isActive ? 'opacity-100' : 'opacity-70'
                                    }`}
                                />

                                {/* Text Content - Fades in on hover */}
                                <div
                                    className={`absolute bottom-0 left-0 right-0 flex flex-col justify-end p-4 md:p-6 transition-all duration-500 ${
                                        isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                                    }`}
                                >
                                    {/* Role - Small text above name */}
                                    <p className="text-xs md:text-sm font-semibold text-blue-400 mb-1 md:mb-2 uppercase tracking-widest truncate">
                                        {member.role}
                                    </p>

                                    {/* Name - Large and bold */}
                                    <h3 className="text-xl md:text-3xl lg:text-4xl font-bold text-white mb-2 md:mb-3 leading-tight break-words">
                                        {member.name}
                                    </h3>

                                    {/* Bio - Description */}
                                    <p className="text-xs md:text-sm lg:text-base text-gray-200 leading-relaxed line-clamp-2 md:line-clamp-3">
                                        {member.bio}
                                    </p>
                                </div>

                                {/* Focus Ring */}
                                <div
                                    className={`absolute inset-0 rounded-lg transition-all duration-300 ${
                                        isActive ? 'ring-2 ring-blue-500 ring-offset-2' : ''
                                    }`}
                                />
                            </div>
                        )
                    })}
                </div>
            </div>
        </>
    )
}

export default TeamGallery3D
