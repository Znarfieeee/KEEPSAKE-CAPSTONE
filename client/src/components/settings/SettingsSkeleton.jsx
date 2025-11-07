const SettingsSkeleton = () => {
    return (
        <div className="space-y-6 animate-pulse">
            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="space-y-2">
                        <div className="h-4 w-24 bg-gray-200 rounded" />
                        <div className="h-10 bg-gray-200 rounded" />
                    </div>
                ))}
            </div>

            {/* Button */}
            <div className="flex justify-end pt-6 border-t">
                <div className="h-10 w-32 bg-gray-200 rounded" />
            </div>
        </div>
    )
}

export default SettingsSkeleton
