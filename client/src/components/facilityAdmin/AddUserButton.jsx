import React from "react"

const AddUserButton = ({ onClick }) => (
    <button
        className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 fixed top-4 right-4"
        onClick={onClick}>
        Add User
    </button>
)

export default AddUserButton
