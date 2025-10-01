import React from 'react'
import { User } from 'lucide-react'

const AppointmentRow = ({ appointment, showActions = true }) => (
    <div className="flex items-center justify-between p-4 border-b border-b-gray-200 hover:bg-gray-50">
        <div className="flex items-center space-x-4">
            <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-blue-600" />
            </div>
            <div>
                <p className="font-medium text-gray-900">{appointment.name}</p>
                <p className="text-sm text-gray-500">
                    {appointment.time} • {appointment.type}
                </p>
            </div>
        </div>
        {showActions && (
            <div className="flex items-center space-x-2">
                <button className="px-3 py-1 text-red-600 hover:bg-red-50 rounded">Cancel</button>
                <button className="px-4 py-1 bg-blue-600 text-white rounded hover:bg-blue-700">
                    Check In
                </button>
            </div>
        )}
    </div>
)

export default AppointmentRow
