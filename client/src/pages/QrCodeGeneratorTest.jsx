import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { IoMdArrowBack } from 'react-icons/io'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import QrCodeGenerator from '@/components/ui/QrCodeGenerator'

const QrCodeGeneratorTest = () => {
    const navigate = useNavigate()
    const [patientId, setPatientId] = useState('PAT-2024-001')
    const [patientName, setPatientName] = useState('Juan Dela Cruz')
    const [facilityId, setFacilityId] = useState('FAC-001')
    const [showQr, setShowQr] = useState(true)

    // Sample patients for quick testing
    const samplePatients = [
        { id: 'PAT-2024-001', name: 'Juan Dela Cruz', facilityId: 'FAC-001' },
        { id: 'PAT-2024-002', name: 'Maria Santos', facilityId: 'FAC-001' },
        { id: 'PAT-2024-003', name: 'Jose Reyes', facilityId: 'FAC-002' },
        { id: 'PAT-2024-004', name: 'Ana Gonzales', facilityId: 'FAC-001' },
    ]

    const handleGenerateQr = () => {
        setShowQr(false)
        setTimeout(() => setShowQr(true), 10)
    }

    const loadSamplePatient = (patient) => {
        setPatientId(patient.id)
        setPatientName(patient.name)
        setFacilityId(patient.facilityId)
        setShowQr(false)
        setTimeout(() => setShowQr(true), 10)
    }

    return (
        <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-white to-purple-50">
            {/* Back Button */}
            <div className="absolute top-8 left-8 z-10">
                <div
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-gray-700 hover:text-primary transition duration-300 ease-in-out cursor-pointer bg-white px-4 py-2 rounded-lg shadow-sm hover:shadow-md"
                >
                    <IoMdArrowBack className="text-2xl" />
                    <span className="text-sm font-medium">Go back</span>
                </div>
            </div>

            <div className="container mx-auto px-4 py-20">
                <div className="max-w-6xl mx-auto">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <h1 className="text-4xl font-bold text-gray-800 mb-2">
                            QR Code Generator (Testing)
                        </h1>
                        <p className="text-gray-600">
                            Generate patient QR codes for testing the scanner
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Input Form */}
                        <Card className="p-6">
                            <h2 className="text-xl font-semibold text-gray-800 mb-4">
                                Patient Information
                            </h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Patient ID
                                    </label>
                                    <input
                                        type="text"
                                        value={patientId}
                                        onChange={(e) => setPatientId(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                                        placeholder="PAT-2024-001"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Patient Name
                                    </label>
                                    <input
                                        type="text"
                                        value={patientName}
                                        onChange={(e) => setPatientName(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                                        placeholder="Juan Dela Cruz"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Facility ID
                                    </label>
                                    <input
                                        type="text"
                                        value={facilityId}
                                        onChange={(e) => setFacilityId(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                                        placeholder="FAC-001"
                                    />
                                </div>

                                <Button
                                    onClick={handleGenerateQr}
                                    className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-2 rounded-lg"
                                >
                                    Generate QR Code
                                </Button>
                            </div>

                            {/* Sample Patients */}
                            <div className="mt-6">
                                <h3 className="text-sm font-medium text-gray-700 mb-3">
                                    Quick Load Sample Patients:
                                </h3>
                                <div className="space-y-2">
                                    {samplePatients.map((patient) => (
                                        <button
                                            key={patient.id}
                                            onClick={() => loadSamplePatient(patient)}
                                            className="w-full text-left px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-md transition text-sm"
                                        >
                                            <p className="font-medium text-gray-800">
                                                {patient.name}
                                            </p>
                                            <p className="text-xs text-gray-600">{patient.id}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </Card>

                        {/* QR Code Display */}
                        <div className="flex items-start justify-center">
                            {showQr && (
                                <QrCodeGenerator
                                    patientId={patientId}
                                    patientName={patientName}
                                    facilityId={facilityId}
                                    size={280}
                                />
                            )}
                        </div>
                    </div>

                    {/* Instructions */}
                    <Card className="mt-8 p-6 bg-blue-50 border-blue-200">
                        <h3 className="font-semibold text-gray-800 mb-2">How to Test:</h3>
                        <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
                            <li>Generate a QR code using the form or sample patients</li>
                            <li>Download the QR code image</li>
                            <li>Navigate to the QR Scanner page</li>
                            <li>Display the QR code on another device or print it</li>
                            <li>Scan the QR code with your camera</li>
                            <li>Verify that patient information is displayed correctly</li>
                        </ol>
                        <p className="mt-3 text-sm text-gray-600">
                            <strong>Note:</strong> The scanner will show different actions based on
                            your role (Doctor, Nurse, Parent, etc.)
                        </p>
                    </Card>
                </div>
            </div>
        </div>
    )
}

export default QrCodeGeneratorTest
