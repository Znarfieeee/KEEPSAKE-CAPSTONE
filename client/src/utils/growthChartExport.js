/**
 * Growth Chart Export Utilities
 * Provides functions to export growth charts to PDF, PNG, and print
 */

import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

/**
 * Export growth chart to PNG image
 * @param {string} chartId - ID of the chart container element
 * @param {object} patient - Patient data
 * @param {string} chartType - Type of chart (wfa, lhfa, etc.)
 * @returns {Promise<void>}
 */
export const exportChartToPNG = async (chartId, patient, chartType) => {
    try {
        const chartElement = document.getElementById(chartId)
        if (!chartElement) {
            throw new Error('Chart element not found')
        }

        // Create canvas from the chart element
        const canvas = await html2canvas(chartElement, {
            backgroundColor: '#ffffff',
            scale: 2, // Higher quality
            logging: false,
        })

        // Convert to blob and download
        canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = `${patient.firstname}_${patient.lastname}_${chartType}_${new Date().toISOString().split('T')[0]}.png`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            URL.revokeObjectURL(url)
        })
    } catch (error) {
        console.error('Error exporting chart to PNG:', error)
        throw error
    }
}

/**
 * Export growth chart to PDF
 * @param {string} chartId - ID of the chart container element
 * @param {object} patient - Patient data
 * @param {string} chartType - Type of chart
 * @param {string} chartTitle - Title of the chart
 * @returns {Promise<void>}
 */
export const exportChartToPDF = async (chartId, patient, chartType, chartTitle) => {
    try {
        const chartElement = document.getElementById(chartId)
        if (!chartElement) {
            throw new Error('Chart element not found')
        }

        // Create canvas from the chart element
        const canvas = await html2canvas(chartElement, {
            backgroundColor: '#ffffff',
            scale: 2,
            logging: false,
        })

        const imgData = canvas.toDataURL('image/png')
        const pdf = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: 'a4',
        })

        // Calculate dimensions to fit page
        const pageWidth = pdf.internal.pageSize.getWidth()
        const pageHeight = pdf.internal.pageSize.getHeight()
        const imgWidth = pageWidth - 20 // 10mm margin on each side
        const imgHeight = (canvas.height * imgWidth) / canvas.width

        // Add header
        pdf.setFontSize(16)
        pdf.text(`Growth Chart: ${chartTitle}`, pageWidth / 2, 15, { align: 'center' })

        pdf.setFontSize(12)
        pdf.text(
            `Patient: ${patient.firstname} ${patient.lastname}`,
            pageWidth / 2,
            25,
            { align: 'center' }
        )

        pdf.setFontSize(10)
        pdf.text(
            `Date of Birth: ${new Date(patient.birthdate || patient.date_of_birth).toLocaleDateString()}`,
            pageWidth / 2,
            32,
            { align: 'center' }
        )

        pdf.text(
            `Sex: ${patient.sex}`,
            pageWidth / 2,
            37,
            { align: 'center' }
        )

        pdf.text(
            `Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`,
            pageWidth / 2,
            42,
            { align: 'center' }
        )

        // Add chart image
        const yPosition = 50
        if (yPosition + imgHeight > pageHeight - 10) {
            // Scale down if too large
            const scale = (pageHeight - yPosition - 10) / imgHeight
            pdf.addImage(imgData, 'PNG', 10, yPosition, imgWidth * scale, imgHeight * scale)
        } else {
            pdf.addImage(imgData, 'PNG', 10, yPosition, imgWidth, imgHeight)
        }

        // Add footer
        pdf.setFontSize(8)
        pdf.text(
            'WHO Child Growth Standards (2006) - KEEPSAKE Healthcare System',
            pageWidth / 2,
            pageHeight - 5,
            { align: 'center' }
        )

        // Save PDF
        pdf.save(
            `${patient.firstname}_${patient.lastname}_${chartType}_${new Date().toISOString().split('T')[0]}.pdf`
        )
    } catch (error) {
        console.error('Error exporting chart to PDF:', error)
        throw error
    }
}

/**
 * Print growth chart
 * @param {string} chartId - ID of the chart container element
 * @param {object} patient - Patient data
 * @param {string} chartTitle - Title of the chart
 * @returns {Promise<void>}
 */
