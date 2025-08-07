import React from "react"
import { cn } from "../../util/utils"

const statusClasses = {
    active: "bg-green-100 text-green-700",
    inactive: "bg-red-100 text-red-700",
    suspended: "bg-yellow-100 text-yellow-700",
    pending: "bg-blue-100 text-blue-700",
}

const UserStatusBadge = ({ status = "pending", className = "" }) => {
    return (
        <span
            className={cn(
                "inline-flex items-center justify-center px-2 py-0.5",
                "text-xs font-medium rounded-full w-24",
                statusClasses[status] || statusClasses.pending,
                className
            )}>
            {status}
        </span>
    )
}

export default UserStatusBadge
