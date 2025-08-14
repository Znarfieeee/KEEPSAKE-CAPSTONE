import React from "react"
import { Button } from "@/components/ui/Button"
import { PlusCircle, Download, BarChart3 } from "lucide-react"

const TokenInviteHeader = ({ onOpenInvite, onExportCSV, onOpenReports }) => {
    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1>Token Invitations</h1>
                <div className="flex flex-wrap gap-3">
                    <Button
                        onClick={onOpenInvite}
                        className="bg-primary text-white hover:bg-primary/90">
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Invite user
                    </Button>

                    <Button
                        variant="outline"
                        onClick={onExportCSV}
                        className="flex items-center gap-2">
                        <Download className="h-4 w-4" />
                        Export CSV
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
