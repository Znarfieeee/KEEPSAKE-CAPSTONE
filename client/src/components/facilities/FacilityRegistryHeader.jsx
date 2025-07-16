import React from "react"
import { Button } from "../ui/Button"
import { PlusCircle, FileDown, BarChart3 } from "lucide-react"

const FacilityRegistryHeader = ({
    onOpenRegister,
    onExportCSV,
    onOpenReports,
}) => {
    return (
        <div className="space-y-4">
            {/* Breadcrumb */}
            <nav className="text-sm text-gray-500 dark:text-gray-400">
                <ol className="list-none p-0 inline-flex">
                    <li className="flex items-center">
                        <span>Dashboard</span>
                        <svg
                            className="h-4 w-4 mx-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 5l7 7-7 7"
                            />
                        </svg>
                    </li>
                    <li>Facilities Registry</li>
                </ol>
            </nav>

            {/* Header with actions */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-2xl font-bold text-black">
                    Registered Healthcare Facilities
                </h1>

                <div className="flex flex-wrap gap-3">
                    <Button
                        onClick={onOpenRegister}
                        className="bg-primary text-white hover:bg-primary/90">
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Register New Facility
                    </Button>

                    <Button
                        onClick={onExportCSV}
                        variant="outline"
                        className="border-gray-200">
                        <FileDown className="h-4 w-4 mr-2" />
                        Export to CSV
                    </Button>

                    <Button
                        onClick={onOpenReports}
                        variant="outline"
                        className="border-gray-200">
                        <BarChart3 className="h-4 w-4 mr-2" />
                        View Reports
                    </Button>
                </div>
            </div>
        </div>
    )
}

export default FacilityRegistryHeader
