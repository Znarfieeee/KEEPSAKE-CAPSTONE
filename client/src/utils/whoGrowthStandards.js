/**
 * WHO Child Growth Standards - Z-Score Calculations
 *
 * This module implements WHO growth standards for children aged 0-5 years.
 * Reference: WHO Child Growth Standards (2006)
 * https://www.who.int/tools/child-growth-standards
 *
 * Z-score formula: Z = (X - M) / S
 * Where:
 * - X = observed value
 * - M = median (L=0) or mean (L≠0)
 * - S = standard deviation
 * - L = power in the Box-Cox transformation
 *
 * LMS Method: Z = ((X/M)^L - 1) / (L * S)
 */

import { getLMSParameters as getWHOLMS } from '@/data/whoReferenceData'

/**
 * WHO Growth Standards Reference Data Structure
 * Note: This is a simplified structure. In production, you should load complete
 * WHO reference tables from JSON files containing all age points.
 *
 * Full WHO data tables available at:
 * https://www.who.int/tools/child-growth-standards/standards
 */

/**
 * Calculate Z-score using the LMS method
 * @param {number} value - Observed measurement
 * @param {number} L - Box-Cox power
 * @param {number} M - Median
 * @param {number} S - Coefficient of variation
 * @returns {number} Z-score
 */
export function calculateZScore(value, L, M, S) {
    if (!value || !M || !S) return null

    if (Math.abs(L) < 0.01) {
        // When L is very close to 0, use logarithmic formula
        return Math.log(value / M) / S
    }

    // Standard LMS formula
    return (Math.pow(value / M, L) - 1) / (L * S)
}

/**
 * Calculate age in months from birthdate
 * @param {Date|string} birthdate - Patient's birthdate
 * @param {Date|string} measurementDate - Date of measurement (defaults to today)
 * @returns {number} Age in months
 */
export function calculateAgeInMonths(birthdate, measurementDate = new Date()) {
    const birth = new Date(birthdate)
    const measurement = new Date(measurementDate)

    const years = measurement.getFullYear() - birth.getFullYear()
    const months = measurement.getMonth() - birth.getMonth()
    const days = measurement.getDate() - birth.getDate()

    let totalMonths = years * 12 + months
    if (days < 0) {
        totalMonths -= 1
    }

    return totalMonths
}

/**
 * Calculate age in days from birthdate
 * @param {Date|string} birthdate - Patient's birthdate
 * @param {Date|string} measurementDate - Date of measurement
 * @returns {number} Age in days
 */
