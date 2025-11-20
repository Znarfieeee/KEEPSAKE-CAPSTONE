import React, { useState } from "react"
import { Button } from "../ui/Button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "../ui/dialog"
import { MdQrCode2, MdShare } from "react-icons/md"
import { FiList } from "react-icons/fi"
import SecureQRGenerator from "./SecureQRGenerator"
import QRCodeList from "./QRCodeList"

const PatientQRShareButton = ({
    patientId,
    patientName = "",
    shareType = "medical_record",
    defaultScope = ["view_only", "allergies"],
    buttonText = "Share via QR",
    buttonVariant = "outline",
    buttonSize = "default",
    showIcon = true,
    showManagement = true,
    className = ""
}) => {
    const [showModal, setShowModal] = useState(false)
    const [activeTab, setActiveTab] = useState("generate") // "generate" or "manage"

    const handleOpenModal = () => {
        setShowModal(true)
        setActiveTab("generate")
    }

    const handleCloseModal = () => {
        setShowModal(false)
    }

    return (
        <>
            <Button
                variant={buttonVariant}
                size={buttonSize}
                onClick={handleOpenModal}
                className={`flex items-center gap-2 ${className}`}
            >
                {showIcon && <MdShare className="text-lg" />}
                {buttonText}
            </Button>

            <Dialog open={showModal} onOpenChange={handleCloseModal}>
                <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-primary/10 rounded-full">
                                <MdQrCode2 className="text-2xl text-primary" />
                            </div>
                            <div>
                                <DialogTitle>Patient QR Code Sharing</DialogTitle>
                                {patientName && (
                                    <p className="text-sm text-gray-600 mt-1">
                                        Patient: <span className="font-medium">{patientName}</span>
                                    </p>
                                )}
                            </div>
                        </div>
                    </DialogHeader>

                    {/* Tab Navigation */}
                    {showManagement && (
                        <div className="flex border-b">
                            <button
                                onClick={() => setActiveTab("generate")}
                                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                                    activeTab === "generate"
                                        ? "border-primary text-primary"
                                        : "border-transparent text-gray-500 hover:text-gray-700"
                                }`}
                            >
                                <span className="flex items-center gap-2">
                                    <MdQrCode2 />
                                    Generate QR
                                </span>
                            </button>
                            <button
                                onClick={() => setActiveTab("manage")}
                                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                                    activeTab === "manage"
                                        ? "border-primary text-primary"
                                        : "border-transparent text-gray-500 hover:text-gray-700"
                                }`}
                            >
                                <span className="flex items-center gap-2">
                                    <FiList />
                                    Manage QR Codes
                                </span>
                            </button>
                        </div>
                    )}

                    {/* Tab Content */}
                    <div className="flex-1 overflow-y-auto py-4 px-1">
                        {activeTab === "generate" ? (
                            <SecureQRGenerator
                                patientId={patientId}
                                shareType={shareType}
                                defaultScope={defaultScope}
                                onGenerate={(response) => {
                                    console.log("QR Generated:", response)
                                }}
                                onError={(error) => {
                                    console.error("QR Generation Error:", error)
                                }}
                            />
                        ) : (
                            <QRCodeList
                                patientId={patientId}
                                onRefresh={() => {
                                    // Optional: refresh any parent data
                                }}
                            />
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}

export default PatientQRShareButton
