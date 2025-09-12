import React from 'react'

const AppointmentLoadingSkeleton = () => {
    return (
        <div className="space-y-6 min-h-screen animate-pulse">
            {/* Top row: Today's Schedule and Calendar side by side */}
            <div className="grid grid-cols-1 lg:grid-cols-6 lg:grid-rows-[minmax(400px,_1fr)] gap-6">
                {/* Today's Schedule Skeleton - Takes 4/6 of the width */}
                <div className="lg:col-span-4 h-full">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full">
                        <div className="p-6 border-b border-gray-200">
                            <div className="h-6 w-48 bg-gray-200 rounded mb-2"></div>
                            <div className="h-4 w-32 bg-gray-200 rounded"></div>
                        </div>
                        <div className="p-4">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="flex items-center space-x-4 mb-4 last:mb-0">
                                    <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                                    <div className="flex-1">
                                        <div className="h-4 w-32 bg-gray-200 rounded mb-2"></div>
                                        <div className="h-3 w-24 bg-gray-200 rounded"></div>
                                    </div>
                                    <div className="flex space-x-2">
                                        <div className="h-8 w-16 bg-gray-200 rounded"></div>
                                        <div className="h-8 w-20 bg-gray-200 rounded"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Calendar View Skeleton - Takes 2/6 of the width */}
                <div className="lg:col-span-2 h-full">
                    <div className="mb-4">
                        <div className="h-6 w-40 bg-gray-200 rounded mb-2"></div>
                        <div className="h-4 w-56 bg-gray-200 rounded"></div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-200 h-[calc(100%-3.5rem)]">
                        <div className="h-5 w-32 bg-gray-200 rounded mb-4"></div>
                        <div className="grid grid-cols-7 gap-1">
                            {[...Array(35)].map((_, i) => (
                                <div
                                    key={i}
                                    className={`h-10 bg-gray-200 rounded ${i < 7 ? 'h-8' : ''}`}
                                ></div>
                            ))}
                        </div>
                        <div className="mt-4 flex items-center space-x-4">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="flex items-center space-x-2">
                                    <div className="h-3 w-3 bg-gray-200 rounded-full"></div>
                                    <div className="h-3 w-16 bg-gray-200 rounded"></div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom row: All Appointments Skeleton */}
            <div className="w-full bg-white rounded-lg shadow-sm">
                <div className="p-6 border-b border-gray-200">
                    <div className="flex justify-between items-center">
                        <div>
                            <div className="h-6 w-40 bg-gray-200 rounded mb-2"></div>
                            <div className="h-4 w-56 bg-gray-200 rounded"></div>
                        </div>
                        <div className="flex space-x-2">
                            <div className="h-10 w-32 bg-gray-200 rounded"></div>
                            <div className="h-10 w-48 bg-gray-200 rounded"></div>
                        </div>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <div className="min-w-full">
                        {/* Table Header */}
                        <div className="bg-gray-50 border-b border-gray-200">
                            <div className="grid grid-cols-6 gap-4 px-6 py-3">
                                {[...Array(6)].map((_, i) => (
                                    <div key={i} className="h-4 bg-gray-200 rounded"></div>
                                ))}
                            </div>
                        </div>
                        {/* Table Body */}
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="border-b border-gray-200">
                                <div className="grid grid-cols-6 gap-4 px-6 py-4">
                                    {[...Array(6)].map((_, j) => (
                                        <div key={j} className="h-4 bg-gray-200 rounded"></div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default AppointmentLoadingSkeleton
