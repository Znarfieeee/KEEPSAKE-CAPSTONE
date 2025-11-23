/**
 * Vaccine Data Constants
 * Based on Philippine Department of Health (DOH) Expanded Program on Immunization (EPI)
 * and World Health Organization (WHO) recommendations
 *
 * HIPAA/GDPR Compliant - Includes all required documentation fields
 * Last Updated: 2024
 */

/**
 * WHO/DOH Recommended Vaccine Schedule
 * Each vaccine includes:
 * - name: Official vaccine name
 * - category: When typically given (Birth, Routine, etc.)
 * - description: What the vaccine protects against
 * - totalDoses: Total doses required for complete immunization
 * - schedule: Array of age milestones for each dose
 * - route: Default route of administration
 * - defaultSite: Recommended body site
 * - doseIntervalDays: Minimum days between doses (null if single dose)
 */
export const VACCINES = [
    // Birth Vaccines
    {
        name: 'BCG (Bacillus Calmette-Guérin)',
        category: 'Birth',
        description: 'Protection against tuberculosis',
        totalDoses: 1,
        schedule: [{ dose: 1, age: 'At birth', ageInDays: 0 }],
        route: 'Intradermal (ID)',
        defaultSite: 'Left Upper Arm',
        doseIntervalDays: null,
        recommendedAge: 'At birth or as early as possible',
    },
    {
        name: 'Hepatitis B (HepB) Birth Dose',
        category: 'Birth',
        description: 'First dose of hepatitis B vaccine - prevents liver disease',
        totalDoses: 1,
        schedule: [{ dose: 1, age: 'Within 24 hours of birth', ageInDays: 0 }],
        route: 'Intramuscular (IM)',
        defaultSite: 'Right Anterolateral Thigh',
        doseIntervalDays: null,
        recommendedAge: 'Within 24 hours of birth',
    },

    // 6-10-14 Week Vaccines (Routine Series)
    {
        name: 'Pentavalent Vaccine (DPT-HepB-Hib)',
        category: 'Routine',
        description: 'Protection against Diphtheria, Pertussis, Tetanus, Hepatitis B, and Haemophilus influenzae type B',
        totalDoses: 3,
        schedule: [
            { dose: 1, age: '6 weeks', ageInDays: 42 },
            { dose: 2, age: '10 weeks', ageInDays: 70 },
            { dose: 3, age: '14 weeks', ageInDays: 98 },
        ],
        route: 'Intramuscular (IM)',
        defaultSite: 'Left Anterolateral Thigh',
        doseIntervalDays: 28,
        recommendedAge: '6 weeks, 10 weeks, 14 weeks',
    },
    {
        name: 'Oral Polio Vaccine (OPV)',
        category: 'Routine',
        description: 'Protection against poliomyelitis (oral drops)',
        totalDoses: 3,
        schedule: [
            { dose: 1, age: '6 weeks', ageInDays: 42 },
            { dose: 2, age: '10 weeks', ageInDays: 70 },
            { dose: 3, age: '14 weeks', ageInDays: 98 },
        ],
        route: 'Oral',
        defaultSite: 'Oral',
        doseIntervalDays: 28,
        recommendedAge: '6 weeks, 10 weeks, 14 weeks',
    },
    {
        name: 'Inactivated Polio Vaccine (IPV)',
        category: 'Routine',
        description: 'Injectable polio vaccine for enhanced protection',
        totalDoses: 3,
        schedule: [
            { dose: 1, age: '6 weeks', ageInDays: 42 },
            { dose: 2, age: '10 weeks', ageInDays: 70 },
            { dose: 3, age: '14 weeks', ageInDays: 98 },
        ],
        route: 'Intramuscular (IM)',
        defaultSite: 'Right Anterolateral Thigh',
        doseIntervalDays: 28,
        recommendedAge: '6 weeks, 10 weeks, 14 weeks',
    },
    {
        name: 'Pneumococcal Conjugate Vaccine (PCV)',
        category: 'Routine',
        description: 'Protection against pneumococcal diseases (pneumonia, meningitis)',
        totalDoses: 3,
        schedule: [
            { dose: 1, age: '6 weeks', ageInDays: 42 },
            { dose: 2, age: '10 weeks', ageInDays: 70 },
            { dose: 3, age: '14 weeks', ageInDays: 98 },
        ],
        route: 'Intramuscular (IM)',
        defaultSite: 'Left Anterolateral Thigh',
        doseIntervalDays: 28,
        recommendedAge: '6 weeks, 10 weeks, 14 weeks',
    },
    {
        name: 'Rotavirus Vaccine',
        category: 'Routine',
        description: 'Protection against rotavirus gastroenteritis (severe diarrhea)',
        totalDoses: 2,
        schedule: [
            { dose: 1, age: '6 weeks', ageInDays: 42 },
            { dose: 2, age: '10 weeks', ageInDays: 70 },
        ],
        route: 'Oral',
        defaultSite: 'Oral',
        doseIntervalDays: 28,
        recommendedAge: '6 weeks and 10 weeks',
    },

    // 9-12 Month Vaccines
    {
        name: 'Measles-Mumps-Rubella (MMR)',
        category: 'Routine',
        description: 'Protection against measles, mumps, and rubella',
        totalDoses: 2,
        schedule: [
            { dose: 1, age: '9 months', ageInDays: 270 },
            { dose: 2, age: '12-15 months', ageInDays: 365 },
        ],
        route: 'Subcutaneous (SC)',
        defaultSite: 'Left Upper Arm',
        doseIntervalDays: 28,
        recommendedAge: '9 months and 12-15 months',
    },

    // 12 Month+ Vaccines
    {
        name: 'Japanese Encephalitis (JE)',
        category: 'Endemic Areas',
        description: 'Protection against Japanese encephalitis virus',
        totalDoses: 2,
        schedule: [
            { dose: 1, age: '9 months', ageInDays: 270 },
            { dose: 2, age: '12-24 months', ageInDays: 365 },
        ],
        route: 'Subcutaneous (SC)',
        defaultSite: 'Left Upper Arm',
        doseIntervalDays: 28,
        recommendedAge: '9 months and 12-24 months',
    },
    {
        name: 'Varicella (Chickenpox)',
        category: 'Optional',
        description: 'Protection against chickenpox',
        totalDoses: 2,
        schedule: [
            { dose: 1, age: '12-15 months', ageInDays: 365 },
            { dose: 2, age: '4-6 years', ageInDays: 1460 },
        ],
        route: 'Subcutaneous (SC)',
        defaultSite: 'Left Upper Arm',
        doseIntervalDays: 84,
        recommendedAge: '12-15 months and 4-6 years',
    },
    {
        name: 'Hepatitis A',
        category: 'Optional',
        description: 'Protection against hepatitis A virus',
        totalDoses: 2,
        schedule: [
            { dose: 1, age: '12-23 months', ageInDays: 365 },
            { dose: 2, age: '18-29 months', ageInDays: 545 },
        ],
        route: 'Intramuscular (IM)',
        defaultSite: 'Right Deltoid',
        doseIntervalDays: 180,
        recommendedAge: '12-23 months, 6 months apart',
    },
    {
        name: 'Influenza',
        category: 'Annual',
        description: 'Protection against seasonal flu',
        totalDoses: null, // Annual vaccination
        schedule: [{ dose: 1, age: '6 months onwards', ageInDays: 180 }],
        route: 'Intramuscular (IM)',
        defaultSite: 'Left Deltoid',
        doseIntervalDays: 365,
        recommendedAge: '6 months onwards, annually',
    },
    {
        name: 'Typhoid',
        category: 'Optional',
        description: 'Protection against typhoid fever',
        totalDoses: 1,
        schedule: [{ dose: 1, age: '2 years onwards', ageInDays: 730 }],
        route: 'Intramuscular (IM)',
        defaultSite: 'Left Deltoid',
        doseIntervalDays: null,
        recommendedAge: '2 years onwards',
    },
    {
        name: 'Meningococcal',
        category: 'Optional',
        description: 'Protection against meningococcal disease',
        totalDoses: 1,
        schedule: [{ dose: 1, age: '9 months - 2 years', ageInDays: 270 }],
        route: 'Intramuscular (IM)',
        defaultSite: 'Right Deltoid',
        doseIntervalDays: null,
        recommendedAge: '9 months - 2 years (endemic areas)',
    },
    {
        name: 'Human Papillomavirus (HPV)',
        category: 'Adolescent',
        description: 'Protection against HPV-related cancers',
        totalDoses: 2,
        schedule: [
            { dose: 1, age: '9-14 years', ageInDays: 3285 },
            { dose: 2, age: '6 months after first', ageInDays: 3465 },
        ],
        route: 'Intramuscular (IM)',
        defaultSite: 'Left Deltoid',
        doseIntervalDays: 180,
        recommendedAge: '9-14 years',
    },
    {
        name: 'Tetanus-Diphtheria (Td) Booster',
        category: 'Booster',
        description: 'Booster for tetanus and diphtheria protection',
        totalDoses: null, // Every 10 years
        schedule: [{ dose: 1, age: '7 years onwards', ageInDays: 2555 }],
        route: 'Intramuscular (IM)',
        defaultSite: 'Right Deltoid',
        doseIntervalDays: 3650,
        recommendedAge: 'Every 10 years after initial series',
    },
]

