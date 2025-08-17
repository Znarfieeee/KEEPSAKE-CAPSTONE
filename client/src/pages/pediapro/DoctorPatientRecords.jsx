import React, { useState } from "react"
import PatientRecordsHeader from "@/components/doctors/patient_records/PatientRecordsHeader"
import PatientRecordFilters from "@/components/doctors/patient_records/PatientRecordFilters"
import PatientRecordsTable from "@/components/doctors/patient_records/PatientRecordsTable"
import { showToast } from "@/util/alertHelper"

function DoctorPatientRecords() {
    // State for filters
    const [search, setSearch] = useState("")
    const [statusFilter, setStatusFilter] = useState("all")
    const [sexFilter, setSexFilter] = useState("all")
    const [ageFilter, setAgeFilter] = useState(null)
    const [dateRange, setDateRange] = useState(null)

    // Pagination state
    const [page, setPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(10)

    // Loading state
    const [loading, setLoading] = useState(false)

    // Dummy data - Replace with actual data fetching
    const [records] = useState([
        {
            id: 1,
            firstname: "John",
            lastname: "Doe",
            sex: "Male",
            age: "8",
            birthdate: "2017-08-15",
            doctor: "Dr. Smith",
            status: "active",
        },
        // Add more dummy records as needed
    ])

    // Event handlers
    const handleNewRecord = () => {
        showToast("info", "Creating new record...")
    }

    const handleExportCSV = () => {
        showToast("info", "Exporting records...")
    }

    const handleOpenReports = () => {
        showToast("info", "Opening reports...")
    }

    const handleView = record => {
        showToast(
            "info",
            "Viewing record: " + record.firstname + " " + record.lastname
        )
    }

    const handleEdit = record => {
        showToast(
            "info",
            "Editing record: " + record.firstname + " " + record.lastname
        )
    }

    const handleArchive = record => {
        showToast(
            "info",
            "Archiving record: " + record.firstname + " " + record.lastname
        )
    }

    const handleDelete = record => {
        showToast(
            "info",
            "Deleting record: " + record.firstname + " " + record.lastname
        )
    }

    // Filter records
    const filteredRecords = records.filter(record => {
        const matchesSearch = (record.firstname + " " + record.lastname)
            .toLowerCase()
            .includes(search.toLowerCase())
        const matchesStatus =
            statusFilter === "all" || record.status === statusFilter
        const matchesSex = sexFilter === "all" || record.sex === sexFilter
        const matchesAge = !ageFilter || record.age === ageFilter.toString()
        const matchesDate =
            !dateRange?.from ||
            !dateRange?.to ||
            (new Date(record.birthdate) >= new Date(dateRange.from) &&
                new Date(record.birthdate) <= new Date(dateRange.to))

        return (
            matchesSearch &&
            matchesStatus &&
            matchesSex &&
            matchesAge &&
            matchesDate
        )
    })

    return (
        <div className="p-6 px-20 space-y-6">
            <PatientRecordsHeader
                onNewRecord={handleNewRecord}
                onExportCSV={handleExportCSV}
                onOpenReports={handleOpenReports}
            />

            <PatientRecordFilters
                search={search}
                onSearchChange={setSearch}
                statusFilter={statusFilter}
                onStatusChange={setStatusFilter}
                sexFilter={sexFilter}
                onSexChange={setSexFilter}
                ageFilter={ageFilter}
                onAgeChange={setAgeFilter}
                dateRange={dateRange}
                onDateRangeChange={setDateRange}
            />

            <PatientRecordsTable
                records={filteredRecords}
                loading={loading}
                page={page}
                setPage={setPage}
                itemsPerPage={itemsPerPage}
                setItemsPerPage={setItemsPerPage}
                onView={handleView}
                onEdit={handleEdit}
                onArchive={handleArchive}
                onDelete={handleDelete}
            />
        </div>
    )
}

export default DoctorPatientRecords
