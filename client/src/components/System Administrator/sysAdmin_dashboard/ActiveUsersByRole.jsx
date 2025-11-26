import React from 'react'

const ActiveUsersByRole = ({ usersByRole = {} }) => {
    const roles = [
        { role: 'Doctors', value: usersByRole.doctor || 0, color: 'bg-blue-600' },
        { role: 'Nurses', value: usersByRole.nurse || 0, color: 'bg-blue-500' },
        { role: 'Facility Admins', value: usersByRole.facility_admin || 0, color: 'bg-blue-400' },
        { role: 'Parents', value: usersByRole.parent || 0, color: 'bg-blue-300' },
    ]

    const max = Math.max(...roles.map((r) => r.value), 1) // Avoid division by zero

    return (
        <div className="bg-white shadow rounded-lg p-4 h-full">
            <h3 className="font-semibold text-gray-700 mb-4">Active Users by Role</h3>
            <div className="space-y-3">
                {roles.map(({ role, value, color }) => (
                    <div key={role}>
                        <div className="flex justify-between text-sm mb-1">
                            <span className="font-medium text-gray-600">{role}</span>
                            <span className="text-gray-800 font-semibold">
                                {value.toLocaleString()}
                            </span>
                        </div>
                        <div className="w-full h-2 bg-gray-200 rounded">
                            <div
                                className={`h-full ${color} rounded transition-all duration-300`}
                                style={{ width: `${(value / max) * 100}%` }}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default ActiveUsersByRole
