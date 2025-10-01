import React from 'react'
import TotalFacilities from '@/components/System Administrator/sysAdmin_dashboard/TotalFacilities'
import ActiveUsers from '@/components/System Administrator/sysAdmin_dashboard/ActiveUsers'
import SystemHealth from '@/components/System Administrator/sysAdmin_dashboard/SystemHealth'
import MonthlyRevenue from '@/components/System Administrator/sysAdmin_dashboard/MonthlyRevenue'
import ActiveUsersByRole from '@/components/System Administrator/sysAdmin_dashboard/ActiveUsersByRole'
import SystemMonitoring from '@/components/System Administrator/sysAdmin_dashboard/SystemMonitoring'
import FacilitySubscriptions from '@/components/System Administrator/sysAdmin_dashboard/FacilitySubscriptions'
import ParentSubscriptions from '@/components/System Administrator/sysAdmin_dashboard/ParentSubscriptions'
import RevenueSources from '@/components/System Administrator/sysAdmin_dashboard/RevenueSources'

const FadminDashboard = () => {
    return (
        <div className="p-6">
            <div className="grid grid-cols-12 grid-rows-6 gap-4">
                {/* Top stats */}
                <div className="col-span-3 row-span-1">
                    <TotalFacilities />
                </div>
                <div className="col-span-3 row-span-1">
                    <ActiveUsers />
                </div>
                <div className="col-span-3 row-span-1">
                    <SystemHealth />
                </div>
                <div className="col-span-3 row-span-1">
                    <MonthlyRevenue />
                </div>

                {/* Middle row */}
                <div className="col-span-6 row-span-2">
                    <ActiveUsersByRole />
                </div>
                <div className="col-span-6 row-span-2">
                    <SystemMonitoring />
                </div>

                {/* Bottom row */}
                <div className="col-span-4 row-span-2">
                    <FacilitySubscriptions />
                </div>
                <div className="col-span-4 row-span-2">
                    <ParentSubscriptions />
                </div>
                <div className="col-span-4 row-span-2">
                    <RevenueSources />
                </div>
            </div>
        </div>
    )
}

export default FadminDashboard
