import React, { useState, useEffect } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
    CalendarIcon,
    Save,
    X,
    User,
    Stethoscope,
    Activity,
    AlertCircle,
    Ruler,
    Pill,
} from 'lucide-react'
import { showToast } from '@/util/alertHelper'
import {
    updateDeliveryRecord,
    updateAnthropometricRecord,
    updateScreeningRecord,
    updateAllergyRecord,
} from '@/api/doctors/patient'

const EditPatientModal = ({ onClose, patient, onSuccess, isLoading = false }) => {
    // Basic patient information
    const [formData, setFormData] = useState({
        firstname: '',
        middlename: '',
        lastname: '',
        date_of_birth: '',
        sex: '',
        birth_weight: '',
        birth_height: '',
        bloodtype: '',
        gestation_weeks: '',
    })

    // Related records data
    const [deliveryData, setDeliveryData] = useState({
        type_of_delivery: '',
        apgar_score: '',
        mother_blood_type: '',
        father_blood_type: '',
        patient_blood_type: '',
        distinguishable_marks: '',
        vitamin_k_date: '',
        vitamin_k_location: '',
        hepatitis_b_date: '',
        hepatitis_b_location: '',
        bcg_vaccination_date: '',
        bcg_vaccination_location: '',
        other_medications: '',
        discharge_diagnosis: '',
        follow_up_visit_date: '',
        follow_up_visit_site: '',
        obstetrician: '',
        pediatrician: '',
    })

    const [anthropometricData, setAnthropometricData] = useState({
        weight: '',
        height: '',
        head_circumference: '',
        chest_circumference: '',
        abdominal_circumference: '',
        measurement_date: '',
    })

    const [screeningData, setScreeningData] = useState({
        ens_date: '',
        ens_remarks: false,
        nhs_date: '',
        nhs_right_ear: false,
        nhs_left_ear: false,
        pos_date: '',
        pos_for_cchd_right: false,
        pos_for_cchd_left: false,
        ror_date: '',
        ror_remarks: '',
    })

    const [allergyData, setAllergyData] = useState({
        allergen: '',
        reaction_type: '',
        severity: '',
        date_identified: '',
        notes: '',
    })

    const [loading, setLoading] = useState(false)
    const [activeTab, setActiveTab] = useState('basic')

    // Populate form when patient data changes
    useEffect(() => {
        if (patient) {
            // Basic patient information
            setFormData({
                firstname: patient.firstname || '',
                middlename: patient.middlename || '',
                lastname: patient.lastname || '',
                date_of_birth: patient.date_of_birth ? patient.date_of_birth.split('T')[0] : '',
                sex: patient.sex || '',
                birth_weight: patient.birth_weight || '',
                birth_height: patient.birth_height || '',
                bloodtype: patient.bloodtype || '',
                gestation_weeks: patient.gestation_weeks || '',
            })

            // Related records from patient.related_records
            const related = patient.related_records || {}

            // Delivery information
            if (related.delivery) {
                setDeliveryData({
                    type_of_delivery: related.delivery.type_of_delivery || '',
                    apgar_score: related.delivery.apgar_score || '',
                    mother_blood_type: related.delivery.mother_blood_type || '',
                    father_blood_type: related.delivery.father_blood_type || '',
                    patient_blood_type: related.delivery.patient_blood_type || '',
                    distinguishable_marks: related.delivery.distinguishable_marks || '',
                    vitamin_k_date: related.delivery.vitamin_k_date || '',
                    vitamin_k_location: related.delivery.vitamin_k_location || '',
                    hepatitis_b_date: related.delivery.hepatitis_b_date || '',
                    hepatitis_b_location: related.delivery.hepatitis_b_location || '',
                    bcg_vaccination_date: related.delivery.bcg_vaccination_date || '',
                    bcg_vaccination_location: related.delivery.bcg_vaccination_location || '',
                    other_medications: related.delivery.other_medications || '',
                    discharge_diagnosis: related.delivery.discharge_diagnosis || '',
                    follow_up_visit_date: related.delivery.follow_up_visit_date || '',
                    follow_up_visit_site: related.delivery.follow_up_visit_site || '',
                    obstetrician: related.delivery.obstetrician || '',
                    pediatrician: related.delivery.pediatrician || '',
                })
            }

            // Anthropometric data (use latest measurement)
            if (related.anthropometric && related.anthropometric.length > 0) {
                const latest = related.anthropometric[related.anthropometric.length - 1]
                setAnthropometricData({
                    weight: latest.weight || '',
                    height: latest.height || '',
                    head_circumference: latest.head_circumference || '',
                    chest_circumference: latest.chest_circumference || '',
                    abdominal_circumference: latest.abdominal_circumference || '',
                    measurement_date: latest.measurement_date
                        ? latest.measurement_date.split('T')[0]
                        : '',
                })
            }

            // Screening data
            if (related.screening) {
                setScreeningData({
                    ens_date: related.screening.ens_date || '',
                    ens_remarks: related.screening.ens_remarks || false,
                    nhs_date: related.screening.nhs_date || '',
                    nhs_right_ear: related.screening.nhs_right_ear || false,
                    nhs_left_ear: related.screening.nhs_left_ear || false,
                    pos_date: related.screening.pos_date || '',
                    pos_for_cchd_right: related.screening.pos_for_cchd_right || false,
                    pos_for_cchd_left: related.screening.pos_for_cchd_left || false,
                    ror_date: related.screening.ror_date || '',
                    ror_remarks: related.screening.ror_remarks || '',
                })
            }

            // Allergy data
            if (related.allergies) {
                setAllergyData({
                    allergen: related.allergies.allergen || '',
                    reaction_type: related.allergies.reaction_type || '',
                    severity: related.allergies.severity || '',
                    date_identified: related.allergies.date_identified || '',
                    notes: related.allergies.notes || '',
                })
            }
        }
    }, [patient])

    // Helper functions to update different form sections
    const handleInputChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }))
    }

    const handleDeliveryChange = (field, value) => {
        setDeliveryData((prev) => ({ ...prev, [field]: value }))
    }

    const handleAnthropometricChange = (field, value) => {
        setAnthropometricData((prev) => ({ ...prev, [field]: value }))
    }

    const handleScreeningChange = (field, value) => {
        setScreeningData((prev) => ({ ...prev, [field]: value }))
    }

    const handleAllergyChange = (field, value) => {
        setAllergyData((prev) => ({ ...prev, [field]: value }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!formData.firstname || !formData.lastname || !formData.date_of_birth || !formData.sex) {
            showToast('error', 'Please fill in all required fields')
            return
        }

        setLoading(true)

        try {
            const patientId = patient.patient_id || patient.id

            // Update basic patient information
            const updatedPatient = {
                ...patient,
                ...formData,
                patient_id: patientId,
            }

            await onSuccess(updatedPatient)

            // Update related records if they have data
            const promises = []

            // Update delivery record if has data
            if (Object.values(deliveryData).some((val) => val)) {
                promises.push(updateDeliveryRecord(patientId, deliveryData))
            }

            // Update anthropometric record if has data
            if (Object.values(anthropometricData).some((val) => val)) {
                promises.push(updateAnthropometricRecord(patientId, anthropometricData))
            }

            // Update screening record if has data
            if (Object.values(screeningData).some((val) => val)) {
                promises.push(updateScreeningRecord(patientId, screeningData))
            }

            // Update allergy record if has data
            if (Object.values(allergyData).some((val) => val)) {
                promises.push(updateAllergyRecord(patientId, allergyData))
            }

            // Execute all updates
            if (promises.length > 0) {
                const results = await Promise.allSettled(promises)
                const failedResults = results.filter((result) => result.status === 'rejected')

                if (failedResults.length > 0) {
                    console.warn('Some related records failed to update:', failedResults)
                    showToast('warning', 'Patient updated but some related data failed to save')
                } else {
                    showToast('success', 'Patient and all related data updated successfully')
                }
            } else {
                showToast('success', 'Patient updated successfully')
            }
        } catch (error) {
            showToast('error', 'Failed to update patient')
            console.error('Update patient error:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleClose = () => {
        if (!loading) {
            onClose()
        }
    }

    return (
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5" />
                    Edit Patient Information
                    {isLoading && (
                        <div className="ml-2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                    )}
                </DialogTitle>
                <DialogDescription>
                    Update patient details below. Fields marked with * are required.
                    {isLoading && (
                        <span className="block text-blue-600 text-sm mt-1">
                            Loading complete patient data...
                        </span>
                    )}
                </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Basic Information</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="firstname">First Name *</Label>
                            <Input
                                id="firstname"
                                value={formData.firstname}
                                onChange={(e) => handleInputChange('firstname', e.target.value)}
                                placeholder="Enter first name"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="lastname">Last Name *</Label>
                            <Input
                                id="lastname"
                                value={formData.lastname}
                                onChange={(e) => handleInputChange('lastname', e.target.value)}
                                placeholder="Enter last name"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="middlename">Middle Name</Label>
                            <Input
                                id="middlename"
                                value={formData.middlename}
                                onChange={(e) => handleInputChange('middlename', e.target.value)}
                                placeholder="Enter middle name"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="date_of_birth">Date of Birth *</Label>
                            <Input
                                id="date_of_birth"
                                type="date"
                                value={formData.date_of_birth}
                                onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="sex">Sex *</Label>
                            <Select
                                value={formData.sex}
                                onValueChange={(value) => handleInputChange('sex', value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select sex" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="male">Male</SelectItem>
                                    <SelectItem value="female">Female</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="bloodtype">Blood Type</Label>
                            <Select
                                value={formData.bloodtype}
                                onValueChange={(value) => handleInputChange('bloodtype', value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select blood type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="A+">A+</SelectItem>
                                    <SelectItem value="A-">A-</SelectItem>
                                    <SelectItem value="B+">B+</SelectItem>
                                    <SelectItem value="B-">B-</SelectItem>
                                    <SelectItem value="AB+">AB+</SelectItem>
                                    <SelectItem value="AB-">AB-</SelectItem>
                                    <SelectItem value="O+">O+</SelectItem>
                                    <SelectItem value="O-">O-</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                {/* Birth Information */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Birth Information</h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="birth_weight">Birth Weight (kg)</Label>
                            <Input
                                id="birth_weight"
                                type="number"
                                step="0.01"
                                value={formData.birth_weight}
                                onChange={(e) => handleInputChange('birth_weight', e.target.value)}
                                placeholder="0.00"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="birth_height">Birth Height (cm)</Label>
                            <Input
                                id="birth_height"
                                type="number"
                                step="0.1"
                                value={formData.birth_height}
                                onChange={(e) => handleInputChange('birth_height', e.target.value)}
                                placeholder="0.0"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="gestation_weeks">Gestation Weeks</Label>
                            <Input
                                id="gestation_weeks"
                                type="number"
                                value={formData.gestation_weeks}
                                onChange={(e) =>
                                    handleInputChange('gestation_weeks', e.target.value)
                                }
                                placeholder="40"
                                min="20"
                                max="45"
                            />
                        </div>
                    </div>
                </div>

                <DialogFooter className="flex gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleClose}
                        disabled={loading}
                    >
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                    </Button>
                    <Button type="submit" disabled={loading}>
                        <Save className="h-4 w-4 mr-2" />
                        {loading ? 'Updating...' : 'Update Patient'}
                    </Button>
                </DialogFooter>
            </form>
        </DialogContent>
    )
}

export default EditPatientModal
