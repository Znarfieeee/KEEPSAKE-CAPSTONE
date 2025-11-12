import React from 'react'

export const DocumentSkeleton = () => {
    return (
        <div className="grid grid-cols-1 gap-4">
            {[1, 2, 3].map((i) => (
                <div
                    key={i}
                    className="p-4 rounded-lg border-2 bg-gray-50 border-gray-200 animate-pulse"
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                            {/* Icon skeleton */}
                            <div className="flex-shrink-0">
                                <div className="w-8 h-8 bg-gray-300 rounded" />
                            </div>

                            <div className="flex-1 min-w-0 space-y-3">
                                {/* Title and badge */}
                                <div className="flex items-center gap-2">
                                    <div className="h-4 bg-gray-300 rounded w-1/3" />
                                    <div className="h-5 bg-gray-300 rounded-full w-24" />
                                </div>

                                {/* Metadata lines */}
                                <div className="space-y-1">
                                    <div className="flex items-center gap-3">
                                        <div className="h-3 bg-gray-300 rounded w-32" />
                                        <div className="h-3 bg-gray-300 rounded w-24" />
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="h-3 bg-gray-300 rounded w-20" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Action buttons skeleton */}
                        <div className="flex items-center gap-2 ml-4">
                            <div className="w-9 h-9 bg-gray-300 rounded border border-gray-400" />
                            <div className="w-9 h-9 bg-gray-300 rounded border border-gray-400" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}

export default DocumentSkeleton
