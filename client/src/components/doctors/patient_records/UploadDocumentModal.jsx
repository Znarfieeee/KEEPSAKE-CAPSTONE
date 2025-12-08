import React, { useState } from 'react'
import { DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Upload, FileText, X } from 'lucide-react'
import { showToast } from '@/util/alertHelper'
import { uploadDocument } from '@/api/doctors/documents'

const DOCUMENT_TYPES = [
    { value: 'lab_result', label: 'Lab Result' },
    { value: 'imaging_report', label: 'Imaging Report' },
    { value: 'vaccination_record', label: 'Vaccination Record' },
    { value: 'prescription', label: 'Prescription' },
    { value: 'other', label: 'Other' },
]

const ALLOWED_FILE_TYPES = '.pdf,.jpg,.jpeg,.png,.tiff,.tif'
const MAX_FILE_SIZE_MB = 10

export function UploadDocumentModal({ patientId, onUploadSuccess, onClose }) {
    const [file, setFile] = useState(null)
    const [documentType, setDocumentType] = useState('')
    const [description, setDescription] = useState('')
    const [uploading, setUploading] = useState(false)
    const [dragActive, setDragActive] = useState(false)

    const handleFileChange = (e) => {
        const selectedFile = e.target.files?.[0]
        if (selectedFile) {
            validateAndSetFile(selectedFile)
        }
    }

    const validateAndSetFile = (selectedFile) => {
        // Validate file size
        const fileSizeMB = selectedFile.size / (1024 * 1024)
        if (fileSizeMB > MAX_FILE_SIZE_MB) {
            showToast(
                'error',
                `File size must be less than ${MAX_FILE_SIZE_MB}MB. Current size: ${fileSizeMB.toFixed(
                    2
                )}MB`
            )
            return
        }

        // Validate file type
        const fileExtension = '.' + selectedFile.name.split('.').pop().toLowerCase()
        if (!ALLOWED_FILE_TYPES.includes(fileExtension)) {
            showToast('error', 'File type not allowed. Allowed types: PDF, JPG, PNG, TIFF')
            return
        }

        setFile(selectedFile)
    }

    const handleDrag = (e) => {
        e.preventDefault()
        e.stopPropagation()
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true)
        } else if (e.type === 'dragleave') {
            setDragActive(false)
        }
    }

    const handleDrop = (e) => {
        e.preventDefault()
        e.stopPropagation()
        setDragActive(false)

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            validateAndSetFile(e.dataTransfer.files[0])
        }
    }

    const handleRemoveFile = () => {
        setFile(null)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!file || !documentType) {
            showToast('error', 'Please select a file and document type')
            return
        }

        if (!patientId) {
            showToast('error', 'Patient ID is required')
            return
        }

        setUploading(true)

        try {
            const result = await uploadDocument(patientId, file, documentType, description)

            if (result.status === 'success') {
                showToast('success', 'Document uploaded successfully')

                // Dispatch custom event for real-time updates
                window.dispatchEvent(
                    new CustomEvent('document-uploaded', {
                        detail: { patientId, document: result.data },
                    })
                )

                if (onUploadSuccess) {
                    onUploadSuccess(result.data)
                }
                handleClose()
            } else {
                showToast('error', result.message || 'Upload failed')
            }
        } catch (error) {
            console.error('Upload error:', error)
            const errorMessage = error.message || 'Failed to upload document. Please try again.'
            showToast('error', errorMessage)
        } finally {
            setUploading(false)
        }
    }

    const handleClose = () => {
        setFile(null)
        setDocumentType('')
        setDescription('')
        if (onClose) {
            onClose()
        }
    }

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes'
        const k = 1024
        const sizes = ['Bytes', 'KB', 'MB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
    }

    return (
        <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                    <Upload className="w-5 h-5" />
                    Upload Medical Document
                </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* File Upload Area */}
                <div>
                    <Label htmlFor="file">Document File *</Label>
                    <div
                        className={`mt-2 border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                            dragActive
                                ? 'border-primary bg-primary/5'
                                : 'border-gray-300 hover:border-gray-400'
                        }`}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                    >
                        {!file ? (
                            <div className="space-y-2">
                                <Upload className="w-10 h-10 mx-auto text-gray-400" />
                                <div className="space-y-1">
                                    <p className="text-sm text-gray-600">
                                        Drag and drop a file here, or click to select
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        Allowed: PDF, JPG, PNG, TIFF (Max {MAX_FILE_SIZE_MB}MB)
                                    </p>
                                </div>
                                <Input
                                    id="file"
                                    type="file"
                                    accept={ALLOWED_FILE_TYPES}
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                                <label htmlFor="file">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="cursor-pointer"
                                        onClick={() => document.getElementById('file').click()}
                                    >
                                        Select File
                                    </Button>
                                </label>
                            </div>
                        ) : (
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <FileText className="w-8 h-8 text-primary" />
                                    <div className="text-left">
                                        <p className="text-sm font-medium text-gray-900">
                                            {file.name}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {formatFileSize(file.size)}
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleRemoveFile}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Document Type */}
                <div>
                    <Label htmlFor="document_type">Document Type *</Label>
                    <Select value={documentType} onValueChange={setDocumentType} required>
                        <SelectTrigger className="mt-2">
                            <SelectValue placeholder="Select document type" />
                        </SelectTrigger>
                        <SelectContent>
                            {DOCUMENT_TYPES.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                    {type.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Description */}
                <div>
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Add any notes about this document..."
                        rows={3}
                        className="mt-2 resize-none"
                        maxLength={500}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                        {description.length}/500 characters
                    </p>
                </div>

                <DialogFooter className="gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleClose}
                        disabled={uploading}
                    >
                        Cancel
                    </Button>
                    <Button type="submit" disabled={uploading || !file || !documentType}>
                        {uploading ? (
                            <>
                                <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Uploading...
                            </>
                        ) : (
                            <>
                                <Upload className="w-4 h-4 mr-2" />
                                Upload Document
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </form>
        </DialogContent>
    )
}
