import * as React from 'react'
import { cn } from '../../util/utils'
import { getUserStatusBadgeColor, formatUserStatus, getStatusBadgeColor } from '../../util/utils'

// Generic Status Badge
export const StatusBadge = React.forwardRef(({ status = 'pending', className, ...props }, ref) => {
    const displayText = React.useMemo(() => {
        return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()
    }, [status])

    return (
        <span
            ref={ref}
            className={cn(
                'px-2.5 py-0.5 text-xs font-medium rounded-full whitespace-nowrap',
                getStatusBadgeColor(status),
                className
            )}
            {...props}
        >
            {displayText}
        </span>
    )
})

StatusBadge.displayName = 'StatusBadge'

// User-specific status badge with proper formatting and enhanced styling
export const UserStatusBadge = React.forwardRef(
    ({ status = 'pending', className, ...props }, ref) => {
        const formattedText = React.useMemo(() => formatUserStatus(status), [status])

        return (
            <span
                ref={ref}
                className={cn(
                    'px-2.5 py-0.5 text-xs font-medium rounded-full whitespace-nowrap inline-flex items-center gap-1',
                    getUserStatusBadgeColor(status),
                    className
                )}
                {...props}
            >
                <span
                    className={cn(
                        'size-1.5 rounded-full',
                        status === 'active' && 'bg-green-500',
                        status === 'inactive' && 'bg-gray-500',
                        status === 'suspended' && 'bg-red-500',
                        status === 'pending' && 'bg-yellow-500'
                    )}
                />
                {formattedText}
            </span>
        )
    }
)

UserStatusBadge.displayName = 'UserStatusBadge'

export const FacilityStatusBadge = React.forwardRef(
    ({ status = 'pending', className, ...props }, ref) => (
        <StatusBadge
            ref={ref}
            status={status}
            className={cn('font-medium', className)}
            {...props}
        />
    )
)

FacilityStatusBadge.displayName = 'FacilityStatusBadge'

export const TokenStatusBadge = React.forwardRef((props, ref) => (
    <StatusBadge ref={ref} type="token" {...props} />
))
TokenStatusBadge.displayName = 'TokenStatusBadge'

export default StatusBadge
