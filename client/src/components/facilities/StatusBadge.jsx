import React from "react"
import { cn } from "../../util/utils"

const statusClasses = {
    active: "bg-green-100 text-green-700",
    pending: "bg-yellow-100 text-yellow-700",
    suspended: "bg-red-100 text-red-700",
}

const StatusBadge = ({ status = "pending", className = "" }) => {
    return (
        <span
            className={cn(
                "inline-flex items-center justify-center px-2.5 py-0.5",
                "text-xs font-medium rounded-full w-24",
                statusClasses[status] || statusClasses.pending,
                className
            )}>
            {status}
        </span>
    )
}

export default StatusBadge
