/**
 * Vaccine Data Constants
 * Based on Philippine Department of Health (DOH) Expanded Program on Immunization (EPI)
 * and World Health Organization (WHO) recommendations
 */

export const VACCINES = [
    // Birth
    {
        name: 'BCG (Bacillus Calmette-Guérin)',
        category: 'Birth',
        description: 'Protection against tuberculosis',
        maxDoses: 1,
        recommendedAge: 'At birth or as early as possible',
    },
    {
        name: 'Hepatitis B (HepB) Birth Dose',
        category: 'Birth',
        description: 'First dose of hepatitis B vaccine',
        maxDoses: 3,
        recommendedAge: 'Within 24 hours of birth',
    },

    // 6 Weeks
    {
        name: 'Pentavalent Vaccine (DPT-HepB-Hib)',
        category: 'Routine',
        description: 'Protection against Diphtheria, Pertussis, Tetanus, Hepatitis B, and Haemophilus influenzae type B',
        maxDoses: 3,
        recommendedAge: '6 weeks, 10 weeks, 14 weeks',
    },
    {
        name: 'Oral Polio Vaccine (OPV)',
        category: 'Routine',
        description: 'Protection against poliomyelitis',
        maxDoses: 3,
        recommendedAge: '6 weeks, 10 weeks, 14 weeks',
    },
    {
        name: 'Inactivated Polio Vaccine (IPV)',
        category: 'Routine',
        description: 'Injectable polio vaccine',
        maxDoses: 3,
        recommendedAge: '6 weeks, 10 weeks, 14 weeks',
    },
    {
        name: 'Pneumococcal Conjugate Vaccine (PCV)',
        category: 'Routine',
        description: 'Protection against pneumococcal diseases',
        maxDoses: 3,
        recommendedAge: '6 weeks, 10 weeks, 14 weeks',
    },
    {
        name: 'Rotavirus Vaccine',
        category: 'Routine',
        description: 'Protection against rotavirus gastroenteritis',
        maxDoses: 2,
        recommendedAge: '6 weeks and 10 weeks',
    },

    // 9 Months
    {
        name: 'Measles-Mumps-Rubella (MMR)',
        category: 'Routine',
        description: 'Protection against measles, mumps, and rubella',
        maxDoses: 2,
        recommendedAge: '9 months and 12-15 months',
    },

    // 12 Months
    {
        name: 'Japanese Encephalitis (JE)',
        category: 'Endemic Areas',
        description: 'Protection against Japanese encephalitis',
        maxDoses: 2,
        recommendedAge: '12 months and booster at 24 months',
    },

    // Additional vaccines
    {
        name: 'Varicella (Chickenpox)',
        category: 'Optional',
        description: 'Protection against chickenpox',
        maxDoses: 2,
        recommendedAge: '12-15 months and 4-6 years',
    },
    {
        name: 'Hepatitis A',
        category: 'Optional',
        description: 'Protection against hepatitis A',
        maxDoses: 2,
        recommendedAge: '12-23 months, 6 months apart',
    },
    {
        name: 'Influenza',
        category: 'Annual',
        description: 'Protection against seasonal flu',
        maxDoses: null, // Annual
        recommendedAge: '6 months onwards, annually',
    },
    {
        name: 'Typhoid',
        category: 'Optional',
        description: 'Protection against typhoid fever',
        maxDoses: 1,
        recommendedAge: '2 years onwards',
    },
    {
        name: 'Meningococcal',
        category: 'Optional',
        description: 'Protection against meningococcal disease',
        maxDoses: 1,
        recommendedAge: '11-12 years',
    },
    {
        name: 'Human Papillomavirus (HPV)',
        category: 'Adolescent',
        description: 'Protection against HPV-related cancers',
        maxDoses: 2,
        recommendedAge: '9-14 years',
    },
    {
        name: 'Tetanus-Diphtheria (Td) Booster',
        category: 'Booster',
        description: 'Booster for tetanus and diphtheria',
        maxDoses: null, // Every 10 years
        recommendedAge: 'Every 10 years after initial series',
    },
]

export const ADMINISTRATION_SITES = [
    { value: 'Left Deltoid', label: 'Left Deltoid (Upper arm)' },
    { value: 'Right Deltoid', label: 'Right Deltoid (Upper arm)' },
    { value: 'Left Thigh', label: 'Left Thigh (Anterolateral)' },
    { value: 'Right Thigh', label: 'Right Thigh (Anterolateral)' },
    { value: 'Left Upper Arm', label: 'Left Upper Arm' },
    { value: 'Right Upper Arm', label: 'Right Upper Arm' },
    { value: 'Oral', label: 'Oral (OPV)' },
    { value: 'Intradermal', label: 'Intradermal (BCG)' },
    { value: 'Subcutaneous', label: 'Subcutaneous' },
]

export const VACCINE_MANUFACTURERS = [
    // BCG
    { vaccine: 'BCG', name: 'Japan BCG Laboratory' },
    { vaccine: 'BCG', name: 'Serum Institute of India' },

    // Hepatitis B
    { vaccine: 'Hepatitis B', name: 'GSK (Engerix-B)' },
    { vaccine: 'Hepatitis B', name: 'MSD (Recombivax HB)' },
    { vaccine: 'Hepatitis B', name: 'Serum Institute of India' },

    // Pentavalent
    { vaccine: 'Pentavalent', name: 'Serum Institute of India (Pentavac)' },
    { vaccine: 'Pentavalent', name: 'Panacea Biotec' },

    // Polio
    { vaccine: 'Polio', name: 'Sanofi Pasteur' },
    { vaccine: 'Polio', name: 'Bio Farma' },

    // PCV
    { vaccine: 'PCV', name: 'Pfizer (Prevenar 13)' },
    { vaccine: 'PCV', name: 'GSK (Synflorix)' },

    // Rotavirus
    { vaccine: 'Rotavirus', name: 'GSK (Rotarix)' },
    { vaccine: 'Rotavirus', name: 'MSD (RotaTeq)' },

    // MMR
    { vaccine: 'MMR', name: 'Serum Institute of India (Tresivac)' },
    { vaccine: 'MMR', name: 'MSD (M-M-R II)' },
    { vaccine: 'MMR', name: 'GSK (Priorix)' },

    // Others
    { vaccine: 'Varicella', name: 'MSD (Varivax)' },
    { vaccine: 'Varicella', name: 'GSK (Varilrix)' },
    { vaccine: 'Hepatitis A', name: 'GSK (Havrix)' },
    { vaccine: 'Hepatitis A', name: 'MSD (Vaqta)' },
    { vaccine: 'Influenza', name: 'Sanofi Pasteur (Vaxigrip)' },
    { vaccine: 'Influenza', name: 'GSK (Fluarix)' },
    { vaccine: 'HPV', name: 'MSD (Gardasil 9)' },
    { vaccine: 'HPV', name: 'GSK (Cervarix)' },
]

/**
 * Get vaccine options for dropdown
 */
export const getVaccineOptions = () => {
    return VACCINES.map((vaccine) => ({
        value: vaccine.name,
        label: vaccine.name,
        category: vaccine.category,
        maxDoses: vaccine.maxDoses,
    }))
}

/**
 * Get manufacturers for a specific vaccine
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
 */
export const getVaccineInfo = (vaccineName) => {
    return VACCINES.find((v) => v.name === vaccineName)
}
