import React, { useState, useEffect, useMemo } from 'react'
import PageHeader from '@/pages/components/landing/PageHeader'
import SectionContainer from '@/pages/components/landing/SectionContainer'
import Footer4Col from '@/components/mvpblocks/footer-4col'
import { getPublicFacilities } from '@/api/public/facilities'
import {
    MapPin,
    Phone,
    Mail,
    Building2,
    Search,
    AlertCircle,
    X
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

// Skeleton component for loading state
const FacilitySkeleton = () => (
    <div className="bg-white rounded-xl shadow-lg p-6">
        <Skeleton className="h-6 w-20 mb-4" />
        <div className="flex items-start gap-2 mb-4">
            <Skeleton className="h-6 w-6 flex-shrink-0" />
            <Skeleton className="h-6 flex-1" />
        </div>
        <div className="space-y-3">
            <div className="flex items-start gap-3">
                <Skeleton className="h-5 w-5 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                </div>
            </div>
            <div className="flex items-center gap-3">
                <Skeleton className="h-5 w-5 flex-shrink-0" />
                <Skeleton className="h-4 w-32" />
            </div>
            <div className="flex items-center gap-3">
                <Skeleton className="h-5 w-5 flex-shrink-0" />
                <Skeleton className="h-4 w-48" />
            </div>
        </div>
    </div>
)

const ClinicsPage = () => {
    const [facilities, setFacilities] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedCity, setSelectedCity] = useState('')

    useEffect(() => {
        fetchFacilities()
    }, [])

    const fetchFacilities = async () => {
        try {
            setLoading(true)
            setError(null)
            const response = await getPublicFacilities()

            if (response?.status === 'success') {
                setFacilities(response.data || [])
            } else {
                setError('Failed to load clinics')
            }
        } catch (err) {
            console.error('Error fetching facilities:', err)
            setError('Failed to load clinics. Please try again later.')
        } finally {
            setLoading(false)
        }
    }

    // Get unique cities for filter dropdown
    const cities = useMemo(() => {
        const uniqueCities = [...new Set(facilities.map(f => f.city).filter(Boolean))]
        return uniqueCities.sort()
    }, [facilities])

    // Filter facilities based on search and city
    const filteredFacilities = useMemo(() => {
        return facilities.filter(facility => {
            const matchesSearch = !searchTerm ||
                facility.facility_name?.toLowerCase().includes(searchTerm.toLowerCase())

            const matchesCity = !selectedCity ||
                facility.city?.toLowerCase() === selectedCity.toLowerCase()

            return matchesSearch && matchesCity
        })
    }, [facilities, searchTerm, selectedCity])

    const clearFilters = () => {
        setSearchTerm('')
        setSelectedCity('')
    }

    const hasActiveFilters = searchTerm || selectedCity

    // Loading State
    if (loading) {
        return (
            <>
                <PageHeader
                    title="Our Partner Clinics"
                    subtitle="Find healthcare facilities using KEEPSAKE"
                />
                <SectionContainer background="bg-gray-50">
                    {/* Search and Filter Skeleton */}
                    <div className="max-w-6xl mx-auto mb-8">
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <div className="flex flex-col md:flex-row gap-4">
                                <Skeleton className="flex-1 h-12" />
                                <Skeleton className="md:w-64 h-12" />
                            </div>
                        </div>
                    </div>

                    {/* Facility Cards Skeletons */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <FacilitySkeleton key={i} />
                        ))}
                    </div>
                </SectionContainer>
                <Footer4Col />
            </>
        )
    }

    // Error State
    if (error) {
        return (
            <>
                <PageHeader
                    title="Our Partner Clinics"
                    subtitle="Find healthcare facilities using KEEPSAKE"
                />
                <SectionContainer>
                    <div className="flex flex-col items-center justify-center py-20">
                        <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">
                            Oops! Something went wrong
                        </h3>
                        <p className="text-gray-600 mb-6">{error}</p>
                        <button
                            onClick={fetchFacilities}
                            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Try Again
                        </button>
                    </div>
                </SectionContainer>
                <Footer4Col />
            </>
        )
    }

    return (
        <>
            <PageHeader
                title="Our Partner Clinics"
                subtitle="Find healthcare facilities near you that use KEEPSAKE"
            />

            <SectionContainer background="bg-gray-50">
                {/* Search and Filter Bar */}
                <div className="max-w-6xl mx-auto mb-8">
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex flex-col md:flex-row gap-4">
                            {/* Search Input */}
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search by facility name..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                />
                            </div>

                            {/* City Filter */}
                            <div className="md:w-64">
                                <select
                                    value={selectedCity}
                                    onChange={(e) => setSelectedCity(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                >
                                    <option value="">All Cities</option>
                                    {cities.map((city) => (
                                        <option key={city} value={city}>
                                            {city}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Clear Filters Button */}
                            {hasActiveFilters && (
                                <button
                                    onClick={clearFilters}
                                    className="px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap"
                                >
                                    <X className="h-4 w-4" />
                                    Clear Filters
                                </button>
                            )}
                        </div>

                        {/* Results Count */}
                        <div className="mt-4 text-sm text-gray-600">
                            Showing {filteredFacilities.length} of {facilities.length} clinic
                            {facilities.length !== 1 ? 's' : ''}
                        </div>
                    </div>
                </div>

                {/* Facilities Grid */}
                {filteredFacilities.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                        {filteredFacilities.map((facility, idx) => (
                            <div
                                key={idx}
                                className="bg-white rounded-xl shadow-lg p-6 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
                            >
                                {/* Facility Type Badge */}
                                {facility.type && (
                                    <Badge
                                        variant="secondary"
                                        className="mb-4 bg-blue-100 text-blue-700 hover:bg-blue-200"
                                    >
                                        {facility.type}
                                    </Badge>
                                )}

                                {/* Facility Name */}
                                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-start gap-2">
                                    <Building2 className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" />
                                    <span>{facility.facility_name}</span>
                                </h3>

                                {/* Address */}
                                {facility.address && (
                                    <div className="flex items-start gap-3 mb-3 text-gray-600">
                                        <MapPin className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                                        <div className="text-sm">
                                            <p>{facility.address}</p>
                                            {(facility.city || facility.zip_code) && (
                                                <p>
                                                    {facility.city}
                                                    {facility.city && facility.zip_code && ', '}
                                                    {facility.zip_code}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Contact Number */}
                                {facility.contact_number && (
                                    <a
                                        href={`tel:${facility.contact_number}`}
                                        className="flex items-center gap-3 mb-3 text-gray-600 hover:text-blue-600 transition-colors group"
                                    >
                                        <Phone className="h-5 w-5 text-purple-600 group-hover:text-blue-600 flex-shrink-0" />
                                        <span className="text-sm">{facility.contact_number}</span>
                                    </a>
                                )}

                                {/* Email */}
                                {facility.email && (
                                    <a
                                        href={`mailto:${facility.email}`}
                                        className="flex items-center gap-3 text-gray-600 hover:text-blue-600 transition-colors group"
                                    >
                                        <Mail className="h-5 w-5 text-orange-600 group-hover:text-blue-600 flex-shrink-0" />
                                        <span className="text-sm break-all">{facility.email}</span>
                                    </a>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    /* Empty State */
                    <div className="flex flex-col items-center justify-center py-20">
                        <Building2 className="h-20 w-20 text-gray-300 mb-4" />
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">
                            No Clinics Found
                        </h3>
                        <p className="text-gray-600 mb-6 text-center max-w-md">
                            {hasActiveFilters
                                ? "We couldn't find any clinics matching your search criteria. Try adjusting your filters."
                                : "There are currently no active clinics to display."}
                        </p>
                        {hasActiveFilters && (
                            <button
                                onClick={clearFilters}
                                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Clear Filters
                            </button>
                        )}
                    </div>
                )}
            </SectionContainer>

            <Footer4Col />
        </>
    )
}

export default ClinicsPage
