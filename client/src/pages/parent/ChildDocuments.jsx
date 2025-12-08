import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Upload, FolderOpen } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { PatientDocuments } from '@/components/doctors/patient_records/PatientDocuments'
import { UploadDocumentModal } from '@/components/doctors/patient_records/UploadDocumentModal'
import { showToast } from '@/util/alertHelper'

export default function ChildDocuments() {
    const { childId } = useParams()
    const navigate = useNavigate()
    const [showUploadModal, setShowUploadModal] = useState(false)

    const handleDocumentUploaded = (document) => {
        showToast('Document uploaded successfully', 'success')
    }

    const handleBack = () => {
        navigate('/parent/children')
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <Button variant="ghost" onClick={handleBack} className="mb-4">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Children
                    </Button>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                                    <FolderOpen className="w-6 h-6 text-primary" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900">
                                        Medical Documents
                                    </h1>
                                    <p className="text-gray-500 mt-1">
                                        View and upload medical documents for your child
                                    </p>
                                </div>
                            </div>
                            <Button onClick={() => setShowUploadModal(true)}>
                                <Upload className="w-4 h-4 mr-2" />
                                Upload Document
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Documents List */}
                <div className="bg-white rounded-lg shadow p-6">
                    <PatientDocuments
                        patientId={childId}
                        canDelete={false} // Parents cannot delete documents
                    />
                </div>

                {/* Upload Modal */}
                <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
                    <UploadDocumentModal
                        patientId={childId}
                        onUploadSuccess={handleDocumentUploaded}
                        onClose={() => setShowUploadModal(false)}
                    />
                </Dialog>
            </div>
        </div>
    )
}
