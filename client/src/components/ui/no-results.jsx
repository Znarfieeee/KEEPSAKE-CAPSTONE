import React from "react"

const NoResults = ({
    message = "No results found",
    suggestion = "Try adjusting your search or filter criteria",
    className = "",
}) => {
    return (
        <tr>
            <td colSpan={6} className="text-center py-8">
                <div
                    className={`flex flex-col items-center justify-center text-gray-500 ${className}`}>
                    <svg
                        className="w-12 h-12 mb-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1}
                            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                    </svg>
                    <p className="text-lg font-medium">{message}</p>
                    {suggestion && (
                        <p className="text-sm text-gray-400 mt-1">
                            {suggestion}
                        </p>
                    )}
                </div>
            </td>
        </tr>
    )
}

export { NoResults }