export const printChart = async (chartId, patient, chartTitle) => {
    try {
        const chartElement = document.getElementById(chartId)
        if (!chartElement) {
            throw new Error('Chart element not found')
        }

        // Create a new window for printing
        const printWindow = window.open('', '_blank')
        if (!printWindow) {
            throw new Error('Could not open print window. Please check pop-up blocker settings.')
        }

        // Create canvas
        const canvas = await html2canvas(chartElement, {
            backgroundColor: '#ffffff',
            scale: 2,
            logging: false,
        })

        const imgData = canvas.toDataURL('image/png')

        // Write HTML to print window
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Growth Chart - ${patient.firstname} ${patient.lastname}</title>
                <style>
                    @media print {
                        @page {
                            size: landscape;
                            margin: 1cm;
                        }
                        body {
                            margin: 0;
                            padding: 0;
                        }
                    }
                    body {
                        font-family: Arial, sans-serif;
                        text-align: center;
                        padding: 20px;
                    }
                    h1 {
                        font-size: 24px;
                        margin-bottom: 10px;
                    }
                    .patient-info {
                        margin: 15px 0;
                        font-size: 14px;
                    }
                    .patient-info p {
                        margin: 5px 0;
                    }
                    img {
                        max-width: 100%;
                        height: auto;
                        margin: 20px 0;
                    }
                    .footer {
                        margin-top: 20px;
                        font-size: 10px;
                        color: #666;
                    }
                </style>
            </head>
            <body>
                <h1>Growth Chart: ${chartTitle}</h1>
                <div class="patient-info">
                    <p><strong>Patient:</strong> ${patient.firstname} ${patient.lastname}</p>
                    <p><strong>Date of Birth:</strong> ${new Date(patient.birthdate || patient.date_of_birth).toLocaleDateString()}</p>
                    <p><strong>Sex:</strong> ${patient.sex}</p>
                    <p><strong>Generated:</strong> ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</p>
                </div>
                <img src="${imgData}" alt="Growth Chart" />
                <div class="footer">
                    <p>WHO Child Growth Standards (2006) - KEEPSAKE Healthcare System</p>
                </div>
            </body>
            </html>
        `)

        printWindow.document.close()

        // Wait for image to load, then print
        printWindow.onload = () => {
            setTimeout(() => {
                printWindow.print()
                // Close after printing or cancel
                printWindow.onafterprint = () => printWindow.close()
            }, 500)
        }
    } catch (error) {
        console.error('Error printing chart:', error)
        throw error
    }
}

/**
 * Generate growth summary report
 * @param {object} patient - Patient data
 * @param {array} measurements - Array of measurements
 * @param {object} latestInterpretation - Latest measurement interpretation
 * @returns {string} HTML summary report
 */
export const generateGrowthSummary = (patient, measurements, latestInterpretation) => {
    const currentAge = calculateAge(patient.birthdate || patient.date_of_birth)
    const totalMeasurements = measurements.length
    const firstMeasurement = measurements[0]
    const lastMeasurement = measurements[measurements.length - 1]

    return `
        <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">
                Growth Summary Report
            </h1>

            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h2 style="margin-top: 0;">Patient Information</h2>
                <p><strong>Name:</strong> ${patient.firstname} ${patient.lastname}</p>
                <p><strong>Date of Birth:</strong> ${new Date(patient.birthdate || patient.date_of_birth).toLocaleDateString()}</p>
                <p><strong>Current Age:</strong> ${currentAge.years} years ${currentAge.months} months</p>
                <p><strong>Sex:</strong> ${patient.sex}</p>
            </div>

            <div style="margin: 20px 0;">
                <h2>Growth Summary</h2>
                <p><strong>Total Measurements:</strong> ${totalMeasurements}</p>
                <p><strong>Measurement Period:</strong> ${new Date(firstMeasurement.date).toLocaleDateString()} to ${new Date(lastMeasurement.date).toLocaleDateString()}</p>
            </div>

            <div style="background-color: #eff6ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h2 style="margin-top: 0;">Latest Assessment</h2>
                <p><strong>Date:</strong> ${new Date(lastMeasurement.date).toLocaleDateString()}</p>
                <p><strong>Weight:</strong> ${lastMeasurement.weight ? lastMeasurement.weight.toFixed(2) + ' kg' : 'Not recorded'}</p>
                <p><strong>Height:</strong> ${lastMeasurement.height ? lastMeasurement.height.toFixed(2) + ' cm' : 'Not recorded'}</p>
                <p><strong>Head Circumference:</strong> ${lastMeasurement.headCircumference ? lastMeasurement.headCircumference.toFixed(2) + ' cm' : 'Not recorded'}</p>
                ${latestInterpretation ? `
                    <div style="margin-top: 15px; padding: 10px; background-color: white; border-left: 4px solid ${getColorForStatus(latestInterpretation.color)};">
                        <p><strong>Status:</strong> ${latestInterpretation.label}</p>
                        <p><strong>Description:</strong> ${latestInterpretation.description}</p>
                    </div>
                ` : ''}
            </div>

            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280;">
                <p>Generated: ${new Date().toLocaleString()}</p>
                <p>WHO Child Growth Standards (2006) - KEEPSAKE Healthcare System</p>
            </div>
        </div>
    `
}

/**
 * Calculate age from birthdate
 * @param {string|Date} birthdate - Patient's birthdate
 * @returns {object} Age in years and months
 */
function calculateAge(birthdate) {
    const birth = new Date(birthdate)
    const now = new Date()

    let years = now.getFullYear() - birth.getFullYear()
    let months = now.getMonth() - birth.getMonth()

    if (months < 0) {
        years--
        months += 12
    }

    return { years, months }
}

/**
 * Get hex color for status
 * @param {string} color - Color name
 * @returns {string} Hex color code
 */
function getColorForStatus(color) {
    const colors = {
        red: '#ef4444',
        orange: '#f59e0b',
        yellow: '#eab308',
        green: '#10b981',
        blue: '#3b82f6',
        gray: '#6b7280',
    }
    return colors[color] || colors.gray
}

export default {
    exportChartToPNG,
    exportChartToPDF,
    printChart,
    generateGrowthSummary,
}
