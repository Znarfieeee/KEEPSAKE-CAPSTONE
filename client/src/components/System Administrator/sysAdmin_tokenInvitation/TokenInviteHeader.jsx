import React, { lazy, Suspense } from "react"

// UI Components
import { Button } from "@/components/ui/Button"
import { PlusCircle, Download, BarChart3 } from "lucide-react"

// Lazy load InviteUserModal
const InviteUserModal = lazy(() => import("./InviteUserModal"))

const TokenInviteHeader = ({ onExportCSV, onOpenReports }) => {
    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1>Token Invitations</h1>
                <div className="flex flex-wrap gap-3">
                    <InviteUserModal />
                    <Button
                        onClick={onExportCSV}
                        variant="outline"
                        className="border-gray-200">
                        <Download className="h-4 w-4 mr-2" />
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

export default TokenInviteHeader
