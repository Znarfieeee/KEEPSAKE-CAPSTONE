import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getChildDetails } from '@/api/parent/children'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Loader from '@/components/ui/Loader'
import {
    TbHeartbeat,
    TbVaccine,
    TbPill,
    TbCalendar,
    TbAlertTriangle,
    TbRuler,
    TbArrowLeft,
} from 'react-icons/tb'
import { BiMale, BiFemale } from 'react-icons/bi'

function ChildProfile() {
    const { patientId } = useParams()
    const navigate = useNavigate()
    const [childData, setChildData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        fetchChildDetails()
    }, [patientId])

    const fetchChildDetails = async () => {
        try {
            setLoading(true)
            const response = await getChildDetails(patientId)
            if (response.status === 'success') {
                setChildData(response.data)
            }
        } catch (err) {
            console.error('Error fetching child details:', err)
            if (err.status === 403) {
                setError("You do not have access to this child's records.")
            } else {
                setError('Failed to load child details. Please try again later.')
            }
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader />
            </div>
        )
    }

    if (error) {
        return (
            <div className="space-y-4">
                <button
                    onClick={() => navigate('/keepsaker/children')}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
                >
                    <TbArrowLeft className="w-5 h-5" />
                    Back to Children List
                </button>
                <Card className="border-red-200 bg-red-50">
                    <CardContent className="pt-6">
                        <p className="text-red-600">{error}</p>
                    </CardContent>
                </Card>
            </div>
        )
    }

    const related = childData?.related_records || {}
    const delivery = related.delivery
    const allergies = related.allergies || []
    const prescriptions = related.prescriptions || []
    const vaccinations = related.vaccinations || []
    const appointments = related.appointments || []
    const anthropometric = related.anthropometric_measurements || []
    const screening = related.screening

    return (
        <div className="space-y-6">
            {/* Back Button */}
            <button
                onClick={() => navigate('/keepsaker/children')}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
                <TbArrowLeft className="w-5 h-5" />
                Back to Children List
            </button>

            {/* Header Card */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <div className="flex items-start gap-4">
                            <div
                                className={`p-4 rounded-full ${
                                    childData.sex === 'male' ? 'bg-blue-100' : 'bg-pink-100'
                                }`}
                            >
                                {childData.sex === 'male' ? (
                                    <BiMale className="w-8 h-8 text-blue-600" />
                                ) : (
                                    <BiFemale className="w-8 h-8 text-pink-600" />
                                )}
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">
                                    {childData.firstname}{' '}
                                    {childData.middlename ? `${childData.middlename} ` : ''}
                                    {childData.lastname}
                                </h1>
                                <p className="text-gray-600 mt-1">
                                    {childData.age || 'Age not calculated'}
                                </p>
                                <div className="flex flex-wrap gap-2 mt-3">
                                    <Badge variant="outline" className="capitalize">
                                        {childData.relationship}
                                    </Badge>
                                    <Badge
                                        variant={childData.sex === 'male' ? 'default' : 'secondary'}
                                    >
                                        {childData.sex === 'male' ? 'Male' : 'Female'}
                                    </Badge>
                                    {childData.bloodtype && (
                                        <Badge variant="outline">
                                            Blood Type: {childData.bloodtype}
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                            <p>
                                <span className="font-medium">Date of Birth:</span>{' '}
                                {new Date(childData.date_of_birth).toLocaleDateString()}
                            </p>
                            {childData.birth_weight && (
                                <p>
                                    <span className="font-medium">Birth Weight:</span>{' '}
                                    {childData.birth_weight} kg
                                </p>
                            )}
                            {childData.birth_height && (
                                <p>
                                    <span className="font-medium">Birth Height:</span>{' '}
                                    {childData.birth_height} cm
                                </p>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Read-Only Notice */}
            <Card className="border-yellow-200 bg-yellow-50">
                <CardContent className="pt-4">
                    <p className="text-sm text-yellow-800 flex items-center gap-2">
                        <TbAlertTriangle className="w-4 h-4" />
                        <span>
                            This is a read-only view. Contact your healthcare provider for any
                            updates or changes.
                        </span>
                    </p>
                </CardContent>
            </Card>

            {/* Medical Information Tabs */}
            <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="allergies">
                        Allergies {allergies.length > 0 && `(${allergies.length})`}
                    </TabsTrigger>
                    <TabsTrigger value="vaccinations">
                        Vaccinations {vaccinations.length > 0 && `(${vaccinations.length})`}
                    </TabsTrigger>
                    <TabsTrigger value="prescriptions">
                        Prescriptions {prescriptions.length > 0 && `(${prescriptions.length})`}
                    </TabsTrigger>
                    <TabsTrigger value="measurements">Measurements</TabsTrigger>
                    <TabsTrigger value="appointments">
                        Appointments {appointments.length > 0 && `(${appointments.length})`}
                    </TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-6 mt-6">
                    {/* Delivery Record */}
                    {delivery && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <TbHeartbeat className="w-5 h-5" />
                                    Birth & Delivery Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                    {delivery.type_of_delivery && (
                                        <div>
                                            <span className="text-gray-600">Type of Delivery:</span>
                                            <p className="font-medium capitalize">
                                                {delivery.type_of_delivery}
                                            </p>
                                        </div>
                                    )}
                                    {delivery.apgar_score && (
                                        <div>
                                            <span className="text-gray-600">APGAR Score:</span>
                                            <p className="font-medium">{delivery.apgar_score}/10</p>
                                        </div>
                                    )}
                                    {delivery.gestation_weeks && (
                                        <div>
                                            <span className="text-gray-600">Gestation:</span>
                                            <p className="font-medium">
                                                {delivery.gestation_weeks} weeks
                                            </p>
                                        </div>
                                    )}
                                    {delivery.distinguishable_marks && (
                                        <div className="col-span-2">
                                            <span className="text-gray-600">
                                                Distinguishable Marks:
                                            </span>
                                            <p className="font-medium">
                                                {delivery.distinguishable_marks}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Latest Measurements */}
                    {anthropometric.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <TbRuler className="w-5 h-5" />
                                    Latest Measurements
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                    {anthropometric[0].weight && (
                                        <div>
                                            <span className="text-gray-600">Weight:</span>
                                            <p className="font-medium text-lg">
                                                {anthropometric[0].weight} kg
                                            </p>
                                        </div>
                                    )}
                                    {anthropometric[0].height && (
                                        <div>
                                            <span className="text-gray-600">Height:</span>
                                            <p className="font-medium text-lg">
                                                {anthropometric[0].height} cm
                                            </p>
                                        </div>
                                    )}
                                    {anthropometric[0].head_circumference && (
                                        <div>
                                            <span className="text-gray-600">
                                                Head Circumference:
                                            </span>
                                            <p className="font-medium text-lg">
                                                {anthropometric[0].head_circumference} cm
                                            </p>
                                        </div>
                                    )}
                                    {anthropometric[0].measurement_date && (
                                        <div className="col-span-2 md:col-span-4 text-xs text-gray-500">
                                            Measured on:{' '}
                                            {new Date(
                                                anthropometric[0].measurement_date
                                            ).toLocaleDateString()}
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Screening Tests */}
                    {screening && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <TbHeartbeat className="w-5 h-5" />
                                    Newborn Screening Tests
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                    {screening.ens_date && (
                                        <div>
                                            <span className="text-gray-600">
                                                Expanded Newborn Screening:
                                            </span>
                                            <p className="font-medium">
                                                {new Date(screening.ens_date).toLocaleDateString()}
                                                {screening.ens_remarks !== null && (
                                                    <Badge
                                                        variant={
                                                            screening.ens_remarks
                                                                ? 'default'
                                                                : 'destructive'
                                                        }
                                                        className="ml-2"
                                                    >
                                                        {screening.ens_remarks ? 'Pass' : 'Refer'}
                                                    </Badge>
                                                )}
                                            </p>
                                        </div>
                                    )}
                                    {screening.nhs_date && (
                                        <div>
                                            <span className="text-gray-600">
                                                Newborn Hearing Screening:
                                            </span>
                                            <p className="font-medium">
                                                {new Date(screening.nhs_date).toLocaleDateString()}
                                            </p>
                                            {(screening.nhs_right_ear !== null ||
                                                screening.nhs_left_ear !== null) && (
                                                <p className="text-xs mt-1">
                                                    Right:{' '}
                                                    {screening.nhs_right_ear ? 'Pass' : 'Refer'} |
                                                    Left:{' '}
                                                    {screening.nhs_left_ear ? 'Pass' : 'Refer'}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                {/* Allergies Tab */}
                <TabsContent value="allergies" className="mt-6">
                    {allergies.length === 0 ? (
                        <Card>
                            <CardContent className="pt-6 text-center py-8">
                                <TbAlertTriangle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                <p className="text-gray-600">No allergies recorded</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-4">
                            {allergies.map((allergy) => (
                                <Card key={allergy.allergy_id}>
                                    <CardContent className="pt-6">
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <h3 className="font-semibold text-lg">
                                                    {allergy.allergen}
                                                </h3>
                                                <p className="text-sm text-gray-600 capitalize">
                                                    {allergy.reaction_type}
                                                </p>
                                            </div>
                                            <Badge
                                                variant={
                                                    allergy.severity === 'life_threatening'
                                                        ? 'destructive'
                                                        : allergy.severity === 'severe'
                                                        ? 'destructive'
                                                        : allergy.severity === 'moderate'
                                                        ? 'default'
                                                        : 'secondary'
                                                }
                                            >
                                                {allergy.severity?.replace('_', ' ').toUpperCase()}
                                            </Badge>
                                        </div>
                                        {allergy.notes && (
                                            <p className="text-sm text-gray-700 mb-2">
                                                {allergy.notes}
                                            </p>
                                        )}
                                        {allergy.date_identified && (
                                            <p className="text-xs text-gray-500">
                                                Identified:{' '}
                                                {new Date(
                                                    allergy.date_identified
                                                ).toLocaleDateString()}
                                            </p>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>

                {/* Vaccinations Tab */}
                <TabsContent value="vaccinations" className="mt-6">
                    {vaccinations.length === 0 ? (
                        <Card>
                            <CardContent className="pt-6 text-center py-8">
                                <TbVaccine className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                <p className="text-gray-600">No vaccinations recorded</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-4">
                            {vaccinations.map((vax) => (
                                <Card key={vax.vax_id}>
                                    <CardContent className="pt-6">
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <h3 className="font-semibold text-lg">
                                                    {vax.vaccine_name}
                                                </h3>
                                                {vax.dose_number && (
                                                    <p className="text-sm text-gray-600">
                                                        Dose #{vax.dose_number}
                                                    </p>
                                                )}
                                            </div>
                                            <Badge variant="outline">
                                                {new Date(
                                                    vax.administered_date
                                                ).toLocaleDateString()}
                                            </Badge>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                            {vax.manufacturer && (
                                                <div>
                                                    <span className="text-gray-600">
                                                        Manufacturer:
                                                    </span>
                                                    <p className="font-medium">
                                                        {vax.manufacturer}
                                                    </p>
                                                </div>
                                            )}
                                            {vax.administration_site && (
                                                <div>
                                                    <span className="text-gray-600">Site:</span>
                                                    <p className="font-medium capitalize">
                                                        {vax.administration_site}
                                                    </p>
                                                </div>
                                            )}
                                            {vax.next_dose_due && (
                                                <div className="col-span-2 mt-2 p-2 bg-blue-50 rounded">
                                                    <span className="text-blue-800 text-sm">
                                                        Next dose due:{' '}
                                                        {new Date(
                                                            vax.next_dose_due
                                                        ).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        {vax.notes && (
                                            <p className="text-sm text-gray-700 mt-3">
                                                {vax.notes}
                                            </p>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>

                {/* Prescriptions Tab */}
                <TabsContent value="prescriptions" className="mt-6">
                    {prescriptions.length === 0 ? (
                        <Card>
                            <CardContent className="pt-6 text-center py-8">
                                <TbPill className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                <p className="text-gray-600">No prescriptions recorded</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-4">
                            {prescriptions.map((rx) => (
                                <Card key={rx.rx_id}>
                                    <CardContent className="pt-6">
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <h3 className="font-semibold text-lg">
                                                    Prescription
                                                </h3>
                                                {rx.users && (
                                                    <p className="text-sm text-gray-600">
                                                        Dr. {rx.users.firstname} {rx.users.lastname}
                                                        {rx.users.specialty &&
                                                            ` - ${rx.users.specialty}`}
                                                    </p>
                                                )}
                                            </div>
                                            <Badge variant="outline">
                                                {new Date(
                                                    rx.prescription_date
                                                ).toLocaleDateString()}
                                            </Badge>
                                        </div>
                                        {rx.findings && (
                                            <div className="mb-3">
                                                <span className="text-sm font-medium text-gray-700">
                                                    Findings:
                                                </span>
                                                <p className="text-sm text-gray-600 mt-1">
                                                    {rx.findings}
                                                </p>
                                            </div>
                                        )}
                                        {rx.doctor_instructions && (
                                            <div className="mb-3">
                                                <span className="text-sm font-medium text-gray-700">
                                                    Instructions:
                                                </span>
                                                <p className="text-sm text-gray-600 mt-1">
                                                    {rx.doctor_instructions}
                                                </p>
                                            </div>
                                        )}
                                        {rx.return_date && (
                                            <div className="mt-3 p-2 bg-green-50 rounded">
                                                <span className="text-green-800 text-sm">
                                                    Follow-up:{' '}
                                                    {new Date(rx.return_date).toLocaleDateString()}
                                                </span>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>

                {/* Measurements Tab */}
                <TabsContent value="measurements" className="mt-6">
                    {anthropometric.length === 0 ? (
                        <Card>
                            <CardContent className="pt-6 text-center py-8">
                                <TbRuler className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                <p className="text-gray-600">No measurements recorded</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-4">
                            {anthropometric.map((measurement, index) => (
                                <Card key={measurement.am_id || index}>
                                    <CardContent className="pt-6">
                                        <div className="flex justify-between items-start mb-4">
                                            <h3 className="font-semibold">Measurement Record</h3>
                                            {measurement.measurement_date && (
                                                <Badge variant="outline">
                                                    {new Date(
                                                        measurement.measurement_date
                                                    ).toLocaleDateString()}
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                                            {measurement.weight && (
                                                <div>
                                                    <span className="text-gray-600">Weight:</span>
                                                    <p className="font-medium text-lg">
                                                        {measurement.weight} kg
                                                    </p>
                                                </div>
                                            )}
                                            {measurement.height && (
                                                <div>
                                                    <span className="text-gray-600">Height:</span>
                                                    <p className="font-medium text-lg">
                                                        {measurement.height} cm
                                                    </p>
                                                </div>
                                            )}
                                            {measurement.head_circumference && (
                                                <div>
                                                    <span className="text-gray-600">Head:</span>
                                                    <p className="font-medium text-lg">
                                                        {measurement.head_circumference} cm
                                                    </p>
                                                </div>
                                            )}
                                            {measurement.chest_circumference && (
                                                <div>
                                                    <span className="text-gray-600">Chest:</span>
                                                    <p className="font-medium text-lg">
                                                        {measurement.chest_circumference} cm
                                                    </p>
                                                </div>
                                            )}
                                            {measurement.abdominal_circumference && (
                                                <div>
                                                    <span className="text-gray-600">Abdomen:</span>
                                                    <p className="font-medium text-lg">
                                                        {measurement.abdominal_circumference} cm
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>

                {/* Appointments Tab */}
                <TabsContent value="appointments" className="mt-6">
                    {appointments.length === 0 ? (
                        <Card>
                            <CardContent className="pt-6 text-center py-8">
                                <TbCalendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                <p className="text-gray-600">No appointments recorded</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-4">
                            {appointments.map((appt) => (
                                <Card key={appt.appointment_id}>
                                    <CardContent className="pt-6">
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <h3 className="font-semibold text-lg">
                                                    {appt.doctor_name || 'Appointment'}
                                                </h3>
                                                {appt.users && (
                                                    <p className="text-sm text-gray-600">
                                                        Dr. {appt.users.firstname}{' '}
                                                        {appt.users.lastname}
                                                        {appt.users.specialty &&
                                                            ` - ${appt.users.specialty}`}
                                                    </p>
                                                )}
                                            </div>
                                            <Badge
                                                variant={
                                                    appt.status === 'completed'
                                                        ? 'default'
                                                        : appt.status === 'scheduled'
                                                        ? 'secondary'
                                                        : appt.status === 'cancelled'
                                                        ? 'destructive'
                                                        : 'outline'
                                                }
                                            >
                                                {appt.status?.toUpperCase()}
                                            </Badge>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                            <div>
                                                <span className="text-gray-600">Date:</span>
                                                <p className="font-medium">
                                                    {new Date(
                                                        appt.appointment_date
                                                    ).toLocaleDateString()}
                                                </p>
                                            </div>
                                            {appt.appointment_time && (
                                                <div>
                                                    <span className="text-gray-600">Time:</span>
                                                    <p className="font-medium">
                                                        {appt.appointment_time}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                        {appt.reason && (
                                            <div className="mt-3">
                                                <span className="text-sm font-medium text-gray-700">
                                                    Reason:
                                                </span>
                                                <p className="text-sm text-gray-600 mt-1">
                                                    {appt.reason}
                                                </p>
                                            </div>
                                        )}
                                        {appt.notes && (
                                            <div className="mt-2">
                                                <span className="text-sm font-medium text-gray-700">
                                                    Notes:
                                                </span>
                                                <p className="text-sm text-gray-600 mt-1">
                                                    {appt.notes}
                                                </p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    )
}

export default ChildProfile
