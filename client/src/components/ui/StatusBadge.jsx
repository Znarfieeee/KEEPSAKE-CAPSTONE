import * as React from "react"
import { cn } from "../../util/utils"
// import { statusBadgeVariants } from "./status-badge"

export const StatusBadge = React.forwardRef(
    ({ status = "pending", className, type = "default", ...props }, ref) => {
        const displayText = React.useMemo(() => {
            return (
                status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()
            )
        }, [status])

        return (
            <span
                ref={ref}
                className={cn(
                    // statusBadgeVariants({ type }),
                    // getStatusStyles(status),
                    className
                )}
                {...props}>
                {displayText}
            </span>
        )
    }
)

StatusBadge.displayName = "StatusBadge"

// Preset configurations with proper ref forwarding
export const UserStatusBadge = React.forwardRef((props, ref) => (
    <StatusBadge ref={ref} type="user" {...props} />
))
UserStatusBadge.displayName = "UserStatusBadge"

export const FacilityStatusBadge = React.forwardRef((props, ref) => (
    <StatusBadge ref={ref} type="facility" {...props} />
))
FacilityStatusBadge.displayName = "FacilityStatusBadge"

export const TokenStatusBadge = React.forwardRef((props, ref) => (
    <StatusBadge ref={ref} type="token" {...props} />
))
TokenStatusBadge.displayName = "TokenStatusBadge"

export default StatusBadge