/**
 * Routes of Administration (HIPAA Required)
 * Per WHO and CDC guidelines
 */
export const ADMINISTRATION_ROUTES = [
    { value: 'Intramuscular (IM)', label: 'Intramuscular (IM)', description: 'Injection into muscle tissue' },
    { value: 'Subcutaneous (SC)', label: 'Subcutaneous (SC)', description: 'Injection under the skin' },
    { value: 'Intradermal (ID)', label: 'Intradermal (ID)', description: 'Injection into skin layer' },
    { value: 'Oral', label: 'Oral', description: 'Given by mouth' },
    { value: 'Intranasal', label: 'Intranasal', description: 'Sprayed into the nose' },
    { value: 'Intravenous (IV)', label: 'Intravenous (IV)', description: 'Injection into vein' },
]

/**
 * Body Sites for Injection (HIPAA Required - Specific anatomical locations)
 */
export const BODY_SITES = [
    { value: 'Left Deltoid', label: 'Left Deltoid (Upper Arm)', ageGroup: 'older children/adults' },
    { value: 'Right Deltoid', label: 'Right Deltoid (Upper Arm)', ageGroup: 'older children/adults' },
    { value: 'Left Anterolateral Thigh', label: 'Left Anterolateral Thigh', ageGroup: 'infants/toddlers' },
    { value: 'Right Anterolateral Thigh', label: 'Right Anterolateral Thigh', ageGroup: 'infants/toddlers' },
    { value: 'Left Upper Arm', label: 'Left Upper Arm', ageGroup: 'all ages' },
    { value: 'Right Upper Arm', label: 'Right Upper Arm', ageGroup: 'all ages' },
    { value: 'Left Gluteal', label: 'Left Gluteal (Buttock)', ageGroup: 'older children/adults' },
    { value: 'Right Gluteal', label: 'Right Gluteal (Buttock)', ageGroup: 'older children/adults' },
    { value: 'Oral', label: 'Oral (By Mouth)', ageGroup: 'all ages' },
    { value: 'Intranasal', label: 'Intranasal (Nose)', ageGroup: 'all ages' },
]

