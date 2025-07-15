import React from "react"

const services = [
    { name: "Database", status: "Operational", color: "text-green-600" },
    { name: "API Services", status: "Operational", color: "text-green-600" },
    { name: "File Storage", status: "Operational", color: "text-green-600" },
    { name: "Email Service", status: "Degraded", color: "text-yellow-600" },
]

const SystemMonitoring = () => {
    return (
        <div className="bg-white shadow rounded-lg p-4 h-full">
            <h3 className="font-semibold text-gray-700 mb-4">
                System Monitoring
            </h3>
            <p className="text-sm text-gray-500 mb-4">
                Uptime Monitoring:{" "}
                <span className="text-gray-800 font-semibold">
                    99.8% Uptime
                </span>
            </p>
            <div className="space-y-2">
                {services.map(({ name, status, color }) => (
                    <div key={name} className="flex justify-between text-sm">
                        <span>{name}</span>
                        <span className={`${color} font-medium`}>{status}</span>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default SystemMonitoring
