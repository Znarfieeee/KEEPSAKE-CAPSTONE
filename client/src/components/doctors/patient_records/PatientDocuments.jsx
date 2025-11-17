import React, { useState, useEffect, useCallback } from 'react'
import { Download, FileText, Trash2, Filter, RefreshCw, Upload, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { showToast } from '@/util/alertHelper'
import { formatDistanceToNow } from 'date-fns'
import { getPatientDocuments, getDocument, deleteDocument } from '@/api/doctors/documents'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { UploadDocumentModal } from '@/components/doctors/patient_records/UploadDocumentModal'
import { DocumentPreviewModal } from '@/components/doctors/patient_records/DocumentPreviewModal'
import ConfirmationDialog from '@/components/ui/ConfirmationDialog'
import { DocumentSkeleton } from '@/components/ui/DocumentSkeleton'
import { Dialog } from '@/components/ui/dialog'

const DOCUMENT_TYPE_LABELS = {
    lab_result: 'Lab Result',
    imaging_report: 'Imaging Report',
    vaccination_record: 'Vaccination Record',
    prescription: 'Prescription',
    other: 'Other',
}

const DOCUMENT_TYPE_COLORS = {
    lab_result: 'bg-blue-100 text-blue-800',
    imaging_report: 'bg-purple-100 text-purple-800',
    vaccination_record: 'bg-green-100 text-green-800',
    prescription: 'bg-orange-100 text-orange-800',
    other: 'bg-gray-100 text-gray-800',
}

const UPLOADER_ROLE_LABELS = {
    doctor: 'Medical Professional',
    nurse: 'Medical Professional',
    facility_admin: 'Facility Admin',
    parent: 'Parent/Guardian',
    guardian: 'Parent/Guardian',
    staff: 'Staff',
}

const UPLOADER_ROLE_COLORS = {
    doctor: 'bg-emerald-100 text-emerald-800',
    nurse: 'bg-emerald-100 text-emerald-800',
    facility_admin: 'bg-indigo-100 text-indigo-800',
    parent: 'bg-amber-100 text-amber-800',
    guardian: 'bg-amber-100 text-amber-800',
    staff: 'bg-gray-100 text-gray-800',
}

export function PatientDocuments({ patientId, canDelete = false, readOnly = false }) {
    const [documents, setDocuments] = useState([])
    const [loading, setLoading] = useState(true)
    const [filterType, setFilterType] = useState('all')
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [documentToDelete, setDocumentToDelete] = useState(null)
    const [showUploadModal, setShowUploadModal] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [previewDocument, setPreviewDocument] = useState(null)
    const [showPreviewModal, setShowPreviewModal] = useState(false)

    const fetchDocuments = useCallback(async () => {
        if (!patientId) {
            return
        }

        try {
            const options = {}
            if (filterType !== 'all') {
                options.documentType = filterType
            }

            const result = await getPatientDocuments(patientId, options)

            if (result.status === 'success') {
                setDocuments(result.data || [])
            } else {
                showToast('error', result.message || 'Failed to load documents')
            }
        } catch (error) {
            console.error('Error fetching documents:', error)
            const errorMessage = error.message || 'Failed to load documents'
            showToast('error', errorMessage)
        } finally {
            setLoading(false)
        }
    }, [patientId, filterType])

    useEffect(() => {
        fetchDocuments()
    }, [fetchDocuments])

    // Listen for document upload events
    useEffect(() => {
        const handleDocumentUploaded = (event) => {
            if (event.detail.patientId === patientId) {
                fetchDocuments()
            }
        }

        window.addEventListener('document-uploaded', handleDocumentUploaded)
        return () => {
            window.removeEventListener('document-uploaded', handleDocumentUploaded)
        }
    }, [patientId, fetchDocuments])

    const handleDocumentUploaded = () => {
        showToast('success', 'Document uploaded successfully')
        // Refresh the documents list
        fetchDocuments()
    }

    const handleDownload = async (document) => {
        try {
            if (document.download_url) {
                // Open in new tab
                window.open(document.download_url, '_blank')
            } else {
                // Fetch fresh signed URL
                const result = await getDocument(document.document_id)

                if (result.status === 'success' && result.data?.download_url) {
                    window.open(result.data.download_url, '_blank')
                } else {
                    showToast('error', 'Failed to generate download link')
                }
            }
        } catch (error) {
            console.error('Download error:', error)
            const errorMessage = error.message || 'Failed to download document'
            showToast('error', errorMessage)
        }
    }

    const handlePreviewClick = (document) => {
        setPreviewDocument(document)
        setShowPreviewModal(true)
    }

    const handleDeleteClick = (document) => {
        setDocumentToDelete(document)
        setDeleteDialogOpen(true)
    }

    const handleDeleteConfirm = async () => {
        if (!documentToDelete) return

        setIsDeleting(true)

        try {
            const result = await deleteDocument(documentToDelete.document_id)

            if (result.status === 'success') {
                showToast('success', 'Document deleted successfully')
                // Remove from local state
                setDocuments((prev) =>
                    prev.filter((doc) => doc.document_id !== documentToDelete.document_id)
                )
                setDeleteDialogOpen(false)
                setDocumentToDelete(null)
            } else {
                showToast('error', result.message || 'Failed to delete document')
            }
        } catch (error) {
            console.error('Delete error:', error)
            const errorMessage = error.message || 'Failed to delete document'
            showToast('error', errorMessage)
        } finally {
            setIsDeleting(false)
        }
    }

    const formatFileSize = (bytes) => {
        if (!bytes) return 'Unknown size'
        const k = 1024
        const sizes = ['Bytes', 'KB', 'MB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
    }

    const filteredDocuments = documents

    return (
        <div className="bg-white rounded-b-lg shadow-sm p-6 mb-6">
            <div className="mb-10">
                {/* Header with Upload Button */}
                <div className="flex items-center justify-between my-4">
                    <h2 className="text-lg font-semibold">MEDICAL DOCUMENTS</h2>
                    {!readOnly && (
                        <Button onClick={() => setShowUploadModal(true)}>
                            <Upload className="w-4 h-4 mr-2" />
                            Upload Document
                        </Button>
                    )}
                </div>

                {/* Filter Bar */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-gray-500" />
                        <Select value={filterType} onValueChange={setFilterType}>
                            <SelectTrigger className="w-[200px]">
                                <SelectValue placeholder="Filter by type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Documents</SelectItem>
                                <SelectItem value="lab_result">Lab Results</SelectItem>
                                <SelectItem value="imaging_report">Imaging Reports</SelectItem>
                                <SelectItem value="vaccination_record">
                                    Vaccination Records
                                </SelectItem>
                                <SelectItem value="prescription">Prescriptions</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <Button variant="outline" size="sm" onClick={fetchDocuments}>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh
                    </Button>
                </div>

                {/* Documents List */}
                {loading ? (
                    <DocumentSkeleton />
                ) : filteredDocuments.length === 0 ? (
                    <div className="text-center py-12">
                        <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                        <p className="text-gray-500 text-sm">No documents found</p>
                        <p className="text-gray-400 text-xs mt-1">
                            {filterType !== 'all'
                                ? 'Try changing the filter or upload a new document'
                                : 'Documents will appear here when uploaded'}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {filteredDocuments.map((doc) => (
                            <div
                                key={doc.document_id}
                                className="p-4 rounded-lg border-2 bg-gray-50 border-gray-200 transition-all duration-200 hover:shadow-md"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4 flex-1 min-w-0">
                                        <div className="flex-shrink-0">
                                            <FileText className="w-8 h-8 text-primary" />
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-2">
                                                <p className="font-medium text-gray-900 truncate">
                                                    {doc.document_name}
                                                </p>
                                                <span
                                                    className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                                                        DOCUMENT_TYPE_COLORS[doc.document_type]
                                                    }`}
                                                >
                                                    {DOCUMENT_TYPE_LABELS[doc.document_type]}
                                                </span>
                                            </div>

                                            <div className="space-y-1">
                                                <div className="flex items-center gap-3 text-sm text-gray-500">
                                                    <span>
                                                        Uploaded{' '}
                                                        {formatDistanceToNow(
                                                            new Date(doc.uploaded_at),
                                                            {
                                                                addSuffix: true,
                                                            }
                                                        )}
                                                    </span>
                                                    {doc.uploader && (
                                                        <>
                                                            <span>•</span>
                                                            <span>
                                                                by {doc.uploader.firstname}{' '}
                                                                {doc.uploader.lastname}
                                                            </span>
                                                        </>
                                                    )}
                                                    {doc.uploaded_by_role && (
                                                        <span
                                                            className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                                                                UPLOADER_ROLE_COLORS[doc.uploaded_by_role] || 'bg-gray-100 text-gray-800'
                                                            }`}
                                                        >
                                                            {UPLOADER_ROLE_LABELS[doc.uploaded_by_role] || doc.uploaded_by_role}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-3 text-sm text-gray-500">
                                                    <span>{formatFileSize(doc.file_size)}</span>
                                                    {doc.version > 1 && (
                                                        <>
                                                            <span>•</span>
                                                            <span className="text-blue-600 font-semibold">
                                                                v{doc.version}
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>

                                            {doc.description && (
                                                <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                                                    {doc.description}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 ml-4">
                                        <Button
                                            variant="default"
                                            size="sm"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                handlePreviewClick(doc)
                                            }}
                                            title="Preview document"
                                        >
                                            <Eye className="w-4 h-4" />
                                        </Button>

                                        <Button
                                            variant="default"
                                            size="sm"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                handleDownload(doc)
                                            }}
                                            title="Download document"
                                            className="bg-blue-600 hover:bg-blue-700"
                                        >
                                            <Download className="w-4 h-4" />
                                        </Button>

                                        {canDelete && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    handleDeleteClick(doc)
                                                }}
                                                className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                                                title="Delete document"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Preview Modal - No Dialog wrapper needed */}
            <DocumentPreviewModal
                document={previewDocument}
                open={showPreviewModal}
                onClose={() => {
                    setShowPreviewModal(false)
                    setPreviewDocument(null)
                }}
            />

            {/* Delete Confirmation Dialog */}
            <ConfirmationDialog
                open={deleteDialogOpen}
                onOpenChange={(open) => {
                    setDeleteDialogOpen(open)
                    if (!open) {
                        setDocumentToDelete(null)
                    }
                }}
                title="Delete Document"
                description={`Are you sure you want to delete "${documentToDelete?.document_name}"? This action cannot be undone.`}
                onConfirm={handleDeleteConfirm}
                destructive={true}
                loading={isDeleting}
            />

            {/* Upload Document Modal */}
            <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
                <UploadDocumentModal
                    patientId={patientId}
                    onUploadSuccess={handleDocumentUploaded}
                    onClose={() => setShowUploadModal(false)}
                />
            </Dialog>
        </div>
    )
}