/**
 * Legacy administration sites for backward compatibility
 * Maps to body_site field in new schema
 */
export const ADMINISTRATION_SITES = [
    { value: 'Left Deltoid', label: 'Left Deltoid (Upper arm)' },
    { value: 'Right Deltoid', label: 'Right Deltoid (Upper arm)' },
    { value: 'Left Anterolateral Thigh', label: 'Left Thigh (Anterolateral)' },
    { value: 'Right Anterolateral Thigh', label: 'Right Thigh (Anterolateral)' },
    { value: 'Left Upper Arm', label: 'Left Upper Arm' },
    { value: 'Right Upper Arm', label: 'Right Upper Arm' },
    { value: 'Oral', label: 'Oral (OPV)' },
    { value: 'Intradermal', label: 'Intradermal (BCG)' },
    { value: 'Subcutaneous', label: 'Subcutaneous' },
]

/**
 * Vaccine Manufacturers by vaccine type
 */
export const VACCINE_MANUFACTURERS = [
    // BCG
    { vaccine: 'BCG', name: 'Japan BCG Laboratory' },
    { vaccine: 'BCG', name: 'Serum Institute of India' },
    { vaccine: 'BCG', name: 'BB-NCIPD (Bulgaria)' },

    // Hepatitis B
    { vaccine: 'Hepatitis B', name: 'GSK (Engerix-B)' },
    { vaccine: 'Hepatitis B', name: 'MSD (Recombivax HB)' },
    { vaccine: 'Hepatitis B', name: 'Serum Institute of India' },
    { vaccine: 'Hepatitis B', name: 'Sanofi Pasteur' },

    // Pentavalent
    { vaccine: 'Pentavalent', name: 'Serum Institute of India (Pentavac)' },
    { vaccine: 'Pentavalent', name: 'Panacea Biotec' },
    { vaccine: 'Pentavalent', name: 'Sanofi Pasteur (Pentaxim)' },
    { vaccine: 'Pentavalent', name: 'GSK (Infanrix-IPV+Hib)' },

    // Polio
    { vaccine: 'Polio', name: 'Sanofi Pasteur' },
    { vaccine: 'Polio', name: 'Bio Farma' },
    { vaccine: 'Polio', name: 'Serum Institute of India' },

    // PCV
    { vaccine: 'PCV', name: 'Pfizer (Prevenar 13)' },
    { vaccine: 'PCV', name: 'GSK (Synflorix)' },
    { vaccine: 'PCV', name: 'MSD (Vaxneuvance)' },

    // Rotavirus
    { vaccine: 'Rotavirus', name: 'GSK (Rotarix)' },
    { vaccine: 'Rotavirus', name: 'MSD (RotaTeq)' },
    { vaccine: 'Rotavirus', name: 'Serum Institute of India (Rotavac)' },

    // MMR
    { vaccine: 'MMR', name: 'Serum Institute of India (Tresivac)' },
    { vaccine: 'MMR', name: 'MSD (M-M-R II)' },
    { vaccine: 'MMR', name: 'GSK (Priorix)' },

    // Others
    { vaccine: 'Varicella', name: 'MSD (Varivax)' },
    { vaccine: 'Varicella', name: 'GSK (Varilrix)' },
    { vaccine: 'Hepatitis A', name: 'GSK (Havrix)' },
    { vaccine: 'Hepatitis A', name: 'MSD (Vaqta)' },
    { vaccine: 'Hepatitis A', name: 'Sanofi Pasteur (Avaxim)' },
    { vaccine: 'Influenza', name: 'Sanofi Pasteur (Vaxigrip)' },
    { vaccine: 'Influenza', name: 'GSK (Fluarix)' },
    { vaccine: 'Influenza', name: 'Seqirus (Afluria)' },
    { vaccine: 'HPV', name: 'MSD (Gardasil 9)' },
    { vaccine: 'HPV', name: 'GSK (Cervarix)' },
    { vaccine: 'Japanese Encephalitis', name: 'Valneva (Ixiaro)' },
    { vaccine: 'Japanese Encephalitis', name: 'Chengdu Institute' },
    { vaccine: 'Meningococcal', name: 'Sanofi Pasteur (Menactra)' },
    { vaccine: 'Meningococcal', name: 'GSK (Menveo)' },
    { vaccine: 'Meningococcal', name: 'Pfizer (Nimenrix)' },
    { vaccine: 'Typhoid', name: 'Sanofi Pasteur (Typhim Vi)' },
    { vaccine: 'Typhoid', name: 'Bharat Biotech (Typbar-TCV)' },
]

