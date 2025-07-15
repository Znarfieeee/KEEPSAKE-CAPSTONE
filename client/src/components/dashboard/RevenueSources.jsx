import React from "react"

const sources = [
    { label: "Facilities", value: 52 },
    { label: "Parents", value: 27 },
    { label: "Ads", value: 12 },
    { label: "Other", value: 9 },
]

const RevenueSources = () => (
    <div className="bg-white shadow rounded-lg p-4 h-full">
        <h3 className="font-semibold text-gray-700 mb-4">Revenue Sources</h3>
        <div className="space-y-2">
            {sources.map(({ label, value }) => (
                <div
                    key={label}
                    className="flex items-center justify-between text-sm">
                    <span>{label}</span>
                    <span className="font-semibold text-gray-800">
                        {value}%
                    </span>
                </div>
            ))}
        </div>
    </div>
)

export default RevenueSources
