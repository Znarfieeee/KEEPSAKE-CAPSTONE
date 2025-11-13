import React, { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import {
    X,
    Download,
    ZoomIn,
    ZoomOut,
    RotateCw,
    Loader2,
    Maximize2,
    Minimize2,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { showToast } from '@/util/alertHelper'
import { getDocument } from '@/api/doctors/documents'
import { formatDistanceToNow } from 'date-fns'

const DOCUMENT_TYPE_LABELS = {
    lab_result: 'Lab Result',
    imaging_report: 'Imaging Report',
    vaccination_record: 'Vaccination Record',
    prescription: 'Prescription',
    other: 'Other',
}

export function DocumentPreviewModal({ document, open, onClose }) {
    const [previewUrl, setPreviewUrl] = useState(null)
    const [loading, setLoading] = useState(true)
    const [zoom, setZoom] = useState(100)
    const [rotation, setRotation] = useState(0)
    const [isFullscreen, setIsFullscreen] = useState(false)
    const [showControls, setShowControls] = useState(true)

    useEffect(() => {
        const loadPreview = async () => {
            setLoading(true)
            try {
                if (document.download_url) {
                    setPreviewUrl(document.download_url)
                } else {
                    const result = await getDocument(document.document_id)

                    if (result.status === 'success' && result.data?.download_url) {
                        setPreviewUrl(result.data.download_url)
                    } else {
                        showToast('error', 'Failed to load document preview')
                        onClose()
                    }
                }
            } catch (error) {
                console.error('Preview load error:', error)
                showToast('error', 'Failed to load document preview')
                onClose()
            } finally {
                setLoading(false)
            }
        }

        if (open && document) {
            loadPreview()
            window.document.body.style.overflow = 'hidden'
        } else {
            setPreviewUrl(null)
            setZoom(100)
            setRotation(0)
            setIsFullscreen(false)
            window.document.body.style.overflow = 'unset'
        }

        return () => {
            window.document.body.style.overflow = 'unset'
        }
    }, [open, document, onClose])

    // Keyboard shortcuts
    useEffect(() => {
        if (!open) return

        const handleKeyDown = (e) => {
            switch (e.key) {
                case 'Escape':
                    onClose()
                    break
                case '+':
                case '=':
                    if (zoom < 200) setZoom((prev) => Math.min(prev + 25, 200))
                    break
                case '-':
                case '_':
                    if (zoom > 50) setZoom((prev) => Math.max(prev - 25, 50))
                    break
                case 'r':
                case 'R':
                    setRotation((prev) => (prev + 90) % 360)
                    break
                case '0':
                    setZoom(100)
                    setRotation(0)
                    break
                case 'f':
                case 'F':
                    setIsFullscreen((prev) => !prev)
                    break
                default:
                    break
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [open, onClose, zoom])

    const handleDownload = useCallback(() => {
        if (previewUrl) {
            window.open(previewUrl, '_blank')
            showToast('success', 'Opening document in new tab')
        }
    }, [previewUrl])

    const handleZoomIn = useCallback(() => {
        setZoom((prev) => Math.min(prev + 25, 200))
    }, [])

    const handleZoomOut = useCallback(() => {
        setZoom((prev) => Math.max(prev - 25, 50))
    }, [])

    const handleRotate = useCallback(() => {
        setRotation((prev) => (prev + 90) % 360)
    }, [])

    const handleReset = useCallback(() => {
        setZoom(100)
        setRotation(0)
    }, [])

    const toggleFullscreen = useCallback(() => {
        setIsFullscreen((prev) => {
            const newFullscreen = !prev
            // Hide controls when entering fullscreen, show them when exiting
            if (newFullscreen) {
                setShowControls(false)
            } else {
                setShowControls(true)
            }
            return newFullscreen
        })
    }, [])

    if (!open) return null

    const isPDF = document?.mime_type === 'application/pdf'
    const isImage = document?.mime_type?.startsWith('image/')

    const content = (
        <div className="fixed inset-0 z-[9999] bg-black/95 animate-in fade-in duration-300">
            {/* Close button - Always visible */}

            <button
                onClick={onClose}
                className="fixed top-4 right-4 z-[10001] p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all duration-200 backdrop-blur-sm"
                aria-label="Close preview"
            >
                <X className="w-6 h-6" />
            </button>

            {/* Header - Slide down animation */}
            <div
                className={`fixed top-0 left-0 right-0 z-[10000] bg-black/80 backdrop-blur-md border-b border-white/10 transition-transform duration-300 ${
                    showControls ? 'translate-y-0' : '-translate-y-full'
                }`}
            >
                <div className="px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0 pr-4">
                            <h2 className="text-lg font-semibold text-white truncate">
                                {document?.document_name}
                            </h2>
                            <div className="flex items-center gap-3 mt-1 text-sm text-gray-300">
                                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                    {DOCUMENT_TYPE_LABELS[document?.document_type]}
                                </span>
                                <span>•</span>
                                <span>
                                    Uploaded{' '}
                                    {document?.uploaded_at &&
                                        formatDistanceToNow(new Date(document.uploaded_at), {
                                            addSuffix: true,
                                        })}
                                </span>
                                {document?.uploader && (
                                    <>
                                        <span>•</span>
                                        <span>
                                            by {document.uploader.firstname}{' '}
                                            {document.uploader.lastname}
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Toolbar - Slide up animation */}
            {!loading && isImage && (
                <div
                    className={`fixed bottom-0 left-0 right-0 z-[10000] bg-black/80 backdrop-blur-md border-t border-white/10 transition-transform duration-300 ${
                        showControls ? 'translate-y-0' : 'translate-y-full'
                    }`}
                >
                    <div className="px-6 py-4">
                        <div className="flex items-center justify-between max-w-4xl mx-auto">
                            <div className="flex items-center gap-3">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleZoomOut}
                                    disabled={zoom <= 50}
                                    className="h-10 text-white hover:bg-white/10 disabled:opacity-50"
                                >
                                    <ZoomOut className="w-5 h-5" />
                                </Button>
                                <div className="px-4 py-2 text-sm font-semibold bg-white/10 border border-white/20 rounded-lg min-w-[80px] text-center text-white">
                                    {zoom}%
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleZoomIn}
                                    disabled={zoom >= 200}
                                    className="h-10 text-white hover:bg-white/10 disabled:opacity-50"
                                >
                                    <ZoomIn className="w-5 h-5" />
                                </Button>
                                <div className="w-px h-8 bg-white/20 mx-2" />
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleRotate}
                                    className="h-10 text-white hover:bg-white/10"
                                >
                                    <RotateCw className="w-5 h-5 mr-2" />
                                    Rotate
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleReset}
                                    className="h-10 text-white hover:bg-white/10"
                                >
                                    Reset
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={toggleFullscreen}
                                    className="h-10 text-white hover:bg-white/10"
                                >
                                    {isFullscreen ? (
                                        <Minimize2 className="w-5 h-5" />
                                    ) : (
                                        <Maximize2 className="w-5 h-5" />
                                    )}
                                </Button>
                                <Button
                                    onClick={handleDownload}
                                    className="h-10 bg-blue-600 hover:bg-blue-700 text-white"
                                >
                                    <Download className="w-5 h-5 mr-2" />
                                    Download
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* PDF Toolbar */}
            {!loading && isPDF && (
                <div
                    className={`fixed bottom-0 left-0 right-0 z-[10000] bg-black/80 backdrop-blur-md border-t border-white/10 transition-transform duration-300 ${
                        showControls ? 'translate-y-0' : 'translate-y-full'
                    }`}
                >
                    <div className="px-6 py-4 flex justify-center">
                        <Button
                            onClick={handleDownload}
                            className="h-10 bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            <Download className="w-5 h-5 mr-2" />
                            Download PDF
                        </Button>
                    </div>
                </div>
            )}

            {/* Main Content Area */}
            <div
                className="absolute inset-0 flex items-center justify-center"
                onClick={() => setShowControls((prev) => !prev)}
            >
                {loading ? (
                    <div className="text-center">
                        <Loader2 className="w-16 h-16 animate-spin text-blue-500 mx-auto mb-4" />
                        <p className="text-white text-lg font-medium">Loading preview...</p>
                    </div>
                ) : (
                    <div
                        className={`w-full h-full flex items-center justify-center transition-all duration-300 ${
                            isFullscreen ? 'p-0' : 'p-20'
                        }`}
                    >
                        {isPDF ? (
                            <div className={`w-full h-full ${isFullscreen ? '' : 'max-w-7xl'}`}>
                                <iframe
                                    src={previewUrl}
                                    className="w-full h-full border-0 rounded-lg shadow-2xl"
                                    title={document.document_name}
                                    onClick={(e) => e.stopPropagation()}
                                />
                            </div>
                        ) : isImage ? (
                            <div
                                className="transition-all duration-300 ease-out cursor-move"
                                style={{
                                    transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                                }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <img
                                    src={previewUrl}
                                    alt={document.document_name}
                                    className={`object-contain shadow-2xl rounded-lg transition-all duration-300 ${
                                        isFullscreen
                                            ? 'max-w-[100vw] max-h-[100vh]'
                                            : 'max-w-[90vw] max-h-[90vh]'
                                    }`}
                                    style={{
                                        imageRendering: zoom > 100 ? 'crisp-edges' : 'auto',
                                    }}
                                    draggable={false}
                                />
                            </div>
                        ) : (
                            <div className="text-center p-12 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 max-w-md">
                                <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <X className="w-10 h-10 text-white/60" />
                                </div>
                                <p className="text-white text-lg font-semibold mb-2">
                                    Preview not available
                                </p>
                                <p className="text-gray-300 text-sm mb-6">
                                    This file type cannot be previewed in the browser
                                </p>
                                <Button
                                    onClick={handleDownload}
                                    className="bg-blue-600 hover:bg-blue-700 text-white"
                                >
                                    <Download className="w-5 h-5 mr-2" />
                                    Download to View
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Description overlay - Bottom right */}
            {document?.description && !loading && showControls && !isFullscreen && (
                <div className="fixed bottom-24 right-6 z-[10000] max-w-md bg-black/80 backdrop-blur-md border border-white/10 rounded-lg p-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <p className="text-xs font-semibold text-gray-300 mb-1">Description:</p>
                    <p className="text-sm text-white leading-relaxed">{document.description}</p>
                </div>
            )}

            {/* Keyboard shortcuts hint */}
            {showControls && !loading && !isFullscreen && (
                <div className="fixed bottom-24 left-6 z-[10000] bg-black/80 backdrop-blur-md border border-white/10 rounded-lg p-3 text-xs text-gray-300 animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <div className="font-semibold mb-2">Keyboard Shortcuts:</div>
                    <div className="space-y-1">
                        <div>
                            <kbd className="px-1.5 py-0.5 bg-white/10 rounded">Esc</kbd> Close
                        </div>
                        <div>
                            <kbd className="px-1.5 py-0.5 bg-white/10 rounded">+/-</kbd> Zoom
                        </div>
                        <div>
                            <kbd className="px-1.5 py-0.5 bg-white/10 rounded">R</kbd> Rotate
                        </div>
                        <div>
                            <kbd className="px-1.5 py-0.5 bg-white/10 rounded">0</kbd> Reset
                        </div>
                        <div>
                            <kbd className="px-1.5 py-0.5 bg-white/10 rounded">F</kbd> Fullscreen
                        </div>
                    </div>
                </div>
            )}
        </div>
    )

    return createPortal(content, window.document.body)
}

export default DocumentPreviewModal
