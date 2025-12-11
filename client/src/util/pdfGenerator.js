import jsPDF from 'jspdf'
import 'jspdf-autotable'

/**
 * Generate a professional PDF invoice
 * @param {Object} invoice - Invoice data object
 */
export const generateInvoicePDF = (invoice) => {
    try {
        const doc = new jsPDF()

        // Header Section
        doc.setFontSize(24)
        doc.setFont('helvetica', 'bold')
        doc.text('KEEPSAKE', 105, 20, { align: 'center' })

        doc.setFontSize(11)
        doc.setFont('helvetica', 'normal')
        doc.text('Healthcare Facility Management System', 105, 28, { align: 'center' })

        // Draw a line separator
        doc.setLineWidth(0.5)
        doc.line(20, 35, 190, 35)

        // Invoice Title and Details
        doc.setFontSize(18)
        doc.setFont('helvetica', 'bold')
        doc.text(`Invoice: ${invoice.invoice_number || 'N/A'}`, 20, 48)

        // Invoice Status Badge
        doc.setFontSize(10)
        doc.setFont('helvetica', 'bold')
        const statusX = 150
        const statusY = 45
        const status = (invoice.status || 'pending').toUpperCase()

        // Status background color
        const statusColors = {
            PAID: [34, 197, 94],       // green
            PENDING: [234, 179, 8],     // yellow
            OVERDUE: [239, 68, 68],     // red
            CANCELLED: [156, 163, 175], // gray
            REFUNDED: [168, 85, 247],   // purple
        }
        const statusColor = statusColors[status] || statusColors.PENDING
        doc.setFillColor(...statusColor)
        doc.roundedRect(statusX, statusY, 35, 8, 2, 2, 'F')

        doc.setTextColor(255, 255, 255)
        doc.text(status, statusX + 17.5, statusY + 5.5, { align: 'center' })
        doc.setTextColor(0, 0, 0)

        // Invoice Information
        doc.setFontSize(10)
        doc.setFont('helvetica', 'normal')
        let yPos = 60

        doc.text(`Issue Date: ${formatDate(invoice.issue_date)}`, 20, yPos)
        doc.text(`Due Date: ${formatDate(invoice.due_date)}`, 20, yPos + 6)

        // Billed To Section
        yPos = 75
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(12)
        doc.text('Billed To:', 20, yPos)

        doc.setFont('helvetica', 'normal')
        doc.setFontSize(10)
        yPos += 8
        doc.text(invoice.healthcare_facilities?.facility_name || 'N/A', 20, yPos)
        yPos += 6
        if (invoice.healthcare_facilities?.address) {
            doc.text(invoice.healthcare_facilities.address, 20, yPos)
            yPos += 6
        }
        if (invoice.healthcare_facilities?.city) {
            doc.text(`${invoice.healthcare_facilities.city}${invoice.healthcare_facilities.zip_code ? ', ' + invoice.healthcare_facilities.zip_code : ''}`, 20, yPos)
            yPos += 6
        }
        if (invoice.healthcare_facilities?.email) {
            doc.text(`Email: ${invoice.healthcare_facilities.email}`, 20, yPos)
            yPos += 6
        }
        if (invoice.healthcare_facilities?.contact_number) {
            doc.text(`Phone: ${invoice.healthcare_facilities.contact_number}`, 20, yPos)
            yPos += 6
        }

        // Billing Period
        yPos += 5
        doc.setFont('helvetica', 'bold')
        doc.text('Billing Period:', 20, yPos)
        doc.setFont('helvetica', 'normal')
        yPos += 6
        doc.text(
            `${formatDate(invoice.billing_period_start)} - ${formatDate(invoice.billing_period_end)}`,
            20,
            yPos
        )

        // Line Items Table
        yPos += 15
        const tableData = [
            [
                `${(invoice.plan_type || 'Standard').toUpperCase()} Subscription Plan`,
                `₱${formatCurrency(invoice.subtotal || 0)}`,
            ],
            ['Tax (12%)', `₱${formatCurrency(invoice.tax_amount || 0)}`],
        ]

        doc.autoTable({
            startY: yPos,
            head: [['Description', 'Amount']],
            body: tableData,
            foot: [['Total Amount', `₱${formatCurrency(invoice.total_amount || 0)}`]],
            theme: 'striped',
            headStyles: {
                fillColor: [66, 139, 202],
                textColor: [255, 255, 255],
                fontSize: 11,
                fontStyle: 'bold',
                halign: 'left',
            },
            bodyStyles: {
                fontSize: 10,
            },
            footStyles: {
                fillColor: [240, 240, 240],
                textColor: [0, 0, 0],
                fontSize: 11,
                fontStyle: 'bold',
                halign: 'left',
            },
            columnStyles: {
                0: { cellWidth: 130 },
                1: { halign: 'right', cellWidth: 50 },
            },
            margin: { left: 20, right: 20 },
        })

        // Notes Section
        if (invoice.notes) {
            yPos = doc.lastAutoTable.finalY + 15
            doc.setFont('helvetica', 'bold')
            doc.setFontSize(11)
            doc.text('Notes:', 20, yPos)

            doc.setFont('helvetica', 'normal')
            doc.setFontSize(10)
            yPos += 6
            const splitNotes = doc.splitTextToSize(invoice.notes, 170)
            doc.text(splitNotes, 20, yPos)
        }

        // Footer
        const pageHeight = doc.internal.pageSize.height
        doc.setFont('helvetica', 'italic')
        doc.setFontSize(9)
        doc.setTextColor(100, 100, 100)
        doc.text('Thank you for your business!', 105, pageHeight - 25, { align: 'center' })
        doc.text('This is a computer-generated invoice and does not require a signature.', 105, pageHeight - 20, {
            align: 'center',
        })
        doc.text('For questions, please contact support@keepsake.health', 105, pageHeight - 15, { align: 'center' })

        // Save PDF
        const filename = `Invoice-${invoice.invoice_number || 'DRAFT'}.pdf`
        doc.save(filename)

        return { success: true, filename }
    } catch (error) {
        console.error('Error generating PDF:', error)
        return { success: false, error: error.message }
    }
}

/**
 * Format date to readable string
 * @param {string|Date} dateString - Date to format
 * @returns {string} Formatted date
 */
const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    try {
        const date = new Date(dateString)
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        })
    } catch {
        return 'N/A'
    }
}

/**
 * Format currency amount
 * @param {number} amount - Amount to format
 * @returns {string} Formatted amount
 */
const formatCurrency = (amount) => {
    if (typeof amount !== 'number') {
        amount = parseFloat(amount) || 0
    }
    return amount.toLocaleString('en-PH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })
}
