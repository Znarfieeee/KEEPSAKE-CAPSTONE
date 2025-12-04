import React from 'react'
import { Button } from '@/components/ui/Button'
import { PlusCircle, Download, BarChart3 } from 'lucide-react'

const UserRegistryHeader = ({ onOpenRegister, onExportCSV }) => {
    return (
        <div className="space-y-4">
            {/* Header with actions */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-2xl font-bold text-black">Registered Users</h1>

                <div className="flex flex-wrap gap-3">
                    <Button
                        onClick={onOpenRegister}
                        className="bg-primary text-white hover:bg-primary/90"
                    >
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Register New User
                    </Button>

                    <Button onClick={onExportCSV} variant="outline" className="border-gray-200">
                        <Download className="h-4 w-4 mr-2" />
                        Export to CSV
                    </Button>
                </div>
            </div>
        </div>
    )
}

export default UserRegistryHeader
