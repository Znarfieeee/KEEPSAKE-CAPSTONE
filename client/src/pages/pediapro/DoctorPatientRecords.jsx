import React from "react"

// UI Components
import { GoSearch } from "react-icons/go"

function PatientRecords() {
    return (
        <>
            <div id="header-container">
                <div id="search-bar" className="flex flex-row">
                    <input type="text" placeholder="Search Patient" />]
                    <GoSearch />
                </div>
                <Button variant="destructive">+ Add</Button>
            </div>
            <div id="table-container">
                <table>
                    <thead>
                        <tr>
                            <td>NAME</td>
                            <td>BIRTHDATE</td>
                        </tr>
                    </thead>
                    <tbody>{/* Insert table data logic here */}</tbody>
                </table>
            </div>
        </>
    )
}

export default PatientRecords
