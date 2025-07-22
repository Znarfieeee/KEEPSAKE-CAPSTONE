import React from "react"
import { Search } from "lucide-react"

const FacilityFilters = ({
    search,
    onSearchChange,
    statusFilter,
    onStatusChange,
    typeFilter,
    onTypeChange,
    planFilter,
    onPlanChange,
}) => {
    const statusOptions = [
        { value: "", label: "All Status" },
        { value: "active", label: "Active" },
        { value: "pending", label: "Pending" },
        { value: "suspended", label: "Suspended" },
    ]

    const typeOptions = [
        { value: "", label: "All Types" },
        { value: "hospital", label: "Hospital" },
        { value: "clinic", label: "Clinic" },
        { value: "bhs", label: "BHS" },
    ]

    const planOptions = [
        { value: "", label: "All Plans" },
        { value: "standard", label: "Standard" },
        { value: "premium", label: "Premium" },
        { value: "enterprise", label: "Enterprise" },
    ]

    return (
        <div className="flex justify-between items-center">
            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500 dark:text-gray-400" />
                <input
                    type="text"
                    placeholder="Search facilities..."
                    value={search}
                    onChange={e => onSearchChange(e.target.value)}
                    className="h-10 w-full rounded-md border border-gray-200 bg-white pl-9 pr-4 text-sm placeholder:text-gray-500 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
            </div>
            <div className="flex gap-4">
                {/* Plan Filter */}
                <div>
                    <select
                        value={planFilter}
                        onChange={e => onPlanChange(e.target.value)}
                        className="h-10 w-full rounded-md border border-gray-200 bg-white px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20">
                        {planOptions.map(option => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Status Filter */}
                <div>
                    <select
                        value={statusFilter}
                        onChange={e => onStatusChange(e.target.value)}
                        className="h-10 w-full rounded-md border border-gray-200 bg-white px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20">
                        {statusOptions.map(option => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Type Filter */}
                <div>
                    <select
                        value={typeFilter}
                        onChange={e => onTypeChange(e.target.value)}
                        className="h-10 w-full rounded-md border border-gray-200 bg-white px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20">
                        {typeOptions.map(option => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
        </div>
    )
}

export default FacilityFilters
