import React, { useState } from 'react'

/**
 * TeamGallery3D Component
 * 3D gallery with text overlays on each team member card
 * Text appears on hover with fade effect
 */
const TeamGallery3D = ({ teamMembers = [] }) => {
    const [activeIndex, setActiveIndex] = useState(null)

    if (!teamMembers || teamMembers.length === 0) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-500">No team members to display</p>
            </div>
        )
    }

    return (
        <div className="relative w-full py-12 overflow-visible">
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
    )
}

export default TeamGallery3D
