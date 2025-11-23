import { Skeleton } from '@/components/ui/skeleton'

const TwoFactorSettingsSkeleton = () => {
    return (
        <div className="max-w-2xl space-y-6">
            <div className="rounded-lg p-6 bg-white relative min-h-[200px]">
                <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                        <Skeleton className="h-8 w-8 rounded-full" />
                    </div>
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-6 w-1/3" />
                        <Skeleton className="h-4 w-2/3" />
                        <div className="mt-2">
                            <Skeleton className="h-4 w-1/4" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                    <Skeleton className="h-5 w-5 rounded-full" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-1/2" />
                        <Skeleton className="h-3 w-full" />
                    </div>
                </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
                <Skeleton className="h-6 w-1/3 mb-4" />
                <div className="space-y-3">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <div className="flex justify-end gap-3 mt-2">
                        <Skeleton className="h-10 w-24" />
                        <Skeleton className="h-10 w-36" />
                    </div>
                </div>
            </div>
        </div>
    )
}

export default TwoFactorSettingsSkeleton
