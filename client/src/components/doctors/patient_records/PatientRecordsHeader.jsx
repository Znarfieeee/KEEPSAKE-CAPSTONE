import React from 'react'
import { Button } from '@/components/ui/Button'
import { PlusCircle, Download, BarChart3, UserPlus } from 'lucide-react'
import { DialogTrigger } from '@/components/ui/dialog'

const PatientRecordsHeader = ({ onExportCSV, onOpenReports, onNewRecord, onInviteParent }) => {
    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-2xl font-bold text-black">Patient Records</h1>
                <div className="flex flex-wrap gap-3">
                    <DialogTrigger asChild>
                        <Button
                            className="bg-primary text-white hover:bg-primary/90"
                            onClick={onNewRecord}
                        >
                            <PlusCircle className="h-4 w-4 mr-2" />
                            New Record
                        </Button>
                    </DialogTrigger>

                    <Button variant="outline" onClick={onInviteParent} className="border-gray-200">
                        <UserPlus className="h-4 w-4 mr-2" />
                        Invite Parent
                    </Button>

                    <Button variant="outline" onClick={onExportCSV} className="border-gray-200">
                        <Download className="h-4 w-4 mr-2" />
                        Export to CSV
                    </Button>

                    <Button onClick={onOpenReports} variant="outline" className="border-gray-200">
                        <BarChart3 className="h-4 w-4 mr-2" />
                        View Reports
                    </Button>
                </div>
            </div>
        </div>
    )
}

export default PatientRecordsHeader
