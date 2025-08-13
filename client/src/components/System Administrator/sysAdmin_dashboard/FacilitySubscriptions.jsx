import React from "react"

const FacilitySubscriptions = () => {
    return (
        <div className="bg-white shadow rounded-lg p-4 h-full">
            <h3 className="font-semibold text-gray-700 mb-4">
                Facility Subscriptions
            </h3>
            <p className="text-3xl font-bold text-gray-900">1,089</p>
            <p className="text-sm text-gray-500 mb-2">out of 1,247 total</p>
            <div className="w-full h-2 bg-gray-200 rounded">
                <div
                    className="h-full bg-blue-600 rounded"
                    style={{ width: "87%" }}
                />
            </div>
            <p className="text-xs text-gray-600 mt-1">87% subscription rate</p>
        </div>
    )
}

export default FacilitySubscriptions
