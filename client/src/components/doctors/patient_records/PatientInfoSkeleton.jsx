import React from 'react'
import { Skeleton } from '@/components/ui/skeleton'

const PatientInfoSkeleton = () => {
  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header skeleton */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-6" /> {/* Back arrow skeleton */}
          <Skeleton className="h-8 w-64" /> {/* Patient name skeleton */}
        </div>
        <Skeleton className="h-10 w-20" /> {/* Edit button skeleton */}
      </div>

      {/* Tabs skeleton */}
      <div className="space-y-6">
        <div className="border-b">
          <div className="flex gap-4 mb-3">
            <Skeleton className="h-8 w-28" />
            <Skeleton className="h-8 w-28" />
            <Skeleton className="h-8 w-28" />
          </div>
        </div>

        {/* Content area skeleton */}
        <div className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    </div>
  )
}

export default PatientInfoSkeleton