/**
 * Vaccine categories for grouping in UI
 */
export const VACCINE_CATEGORIES = [
    { value: 'Birth', label: 'Birth Vaccines', color: 'bg-pink-100 text-pink-800' },
    { value: 'Routine', label: 'Routine Immunization (6-14 weeks)', color: 'bg-blue-100 text-blue-800' },
    { value: 'Endemic Areas', label: 'Endemic Area Vaccines', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'Optional', label: 'Optional/Recommended', color: 'bg-green-100 text-green-800' },
    { value: 'Annual', label: 'Annual Vaccines', color: 'bg-purple-100 text-purple-800' },
    { value: 'Adolescent', label: 'Adolescent Vaccines', color: 'bg-orange-100 text-orange-800' },
    { value: 'Booster', label: 'Booster Doses', color: 'bg-gray-100 text-gray-800' },
]

/**
 * Get vaccine options for dropdown
 * @returns {Array} Formatted vaccine options
 */
export const getVaccineOptions = () => {
    return VACCINES.map((vaccine) => ({
        value: vaccine.name,
        label: vaccine.name,
        category: vaccine.category,
        totalDoses: vaccine.totalDoses,
        maxDoses: vaccine.totalDoses, // Backward compatibility
        route: vaccine.route,
        defaultSite: vaccine.defaultSite,
    }))
}

