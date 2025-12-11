/**
 * Sanitizes user input to prevent XSS attacks and SQL injection
 * @param {string} input - The user input to sanitize
 * @returns {string} - The sanitized input
 */
export function sanitizeInput(input) {
    if (typeof input !== 'string') {
        return input
    }

    return (
        input
            // Remove HTML tags
            .replace(/<[^>]*>/g, '')
            // Replace special characters except blood type symbols
            .replace(/[&<>"'`=\/]/g, (match) => {
                // Preserve + and - symbols for blood types
                if (match === '+' || match === '-') return match
                return ''
            })
            // Remove SQL injection attempts
            .replace(/(\b)(on\S+)(\s*)=/g, '') // Remove JS event handlers
            .replace(/(javascript|script|eval|trustedTypes)/gi, '')
            .replace(/(([\0-\x08,\x0B,\x0C,\x0E-\x1F,\x7F]|^-|#|--|;|\\|\/\*|\*\/|\+)+)/g, '') // Remove SQL special chars
            .trim()
    )
}

/**
 * Check if a string can be converted to a valid number
 * @param {string} value - The string to check
 * @returns {boolean} - Whether the string is numeric
 */
function isNumeric(value) {
    if (typeof value === 'number') return true
    if (typeof value !== 'string') return false
    return !isNaN(value) && !isNaN(parseFloat(value))
}

/**
 * Convert numeric fields to proper number type or null
 * @param {any} value - The value to process
 * @returns {any} - Processed value
 */
function processNumericField(value) {
    if (value === '' || value === null || value === undefined) {
        return null
    }
    if (isNumeric(value)) {
        return parseFloat(value)
    }
    return value
}

/**
 * List of known numeric fields in the application
 */
const numericFields = [
    'birth_weight',
    'birth_height',
    'gestation_weeks',
    'weight',
    'height',
    'apgar_score',
    'head_circumference',
    'chest_circumference',
    'abdominal_circumference',
]

/**
 * List of blood type fields that should preserve + and - symbols
 */
const bloodTypeFields = ['bloodtype', 'mother_blood_type', 'father_blood_type']

/**
 * Sanitize blood type values while preserving + and - symbols
 * Validates against standard blood type patterns: A+, A-, B+, B-, AB+, AB-, O+, O-
 * @param {string} value - The blood type value to sanitize
 * @returns {string} - The sanitized blood type value
 */
function sanitizeBloodType(value) {
    if (typeof value !== 'string' || !value) {
        return value
    }

    // Remove HTML tags and dangerous characters while preserving + and -
    const cleaned = value
        .replace(/<[^>]*>/g, '')
        .replace(/[&<>"'`=\/]/g, '')
        .replace(/(javascript|script|eval|trustedTypes)/gi, '')
        .trim()
        .toUpperCase()

    // Validate against standard blood type patterns
    const validBloodTypes = /^(A|B|AB|O)[+-]?$/
    if (validBloodTypes.test(cleaned)) {
        return cleaned
    }

    // If it doesn't match a valid pattern, return the cleaned value anyway
    // This allows for flexibility while still removing dangerous content
    return cleaned
}

/**
 * Sanitizes an object's string values recursively and handles numeric fields appropriately
 * @param {Object} obj - The object containing values to sanitize
 * @returns {Object} - A new object with sanitized values
 */
export function sanitizeObject(obj) {
    if (typeof obj !== 'object' || obj === null) {
        return sanitizeInput(obj)
    }

    return Object.keys(obj).reduce(
        (acc, key) => {
            if (typeof obj[key] === 'object' && obj[key] !== null) {
                acc[key] = sanitizeObject(obj[key])
            } else {
                // If it's a blood type field, use special sanitization
                if (bloodTypeFields.includes(key)) {
                    acc[key] = sanitizeBloodType(obj[key])
                }
                // If it's a known numeric field, process it accordingly
                else if (numericFields.includes(key)) {
                    acc[key] = processNumericField(obj[key])
                } else {
                    acc[key] = sanitizeInput(obj[key])
                }
            }
            return acc
        },
        Array.isArray(obj) ? [] : {}
    )
}

/**
 * Sanitizes form data from an event
 * @param {Event} event - The form submission event
 * @returns {Object} - An object containing the sanitized form data
 */
export function sanitizeFormData(event) {
    const formData = new FormData(event.target)
    const sanitizedData = {}

    for (let [key, value] of formData.entries()) {
        if (bloodTypeFields.includes(key)) {
            sanitizedData[key] = sanitizeBloodType(value)
        } else if (numericFields.includes(key)) {
            sanitizedData[key] = processNumericField(value)
        } else {
            sanitizedData[key] = sanitizeInput(value)
        }
    }

    return sanitizedData
}
