import React from 'react'

const LoadingSkeleton = () => {
  return (
    <div className="container mx-auto px-4 py-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex items-center gap-2 mb-6">
        <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
        <div className="h-8 w-64 bg-gray-200 rounded"></div>
      </div>

      {/* Tabs Skeleton */}
      <div className="flex gap-4 mb-6 border-b">
        {[1, 2, 3].map((tab) => (
          <div key={tab} className="h-10 w-32 bg-gray-200 rounded"></div>
        ))}
      </div>

      {/* Content Skeleton */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="h-6 w-48 bg-gray-200 rounded mb-4"></div>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((item) => (
              <div key={item}>
                <div className="h-4 w-24 bg-gray-200 rounded mb-2"></div>
                <div className="h-6 w-32 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((item) => (
              <div key={item}>
                <div className="h-4 w-24 bg-gray-200 rounded mb-2"></div>
                <div className="h-6 w-32 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Screening Tests Skeleton */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="h-6 w-48 bg-gray-200 rounded mb-4"></div>
        <div className="space-y-4">
          {[1, 2, 3].map((item) => (
            <div key={item} className="grid grid-cols-5 gap-4">
              <div className="h-6 w-full bg-gray-200 rounded"></div>
              <div className="h-6 w-full bg-gray-200 rounded"></div>
              <div className="h-6 w-full bg-gray-200 rounded"></div>
              <div className="h-6 w-full bg-gray-200 rounded"></div>
              <div className="h-6 w-full bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default LoadingSkeleton