/**
 * Get manufacturers for a specific vaccine
 * @param {string} vaccineName - Name of the vaccine
 * @returns {Array} List of manufacturers
 */
export const getManufacturers = (vaccineName) => {
    if (!vaccineName) return []

    const vaccineKey = vaccineName.split('(')[0].trim()

    const manufacturers = VACCINE_MANUFACTURERS.filter((m) =>
        vaccineName.toLowerCase().includes(m.vaccine.toLowerCase())
    )

    if (manufacturers.length > 0) {
        return manufacturers.map((m) => ({ value: m.name, label: m.name }))
    }

    // Return generic manufacturers if no specific ones found
    return [
        { value: 'Serum Institute of India', label: 'Serum Institute of India' },
        { value: 'GSK', label: 'GSK (GlaxoSmithKline)' },
        { value: 'Sanofi Pasteur', label: 'Sanofi Pasteur' },
        { value: 'MSD', label: 'MSD (Merck Sharp & Dohme)' },
        { value: 'Pfizer', label: 'Pfizer' },
        { value: 'Other', label: 'Other' },
    ]
}

/**
 * Get vaccine info by name
 * @param {string} vaccineName - Name of the vaccine
 * @returns {Object|undefined} Vaccine information object
 */
export const getVaccineInfo = (vaccineName) => {
    const vaccine = VACCINES.find((v) => v.name === vaccineName)
    if (vaccine) {
        return {
            ...vaccine,
            maxDoses: vaccine.totalDoses, // Backward compatibility
        }
    }
    return undefined
}

/**
 * Get recommended route for a vaccine
 * @param {string} vaccineName - Name of the vaccine
 * @returns {string|null} Recommended route of administration
 */
export const getRecommendedRoute = (vaccineName) => {
    const vaccine = VACCINES.find((v) => v.name === vaccineName)
    return vaccine?.route || null
}

/**
 * Get recommended body site for a vaccine
 * @param {string} vaccineName - Name of the vaccine
 * @returns {string|null} Recommended body site
 */
export const getRecommendedSite = (vaccineName) => {
    const vaccine = VACCINES.find((v) => v.name === vaccineName)
    return vaccine?.defaultSite || null
}

/**
 * Calculate next dose number based on existing vaccinations
 * @param {string} vaccineName - Name of the vaccine
 * @param {Array} existingVaccinations - Array of existing vaccination records
 * @returns {number} Next dose number (1 if none exist)
 */
export const getNextDoseNumber = (vaccineName, existingVaccinations = []) => {
    const vaccinesOfType = existingVaccinations.filter(
        (v) => v.vaccine_name === vaccineName && !v.is_deleted
    )
    const maxDose = Math.max(0, ...vaccinesOfType.map((v) => v.dose_number || 0))
    return maxDose + 1
}

