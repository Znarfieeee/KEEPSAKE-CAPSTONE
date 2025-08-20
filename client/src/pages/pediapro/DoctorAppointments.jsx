import React, { useState } from 'react';
import { mockData } from './mockdata';

// UI Components
import { Filter, Search, RotateCcw, User } from 'lucide-react';

const DoctorAppointments = ({ appointment, showActions = true }) => {
  const [selectedDate, setSelectedDate] = useState('2024-05-10');

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
  );

  // Simple calendar grid
  const CalendarGrid = () => {
    const days = Array.from({ length: 30 }, (_, i) => i + 1);

    return (
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <h4 className="font-medium mb-3">June 2025</h4>
        <div className="grid grid-cols-7 gap-1 text-sm">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day) => (
            <div key={day} className="p-2 text-center font-medium text-gray-500">
              {day}
            </div>
          ))}
          {days.map((day) => (
            <div
              key={day}
              className={`p-2 text-center cursor-pointer hover:bg-blue-50 rounded ${
                day === 4 ? 'bg-blue-600 text-white' : ''
              }`}
            >
              {day}
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center space-x-4 text-xs">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
            <span>Regular</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
            <span>Follow-up</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span>Urgent</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Schedule */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6 border-b border-b-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Today's Schedule</h3>
              <p className="text-sm text-gray-500">May 10, 2024</p>
            </div>
            <div>
              {mockData.upcomingAppointments.slice(0, 3).map((appointment) => (
                <AppointmentRow key={appointment.id} appointment={appointment} />
              ))}
            </div>
          </div>

          {/* All Appointments */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">All Appointments</h3>
                <p className="text-sm text-gray-500">View and manage all scheduled appointments</p>
              </div>
              <div className="flex space-x-2">
                <button className="px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <Filter className="h-4 w-4" />
                </button>
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search appointments"
                    className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Patient
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Purpose
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Doctor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {mockData.upcomingAppointments.map((appointment, idx) => (
                    <tr key={appointment.id} className="border-t border-t-gray-200">
                      <td className="px-6 py-4 text-sm text-gray-900">{appointment.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{appointment.date}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{appointment.time}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{appointment.type}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">Dr. Smith</td>
                      <td className="px-6 py-4 text-sm">
                        <button className="text-blue-600 hover:text-blue-800 mr-3">
                          <RotateCcw className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Calendar View */}
        <div>
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Calendar View</h3>
            <p className="text-sm text-gray-500">Monthly appointment overview</p>
          </div>
          <CalendarGrid />
        </div>
      </div>
    </div>
  );
};

export default DoctorAppointments;
