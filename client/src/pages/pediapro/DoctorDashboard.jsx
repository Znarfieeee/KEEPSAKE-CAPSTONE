import React from "react"
import { mockData } from "./mockdata"

// UI Components
import { Calendar, Users, Activity, User, Plus } from "lucide-react"

const DoctorDashboard = () => {
    const StatCard = ({ title, value, subtitle, icon: Icon, trend }) => (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-600">{title}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                        {value}
                    </p>
                    {subtitle && (
                        <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
                    )}
                </div>
                <div className="h-12 w-12 bg-blue-50 rounded-lg flex items-center justify-center">
                    <Icon className="h-6 w-6 text-blue-600" />
                </div>
            </div>
        </div>
    )

    const PatientCard = ({ patient, showDate = false }) => (
        <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                    <p className="font-medium text-gray-900">{patient.name}</p>
                    <p className="text-sm text-gray-500">
                        {showDate ? patient.date : patient.time} •{" "}
                        {patient.type}
                    </p>
                </div>
            </div>
            <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                    patient.status === "Urgent"
                        ? "bg-red-100 text-red-800"
                        : patient.status === "Check-up"
                        ? "bg-green-100 text-green-800"
                        : patient.status === "Waiting"
                        ? "bg-yellow-100 text-yellow-800"
                        : patient.status === "Completed"
                        ? "bg-gray-100 text-gray-800"
                        : "bg-blue-100 text-blue-800"
                }`}>
                {patient.status}
            </span>
        </div>
    )

    return (
        <>
            <div className="space-y-6">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatCard
                        title="Today's Patients"
                        value="4"
                        subtitle="Currently in office"
                        icon={Users}
                    />
                    <StatCard
                        title="Upcoming Appointments"
                        value="2"
                        subtitle="Next 30 days"
                        icon={Calendar}
                    />
                    <StatCard
                        title="Vaccination Compliance"
                        value="75%"
                        subtitle="On track this month"
                        icon={Activity}
                    />
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Today's Patients */}
                    <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border">
                        <div className="p-6 border-b">
                            <h3 className="text-lg font-semibold text-gray-900">
                                Today's Patients
                            </h3>
                            <p className="text-sm text-gray-500">
                                Saturday, April 26, 2025
                            </p>
                        </div>
                        <div className="p-6 space-y-2">
                            {mockData.todaysPatients.map(patient => (
                                <PatientCard
                                    key={patient.id}
                                    patient={patient}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Vaccination Status */}
                    <div className="bg-white rounded-lg shadow-sm border">
                        <div className="p-6 border-b">
                            <h3 className="text-lg font-semibold text-gray-900">
                                Vaccination Status
                            </h3>
                            <p className="text-sm text-gray-500">
                                Overall patient vaccination compliance
                            </p>
                        </div>
                        <div className="p-6">
                            <div className="relative w-32 h-32 mx-auto mb-4">
                                <svg className="w-32 h-32 transform -rotate-90">
                                    <circle
                                        cx="64"
                                        cy="64"
                                        r="56"
                                        stroke="#e5e7eb"
                                        strokeWidth="8"
                                        fill="none"
                                    />
                                    <circle
                                        cx="64"
                                        cy="64"
                                        r="56"
                                        stroke="#06b6d4"
                                        strokeWidth="8"
                                        fill="none"
                                        strokeDasharray={`${75 * 3.51} 351.86`}
                                        className="transition-all duration-500"
                                    />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-2xl font-bold text-gray-900">
                                        75%
                                    </span>
                                </div>
                            </div>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">
                                        Complete:
                                    </span>
                                    <span className="font-medium">75%</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">
                                        Upcoming:
                                    </span>
                                    <span className="font-medium">15%</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">
                                        Overdue:
                                    </span>
                                    <span className="font-medium text-red-600">
                                        10%
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Upcoming Appointments */}
                <div className="bg-white rounded-lg shadow-sm border">
                    <div className="p-6 border-b flex justify-between items-center">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                                Upcoming Appointments
                            </h3>
                            <p className="text-sm text-gray-500">
                                Next schedule for today
                            </p>
                        </div>
                        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2">
                            <Plus className="h-4 w-4" />
                            <span>Add Appointment</span>
                        </button>
                    </div>
                    <div className="p-6 space-y-2">
                        {mockData.upcomingAppointments.map(appointment => (
                            <PatientCard
                                key={appointment.id}
                                patient={appointment}
                                showDate={true}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </>
    )
}

export default DoctorDashboard
