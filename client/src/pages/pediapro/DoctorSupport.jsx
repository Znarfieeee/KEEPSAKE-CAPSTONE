import React, { useState } from "react"

const DoctorSupport = () => {
    const [openFaq, setOpenFaq] = useState(null)

    const faqs = [
        {
            question: "How do I add a new patient record?",
            answer: "Go to Patient Records, find the patient you want to update, and click on their record. You can then edit their information and save the changes.",
        },
        {
            question: "How do I schedule an appointment?",
            answer: 'Navigate to the Appointments section and click the "Add Appointment" button. Fill in the patient details, date, time, and purpose.',
        },
        {
            question: "How do I use the QR Code Scanner?",
            answer: "The QR Code Scanner can be found in the patient records section. Simply click the scanner icon and point your device camera at the QR code.",
        },
        {
            question: "How can I view vaccination reports?",
            answer: 'Go to Reports & Analytics, then select the "Immunization Reports" tab to view detailed vaccination data and compliance rates.',
        },
        {
            question: "What if I forget my password?",
            answer: 'Click on the "Forgot Password" link on the login page and follow the instructions to reset your password.',
        },
        {
            question: "How do I update patient information?",
            answer: "Go to Patient Records, find the patient you want to update, and click on their record. You can then edit their information and save the changes.",
        },
    ]

    const systemStatus = [
        {
            system: "Patient Records System",
            status: "Operational",
            color: "green",
        },
        {
            system: "Appointment Scheduling",
            status: "Operational",
            color: "green",
        },
        { system: "QR Code Scanner", status: "Operational", color: "green" },
        {
            system: "Reports & Analytics",
            status: "Operational",
            color: "green",
        },
    ]
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">
                    Help & Support
                </h1>
            </div>

            <div className="bg-white rounded-lg shadow-sm border">
                <div className="p-6 border-b">
                    <h3 className="text-lg font-semibold text-gray-900">
                        Frequently Asked Questions
                    </h3>
                    <p className="text-sm text-gray-500">
                        Find answers to common questions about using KeepSafe
                    </p>
                </div>
                <div className="p-6 space-y-4">
                    {faqs.map((faq, idx) => (
                        <div
                            key={idx}
                            className="border-b last:border-b-0 pb-4 last:pb-0">
                            <button
                                className="w-full text-left flex justify-between items-center py-2"
                                onClick={() =>
                                    setOpenFaq(openFaq === idx ? null : idx)
                                }>
                                <span className="font-medium text-gray-900">
                                    {faq.question}
                                </span>
                                <ChevronDown
                                    className={`h-4 w-4 text-gray-500 transform transition-transform ${
                                        openFaq === idx ? "rotate-180" : ""
                                    }`}
                                />
                            </button>
                            {openFaq === idx && (
                                <div className="mt-2 text-sm text-gray-600">
                                    {faq.answer}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border">
                <div className="p-6 border-b">
                    <h3 className="text-lg font-semibold text-gray-900">
                        Need More Help?
                    </h3>
                </div>
            </div>
        </div>
    )
}

export default DoctorSupport
