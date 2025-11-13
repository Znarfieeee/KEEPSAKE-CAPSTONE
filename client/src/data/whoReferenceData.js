/**
 * WHO Child Growth Standards Reference Data
 *
 * This file loads complete WHO reference tables for growth standards (0-5 years)
 *
 * Data Source: World Health Organization Child Growth Standards (2006)
 * https://www.who.int/tools/child-growth-standards/standards
 *
 * Data Structure:
 * - For files with LMS parameters:
 *   - L: Box-Cox power transformation
 *   - M: Median
 *   - S: Coefficient of variation
 * - For files with Z-score tables:
 *   - SD3neg, SD2neg, SD1neg, SD0, SD1, SD2, SD3: Standard deviation values
 *
 * Age measurement:
 * - Months (0-60) for age-based charts
 * - Centimeters for height/length-based charts (WFH)
 */

import whoData from './whoReferenceData.json'

/**
 * Linear interpolation to get values between data points
 * @param {Array} data - Reference data array
 * @param {number} value - Age in months or length/height in cm
 * @param {string} key - 'month' or 'key' (for cm values)
 * @returns {Object|null} Interpolated values
 */
function interpolateData(data, value, key = 'month') {
    if (!data || data.length === 0) return null

    // Handle edge cases
    if (value < data[0][key]) return data[0]
    if (value > data[data.length - 1][key]) return data[data.length - 1]

    // Find the two data points to interpolate between
    let lower = null
    let upper = null

    for (let i = 0; i < data.length; i++) {
        if (data[i][key] <= value) {
            lower = data[i]
        }
        if (data[i][key] >= value && !upper) {
            upper = data[i]
            break
        }
    }

    // Exact match
    if (lower && lower[key] === value) {
        return lower
    }

    // Out of range - use nearest
    if (!lower) return upper
    if (!upper) return lower

    // Linear interpolation for all numeric fields
    const ratio = (value - lower[key]) / (upper[key] - lower[key])
    const interpolated = { [key]: value }

    for (const field in lower) {
        if (field !== key && typeof lower[field] === 'number') {
            interpolated[field] = lower[field] + ratio * (upper[field] - lower[field])
        }
    }

    return interpolated
}

/**
 * Get LMS parameters for charts that have them (currently only WFA girls has complete LMS data)
 * For other charts, we'll calculate from Z-score tables
 * @param {string} chartType - Type of chart (wfa, lhfa, wfh, hcfa, bfa)
 * @param {string} sex - 'male' or 'female'
 * @param {number} value - Age in months (or length for wfh)
 * @returns {Object|null} LMS parameters {L, M, S} or Z-score data
 */
export function getLMSParameters(chartType, sex, value) {
    const sexKey = sex.toLowerCase() === 'male' ? 'boys' : 'girls'

    try {
        const chartData = whoData[chartType]?.[sexKey]
        if (!chartData || chartData.length === 0) {
            console.warn(`No WHO data available for ${chartType}/${sexKey}`)
            return null
        }

        // Determine key based on chart type
        const key = chartType === 'wfh' ? 'key' : 'month'

        // Interpolate to get data for the specific value
        const interpolated = interpolateData(chartData, value, key)

        if (!interpolated) return null

        // If we have LMS parameters, return them
        if ('L' in interpolated && 'M' in interpolated && 'S' in interpolated) {
            return {
                L: interpolated.L,
                M: interpolated.M,
                S: interpolated.S
            }
        }

        // If we only have Z-score data, estimate LMS from Z-scores
        // Using the median (SD0) as M, and estimating S from the spread
        if ('SD0' in interpolated) {
            const M = interpolated.SD0
            // Estimate S as the average relative difference between SDs
            const S = ((interpolated.SD1 - interpolated.SD0) / M +
                      (interpolated.SD0 - interpolated.SD1neg) / M) / 2
            // For charts without L parameter, assume L=1 (normal distribution)
            const L = 1

            return { L, M, S }
        }

        return null
    } catch (error) {
        console.error('Error getting LMS parameters:', error)
        return null
    }
}

/**
 * Get Z-score reference values for a specific chart type, sex, and age/length
 * This is useful for plotting reference curves on charts
 * @param {string} chartType - Type of chart (wfa, lhfa, wfh, hcfa, bfa)
 * @param {string} sex - 'male' or 'female'
 * @param {number} value - Age in months (or length for wfh)
 * @returns {Object|null} Z-score values {SD3neg, SD2neg, SD1neg, SD0, SD1, SD2, SD3}
 */
export function getZScoreReferences(chartType, sex, value) {
    const sexKey = sex.toLowerCase() === 'male' ? 'boys' : 'girls'

    try {
        const chartData = whoData[chartType]?.[sexKey]
        if (!chartData || chartData.length === 0) {
            return null
        }

        const key = chartType === 'wfh' ? 'key' : 'month'
        const interpolated = interpolateData(chartData, value, key)

        if (!interpolated) return null

        return {
            SD3neg: interpolated.SD3neg,
            SD2neg: interpolated.SD2neg,
            SD1neg: interpolated.SD1neg,
            SD0: interpolated.SD0,
            SD1: interpolated.SD1,
            SD2: interpolated.SD2,
            SD3: interpolated.SD3
        }
    } catch (error) {
        console.error('Error getting Z-score references:', error)
        return null
    }
}

/**
 * Get all reference curves for plotting on charts
 * Returns data points for each standard deviation curve
 * @param {string} chartType - Type of chart
 * @param {string} sex - 'male' or 'female'
 * @param {number} minValue - Minimum age/length value
 * @param {number} maxValue - Maximum age/length value
 * @param {number} step - Step size for data points
 * @returns {Array} Array of curve data
 */
export function getReferenceCurves(chartType, sex, minValue = 0, maxValue = 60, step = 1) {
    const curves = {
        SD3neg: [],
        SD2neg: [],
        SD1neg: [],
        SD0: [],
        SD1: [],
        SD2: [],
        SD3: []
    }

    for (let value = minValue; value <= maxValue; value += step) {
        const refs = getZScoreReferences(chartType, sex, value)
        if (refs) {
            Object.keys(curves).forEach(key => {
                curves[key].push({ x: value, y: refs[key] })
            })
        }
    }

    return curves
}

/**
 * Get the complete dataset for a specific chart and sex
 * @param {string} chartType - Type of chart
 * @param {string} sex - 'male' or 'female'
 * @returns {Array|null} Complete dataset
 */
export function getChartData(chartType, sex) {
    const sexKey = sex.toLowerCase() === 'male' ? 'boys' : 'girls'
    return whoData[chartType]?.[sexKey] || null
}

export default {
    getLMSParameters,
    getZScoreReferences,
    getReferenceCurves,
    getChartData
}