/**
 * Calculate suggested next dose due date
 * @param {string} vaccineName - Name of the vaccine
 * @param {Date|string} administeredDate - Date of current dose administration
 * @returns {string|null} Suggested next dose date (YYYY-MM-DD) or null
 */
export const getSuggestedNextDoseDate = (vaccineName, administeredDate) => {
    const vaccine = VACCINES.find((v) => v.name === vaccineName)
    if (!vaccine || !vaccine.doseIntervalDays || vaccine.totalDoses === 1) {
        return null
    }

    const adminDate = new Date(administeredDate)
    adminDate.setDate(adminDate.getDate() + vaccine.doseIntervalDays)
    return adminDate.toISOString().split('T')[0]
}

/**
 * Get vaccination summary for a patient
 * @param {Array} vaccinations - Array of vaccination records
 * @returns {Array} Summary of each vaccine with completion status
 */
export const getVaccinationSummary = (vaccinations = []) => {
    const summary = VACCINES.map((vaccine) => {
        const patientVaccines = vaccinations.filter(
            (v) => v.vaccine_name === vaccine.name && !v.is_deleted
        )
        const completedDoses = patientVaccines.length
        const latestVaccine = patientVaccines.sort(
            (a, b) => new Date(b.administered_date) - new Date(a.administered_date)
        )[0]

        let status = 'not_started'
        if (completedDoses > 0) {
            if (vaccine.totalDoses === null || completedDoses >= vaccine.totalDoses) {
                status = 'complete'
            } else {
                status = 'in_progress'
            }
        }

        // Check if overdue
        if (latestVaccine?.next_dose_due) {
            const dueDate = new Date(latestVaccine.next_dose_due)
            if (dueDate < new Date() && status === 'in_progress') {
                status = 'overdue'
            }
        }

        return {
            vaccineName: vaccine.name,
            category: vaccine.category,
            totalDoses: vaccine.totalDoses,
            completedDoses,
            remainingDoses: vaccine.totalDoses ? Math.max(0, vaccine.totalDoses - completedDoses) : null,
            status,
            nextDoseNumber: vaccine.totalDoses ? Math.min(completedDoses + 1, vaccine.totalDoses) : completedDoses + 1,
            nextDoseDue: latestVaccine?.next_dose_due || null,
            lastAdministered: latestVaccine?.administered_date || null,
            schedule: vaccine.schedule,
            description: vaccine.description,
        }
    })

    return summary
}

/**
 * Group vaccines by category
 * @returns {Object} Vaccines grouped by category
 */
export const getVaccinesByCategory = () => {
    const grouped = {}
    VACCINES.forEach((vaccine) => {
        if (!grouped[vaccine.category]) {
            grouped[vaccine.category] = []
        }
        grouped[vaccine.category].push(vaccine)
    })
    return grouped
}

/**
 * Get vaccines due for a patient based on age
 * @param {Date|string} dateOfBirth - Patient's date of birth
 * @param {Array} existingVaccinations - Array of existing vaccination records
 * @returns {Array} List of vaccines that are due
 */
export const getVaccinesDue = (dateOfBirth, existingVaccinations = []) => {
    const birthDate = new Date(dateOfBirth)
    const today = new Date()
    const ageInDays = Math.floor((today - birthDate) / (1000 * 60 * 60 * 24))

    const dueVaccines = []

    VACCINES.forEach((vaccine) => {
        const patientVaccines = existingVaccinations.filter(
            (v) => v.vaccine_name === vaccine.name && !v.is_deleted
        )
        const completedDoses = patientVaccines.length

        // Skip if vaccine series is complete
        if (vaccine.totalDoses && completedDoses >= vaccine.totalDoses) {
            return
        }

        // Find the next dose in schedule
        const nextDose = vaccine.schedule.find((s) => s.dose === completedDoses + 1)
        if (nextDose && ageInDays >= nextDose.ageInDays) {
            dueVaccines.push({
                ...vaccine,
                nextDoseNumber: completedDoses + 1,
                ageWhenDue: nextDose.age,
                isOverdue: true,
            })
        }
    })

    return dueVaccines
}