export function calculateAgeInDays(birthdate, measurementDate = new Date()) {
    const birth = new Date(birthdate)
    const measurement = new Date(measurementDate)
    const diffTime = Math.abs(measurement - birth)
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

/**
 * Get LMS parameters for a specific chart type, sex, and age
 * Uses WHO reference data with linear interpolation
 *
 * @param {string} chartType - Type of chart (wfa, lhfa, wfh, hcfa, bfa)
 * @param {string} sex - 'male' or 'female'
 * @param {number} ageInMonths - Age in months (or length/height for wfh)
 * @returns {Object} LMS parameters {L, M, S}
 */
export function getLMSParameters(chartType, sex, ageInMonths) {
    return getWHOLMS(chartType, sex, ageInMonths)
}

/**
 * Calculate Weight-for-Age Z-score
 * @param {number} weight - Weight in kg
 * @param {number} ageInMonths - Age in months
 * @param {string} sex - 'male' or 'female'
 * @returns {number|null} Z-score
 */
export function calculateWeightForAgeZScore(weight, ageInMonths, sex) {
    const lms = getLMSParameters('wfa', sex, ageInMonths)
    if (!lms) return null
    return calculateZScore(weight, lms.L, lms.M, lms.S)
}

/**
 * Calculate Length/Height-for-Age Z-score
 * @param {number} length - Length/height in cm
 * @param {number} ageInMonths - Age in months
 * @param {string} sex - 'male' or 'female'
 * @returns {number|null} Z-score
 */
export function calculateLengthForAgeZScore(length, ageInMonths, sex) {
    const lms = getLMSParameters('lhfa', sex, ageInMonths)
    if (!lms) return null
    return calculateZScore(length, lms.L, lms.M, lms.S)
}

/**
 * Calculate Weight-for-Length/Height Z-score
 * @param {number} weight - Weight in kg
 * @param {number} length - Length/height in cm
 * @param {string} sex - 'male' or 'female'
 * @returns {number|null} Z-score
 */
export function calculateWeightForLengthZScore(weight, length, sex) {
    const lms = getLMSParameters('wfh', sex, length)
    if (!lms) return null
    return calculateZScore(weight, lms.L, lms.M, lms.S)
}

/**
 * Calculate Head Circumference-for-Age Z-score
 * @param {number} headCircumference - Head circumference in cm
 * @param {number} ageInMonths - Age in months
 * @param {string} sex - 'male' or 'female'
 * @returns {number|null} Z-score
 */
export function calculateHeadCircumferenceForAgeZScore(headCircumference, ageInMonths, sex) {
    const lms = getLMSParameters('hcfa', sex, ageInMonths)
    if (!lms) return null
    return calculateZScore(headCircumference, lms.L, lms.M, lms.S)
}

/**
 * Calculate BMI-for-Age Z-score
 * @param {number} weight - Weight in kg
 * @param {number} length - Length/height in meters
 * @param {number} ageInMonths - Age in months
 * @param {string} sex - 'male' or 'female'
 * @returns {number|null} Z-score
 */
export function calculateBMIForAgeZScore(weight, length, ageInMonths, sex) {
    const heightInMeters = length / 100
    const bmi = weight / (heightInMeters * heightInMeters)

    const lms = getLMSParameters('bfa', sex, ageInMonths)
    if (!lms) return null
    return calculateZScore(bmi, lms.L, lms.M, lms.S)
}

/**
 * Interpret Z-score according to WHO standards
 * @param {number} zScore - Calculated Z-score
 * @param {string} chartType - Type of chart for context
 * @returns {Object} Interpretation with status and description
 */
export function interpretZScore(zScore, chartType) {
    if (zScore === null || isNaN(zScore)) {
        return {
            status: 'unknown',
            label: 'Unknown',
            description: 'Insufficient data to calculate',
            color: 'gray'
        }
    }

    // Interpretations vary by chart type
    switch (chartType) {
        case 'wfa': // Weight-for-age
            if (zScore < -3) return { status: 'severely-underweight', label: 'Severely Underweight', description: 'Below -3 SD', color: 'red' }
            if (zScore < -2) return { status: 'underweight', label: 'Underweight', description: 'Between -3 and -2 SD', color: 'orange' }
            if (zScore <= 2) return { status: 'normal', label: 'Normal', description: 'Between -2 and +2 SD', color: 'green' }
            if (zScore <= 3) return { status: 'overweight', label: 'Overweight', description: 'Between +2 and +3 SD', color: 'orange' }
            return { status: 'obese', label: 'Obese', description: 'Above +3 SD', color: 'red' }

        case 'lhfa': // Length/Height-for-age
            if (zScore < -3) return { status: 'severely-stunted', label: 'Severely Stunted', description: 'Below -3 SD', color: 'red' }
            if (zScore < -2) return { status: 'stunted', label: 'Stunted', description: 'Between -3 and -2 SD', color: 'orange' }
            if (zScore <= 2) return { status: 'normal', label: 'Normal', description: 'Between -2 and +2 SD', color: 'green' }
            return { status: 'tall', label: 'Tall', description: 'Above +2 SD', color: 'blue' }

        case 'wfh': // Weight-for-length/height
            if (zScore < -3) return { status: 'severely-wasted', label: 'Severely Wasted', description: 'Below -3 SD', color: 'red' }
            if (zScore < -2) return { status: 'wasted', label: 'Wasted', description: 'Between -3 and -2 SD', color: 'orange' }
            if (zScore <= 1) return { status: 'normal', label: 'Normal', description: 'Between -2 and +1 SD', color: 'green' }
            if (zScore <= 2) return { status: 'possible-overweight', label: 'Possible Overweight', description: 'Between +1 and +2 SD', color: 'yellow' }
            if (zScore <= 3) return { status: 'overweight', label: 'Overweight', description: 'Between +2 and +3 SD', color: 'orange' }
            return { status: 'obese', label: 'Obese', description: 'Above +3 SD', color: 'red' }

        case 'hcfa': // Head circumference-for-age
            if (zScore < -3) return { status: 'microcephaly-severe', label: 'Severe Microcephaly', description: 'Below -3 SD', color: 'red' }
            if (zScore < -2) return { status: 'microcephaly', label: 'Microcephaly', description: 'Between -3 and -2 SD', color: 'orange' }
            if (zScore <= 2) return { status: 'normal', label: 'Normal', description: 'Between -2 and +2 SD', color: 'green' }
            if (zScore <= 3) return { status: 'macrocephaly', label: 'Macrocephaly', description: 'Between +2 and +3 SD', color: 'orange' }
            return { status: 'macrocephaly-severe', label: 'Severe Macrocephaly', description: 'Above +3 SD', color: 'red' }

        case 'bfa': // BMI-for-age
            if (zScore < -3) return { status: 'severely-wasted', label: 'Severely Wasted', description: 'Below -3 SD', color: 'red' }
            if (zScore < -2) return { status: 'wasted', label: 'Wasted', description: 'Between -3 and -2 SD', color: 'orange' }
            if (zScore <= 1) return { status: 'normal', label: 'Normal', description: 'Between -2 and +1 SD', color: 'green' }
            if (zScore <= 2) return { status: 'possible-overweight', label: 'Possible Overweight', description: 'Between +1 and +2 SD', color: 'yellow' }
            if (zScore <= 3) return { status: 'overweight', label: 'Overweight', description: 'Between +2 and +3 SD', color: 'orange' }
            return { status: 'obese', label: 'Obese', description: 'Above +3 SD', color: 'red' }

        default:
            return { status: 'unknown', label: 'Unknown', description: 'Unknown chart type', color: 'gray' }
    }
}

/**
 * Get chart configuration
 * @param {string} chartType - Chart type code
 * @returns {Object} Chart configuration
 */
export function getChartConfig(chartType) {
    const configs = {
        wfa: {
            id: 'wfa',
            title: 'Weight-for-Age',
            subtitle: 'Birth to 5 years',
            xAxis: 'Age (months)',
            yAxis: 'Weight (kg)',
            ageRange: [0, 60],
            color: '#3b82f6'
        },
        lhfa: {
            id: 'lhfa',
            title: 'Length/Height-for-Age',
            subtitle: 'Birth to 5 years',
            xAxis: 'Age (months)',
            yAxis: 'Length/Height (cm)',
            ageRange: [0, 60],
            color: '#10b981'
        },
        wfh: {
            id: 'wfh',
            title: 'Weight-for-Length/Height',
            subtitle: 'Birth to 5 years',
            xAxis: 'Length/Height (cm)',
            yAxis: 'Weight (kg)',
            ageRange: [45, 110],
            color: '#f59e0b'
        },
        hcfa: {
            id: 'hcfa',
            title: 'Head Circumference-for-Age',
            subtitle: 'Birth to 5 years',
            xAxis: 'Age (months)',
            yAxis: 'Head Circumference (cm)',
            ageRange: [0, 60],
            color: '#8b5cf6'
        },
        bfa: {
            id: 'bfa',
            title: 'BMI-for-Age',
            subtitle: 'Birth to 5 years',
            xAxis: 'Age (months)',
            yAxis: 'BMI (kg/m²)',
            ageRange: [0, 60],
            color: '#ec4899'
        }
    }

    return configs[chartType] || configs.wfa
}

/**
 * Calculate value from Z-score using inverse LMS method
 * @param {number} zScore - Target Z-score
 * @param {number} L - Box-Cox power
 * @param {number} M - Median
 * @param {number} S - Coefficient of variation
 * @returns {number} Calculated value
 */
export function calculateValueFromZScore(zScore, L, M, S) {
    if (!M || !S) return null

    if (Math.abs(L) < 0.01) {
        // When L is very close to 0, use logarithmic formula
        return M * Math.exp(S * zScore)
    }

    // Inverse LMS formula: X = M * (1 + L * S * Z)^(1/L)
    return M * Math.pow(1 + L * S * zScore, 1 / L)
}

/**
 * Generate WHO reference curve data for a specific chart type
 * @param {string} chartType - Type of chart (wfa, lhfa, wfh, hcfa, bfa)
 * @param {string} sex - 'male' or 'female'
 * @param {Array} zScores - Array of Z-scores to generate curves for (e.g., [-3, -2, -1, 0, 1, 2, 3])
 * @returns {Object} Object with age points and curve data for each Z-score
 */
export function generateWHOReferenceLines(chartType, sex, zScores = [-3, -2, -1, 0, 1, 2, 3]) {
    const config = getChartConfig(chartType)
    const [minAge, maxAge] = config.ageRange

    // Generate age points (one per month for smooth curves)
    const agePoints = []
    const step = chartType === 'wfh' ? 1 : 1 // For wfh, use length/height as x-axis

    for (let age = minAge; age <= maxAge; age += step) {
        agePoints.push(age)
    }

    // Generate curve data for each Z-score
    const curves = {}
    zScores.forEach(zScore => {
        curves[`sd${zScore}`] = agePoints.map(age => {
            const lms = getLMSParameters(chartType, sex, age)
            if (!lms) return { age, value: null }

            const value = calculateValueFromZScore(zScore, lms.L, lms.M, lms.S)
            return {
                age,
                value: value !== null && !isNaN(value) ? Number(value.toFixed(2)) : null
            }
        }).filter(point => point.value !== null)
    })

    return curves
}

/**
 * Format patient measurements for growth charts
 * @param {Object} patient - Patient data with related records
 * @returns {Array} Formatted measurement data points
 */
export function formatPatientMeasurements(patient) {
    if (!patient?.related_records?.anthropometric_measurements) {
        return []
    }

    const measurements = Array.isArray(patient.related_records.anthropometric_measurements)
        ? patient.related_records.anthropometric_measurements
        : [patient.related_records.anthropometric_measurements]

    // Handle both 'Male'/'Female' and 'male'/'female' formats
    const sex = (patient.sex || 'male').toLowerCase() === 'male' ? 'male' : 'female'

    // Support both birthdate and date_of_birth field names
    const birthdate = patient.birthdate || patient.date_of_birth

    if (!birthdate) {
        console.warn('Patient has no birthdate field, cannot calculate age for measurements')
        return []
    }

    return measurements
        .filter(m => m && m.measurement_date)
        .map(measurement => {
            const ageMonths = calculateAgeInMonths(birthdate, measurement.measurement_date)
            const weight = parseFloat(measurement.weight) || null
            const height = parseFloat(measurement.height) || parseFloat(measurement.length) || null
            const headCirc = parseFloat(measurement.head_circumference) || null

            return {
                date: measurement.measurement_date,
                ageMonths,
                weight,
                height,
                headCircumference: headCirc,
                // Calculate Z-scores
                zScores: {
                    wfa: weight ? calculateWeightForAgeZScore(weight, ageMonths, sex) : null,
                    lhfa: height ? calculateLengthForAgeZScore(height, ageMonths, sex) : null,
                    wfh: (weight && height) ? calculateWeightForLengthZScore(weight, height, sex) : null,
                    hcfa: headCirc ? calculateHeadCircumferenceForAgeZScore(headCirc, ageMonths, sex) : null,
                    bfa: (weight && height) ? calculateBMIForAgeZScore(weight, height, ageMonths, sex) : null
                }
            }
        })
        .sort((a, b) => a.ageMonths - b.ageMonths)
}

export default {
    calculateZScore,
    calculateValueFromZScore,
    calculateAgeInMonths,
    calculateAgeInDays,
    calculateWeightForAgeZScore,
    calculateLengthForAgeZScore,
    calculateWeightForLengthZScore,
    calculateHeadCircumferenceForAgeZScore,
    calculateBMIForAgeZScore,
    interpretZScore,
    getChartConfig,
    generateWHOReferenceLines,
    formatPatientMeasurements
}
