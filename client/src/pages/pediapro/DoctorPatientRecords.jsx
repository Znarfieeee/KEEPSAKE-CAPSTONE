import React, { useState } from "react"
import PatientRecordsHeader from "@/components/doctors/patient_records/PatientRecordsHeader"
import PatientRecordFilters from "@/components/doctors/patient_records/PatientRecordFilters"
import PatientRecordsTable from "@/components/doctors/patient_records/PatientRecordsTable"
import { showToast } from "@/util/alertHelper"

function DoctorPatientRecords() {
    // State for filters
    const [search, setSearch] = useState("")
    const [statusFilter, setStatusFilter] = useState("all")
    const [categoryFilter, setCategoryFilter] = useState("all")
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
            patientName: "John Doe",
            category: "General Checkup",
            date: "2025-08-15",
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
        showToast("info", "Viewing record: " + record.patientName)
    }

    const handleEdit = record => {
        showToast("info", "Editing record: " + record.patientName)
    }

    const handleArchive = record => {
        showToast("info", "Archiving record: " + record.patientName)
    }

    const handleDelete = record => {
        showToast("info", "Deleting record: " + record.patientName)
    }

    // Filter records
    const filteredRecords = records.filter(record => {
        const matchesSearch = record.patientName
            .toLowerCase()
            .includes(search.toLowerCase())
        const matchesStatus =
            statusFilter === "all" || record.status === statusFilter
        const matchesCategory =
            categoryFilter === "all" || record.category === categoryFilter
        const matchesDate =
            !dateRange?.from ||
            !dateRange?.to ||
            (new Date(record.date) >= new Date(dateRange.from) &&
                new Date(record.date) <= new Date(dateRange.to))

        return matchesSearch && matchesStatus && matchesCategory && matchesDate
    })

    return (
        <div className="p-6 space-y-6 max-w-[1200px] mx-auto">
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
                categoryFilter={categoryFilter}
                onCategoryChange={setCategoryFilter}
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
