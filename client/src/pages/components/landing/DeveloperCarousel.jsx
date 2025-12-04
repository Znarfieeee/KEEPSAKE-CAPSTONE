import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Linkedin } from 'lucide-react'

/**
 * DeveloperCarousel Component
 * Auto-rotating carousel displaying team members with manual controls
 *
 * Features:
 * - Auto-advance every 5 seconds
 * - Manual prev/next buttons
 * - Pause on hover
 * - Infinite scroll
 * - Responsive: 1 card (mobile) → 2 cards (tablet) → 4 cards (desktop)
 *
 * @param {Array} teamMembers - Array of team member objects { name, role, bio, image, linkedin }
 */
const DeveloperCarousel = ({ teamMembers = [] }) => {
    const [currentIndex, setCurrentIndex] = useState(0)
    const [isPaused, setIsPaused] = useState(false)
    const [direction, setDirection] = useState(0) // -1 for left, 1 for right

    // Auto-advance interval (5 seconds)
    const AUTO_ADVANCE_INTERVAL = 5000

    // Return early if no team members
    if (!teamMembers || teamMembers.length === 0) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-500">No team members to display</p>
            </div>
        )
    }

    // Get number of slides based on screen size
    const getVisibleCards = () => {
        if (typeof window === 'undefined') return 1
        const width = window.innerWidth
        if (width >= 1024) return 4 // Desktop: show all 4
        if (width >= 768) return 2  // Tablet: show 2
        return 1 // Mobile: show 1
    }

    const [visibleCards, setVisibleCards] = useState(getVisibleCards())

    // Handle window resize
    useEffect(() => {
        const handleResize = () => {
            setVisibleCards(getVisibleCards())
        }

        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    const nextSlide = useCallback(() => {
        if (teamMembers.length === 0) return
        setDirection(1)
        setCurrentIndex((prev) => (prev + 1) % teamMembers.length)
    }, [teamMembers.length])

    const prevSlide = useCallback(() => {
        if (teamMembers.length === 0) return
        setDirection(-1)
        setCurrentIndex((prev) =>
            prev === 0 ? teamMembers.length - 1 : prev - 1
        )
    }, [teamMembers.length])

    // Auto-advance logic
    useEffect(() => {
        if (isPaused || teamMembers.length === 0) return

        const interval = setInterval(() => {
            nextSlide()
        }, AUTO_ADVANCE_INTERVAL)

        return () => clearInterval(interval)
    }, [currentIndex, isPaused, teamMembers.length, nextSlide])

    // Animation variants
    const slideVariants = {
        enter: (direction) => ({
            x: direction > 0 ? 1000 : -1000,
            opacity: 0
        }),
        center: {
            zIndex: 1,
            x: 0,
            opacity: 1
        },
        exit: (direction) => ({
            zIndex: 0,
            x: direction < 0 ? 1000 : -1000,
            opacity: 0
        })
    }

    const swipeConfidenceThreshold = 10000
    const swipePower = (offset, velocity) => {
        return Math.abs(offset) * velocity
    }

    // Get visible team members based on current index
    const getVisibleMembers = () => {
        const members = []
        for (let i = 0; i < visibleCards; i++) {
            const index = (currentIndex + i) % teamMembers.length
            members.push(teamMembers[index])
        }
        return members
    }

    return (
        <div
            className="relative w-full max-w-7xl mx-auto px-6"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
        >
            {/* Carousel Container */}
            <div className="relative overflow-hidden">
                <AnimatePresence initial={false} custom={direction}>
                    <motion.div
                        key={currentIndex}
                        custom={direction}
                        variants={slideVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{
                            x: { type: "spring", stiffness: 300, damping: 30 },
                            opacity: { duration: 0.2 }
                        }}
                        drag="x"
                        dragConstraints={{ left: 0, right: 0 }}
                        dragElastic={1}
                        onDragEnd={(e, { offset, velocity }) => {
                            const swipe = swipePower(offset.x, velocity.x)

                            if (swipe < -swipeConfidenceThreshold) {
                                nextSlide()
                            } else if (swipe > swipeConfidenceThreshold) {
                                prevSlide()
                            }
                        }}
                        className={`grid gap-6 ${
                            visibleCards === 1 ? 'grid-cols-1' :
                            visibleCards === 2 ? 'grid-cols-2' :
                            'grid-cols-4'
                        }`}
                    >
                        {getVisibleMembers().map((member, idx) => (
                            <div
                                key={`${member.name}-${idx}`}
                                className="bg-white rounded-xl shadow-lg p-6 hover:shadow-2xl transition-shadow duration-300"
                            >
                                <div className="aspect-square mb-4 overflow-hidden rounded-lg bg-gray-200">
                                    <img
                                        src={member.image || '/placeholder-team.jpg'}
                                        alt={member.name}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            e.target.src = '/placeholder-team.jpg'
                                        }}
                                    />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-1">
                                    {member.name}
                                </h3>
                                <p className="text-blue-600 font-medium mb-3">
                                    {member.role}
                                </p>
                                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                                    {member.bio}
                                </p>
                                {member.linkedin && (
                                    <a
                                        href={member.linkedin}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors"
                                    >
                                        <Linkedin className="h-5 w-5" />
                                        <span className="text-sm">LinkedIn</span>
                                    </a>
                                )}
                            </div>
                        ))}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Navigation Buttons */}
            <button
                onClick={prevSlide}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 bg-white rounded-full p-3 shadow-lg hover:bg-gray-100 transition-all duration-300 hover:scale-110 z-10"
                aria-label="Previous slide"
            >
                <ChevronLeft className="h-6 w-6 text-gray-800" />
            </button>

            <button
                onClick={nextSlide}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 bg-white rounded-full p-3 shadow-lg hover:bg-gray-100 transition-all duration-300 hover:scale-110 z-10"
                aria-label="Next slide"
            >
                <ChevronRight className="h-6 w-6 text-gray-800" />
            </button>

            {/* Pause Indicator */}
            {isPaused && (
                <div className="absolute top-4 right-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                    Paused
                </div>
            )}
        </div>
    )
}

export default DeveloperCarousel
