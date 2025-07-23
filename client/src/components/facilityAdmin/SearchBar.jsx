import React from "react"

const SearchBar = ({ placeholder }) => (
    <div className="relative">
        <input
            type="text"
            className="pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={placeholder}
        />
        <span className="absolute left-3 top-2.5 text-gray-400">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                <path
                    stroke="currentColor"
                    strokeWidth="2"
                    d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1 0 6.5 6.5a7.5 7.5 0 0 0 10.6 10.6Z"
                />
            </svg>
        </span>
    </div>
)

export default SearchBar
