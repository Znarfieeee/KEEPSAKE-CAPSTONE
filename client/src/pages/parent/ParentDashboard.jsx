import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getParentChildren } from '@/api/parent/children'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Loader from '@/components/ui/Loader'
import { TbHeartbeat } from 'react-icons/tb'
import { BiCalendar } from 'react-icons/bi'
import { Users } from 'lucide-react'

function ParentDashboard() {
    const [children, setChildren] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        fetchChildren()
    }, [])

    const fetchChildren = async () => {
        try {
            setLoading(true)
            const response = await getParentChildren()
            if (response.status === 'success') {
                setChildren(response.data)
            }
        } catch (err) {
            console.error('Error fetching children:', err)
            setError('Failed to load your children. Please try again later.')
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
            <div className="p-6">
                <Card className="border-red-200 bg-red-50">
                    <CardContent className="pt-6">
                        <p className="text-red-600">{error}</p>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-600 mt-2">
                    Welcome! View and manage your children's health information.
                </p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center space-x-4">
                            <div className="p-3 bg-blue-100 rounded-full">
                                <Users className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">My Children</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {children.length}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Link to="appointments">
                    <Card className="hover:shadow-md transition-shadow cursor-pointer">
                        <CardContent className="pt-6">
                            <div className="flex items-center space-x-4">
                                <div className="p-3 bg-green-100 rounded-full">
                                    <BiCalendar className="w-6 h-6 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Appointments</p>
                                    <p className="text-2xl font-bold text-gray-900">View</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </Link>

                <Link to="/parent/children">
                    <Card className="hover:shadow-md transition-shadow cursor-pointer">
                        <CardContent className="pt-6">
                            <div className="flex items-center space-x-4">
                                <div className="p-3 bg-purple-100 rounded-full">
                                    <TbHeartbeat className="w-6 h-6 text-purple-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Health Records</p>
                                    <p className="text-2xl font-bold text-gray-900">View</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </Link>
            </div>

            {/* Children List */}
            <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">My Children</h2>

                {children.length === 0 ? (
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-center py-8">
                                <TbHeartbeat className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-600 text-lg mb-2">No children registered</p>
                                <p className="text-gray-500 text-sm">
                                    Contact your healthcare provider to link your child's medical
                                    records.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {children.map((child) => {
                            const patient = child.patient
                            return (
                                <Link
                                    key={patient.patient_id}
                                    to={`/parent/child/${patient.patient_id}`}
                                >
                                    <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer h-full">
                                        <CardHeader>
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <CardTitle className="text-lg">
                                                        {patient.firstname}{' '}
                                                        {patient.middlename
                                                            ? `${patient.middlename} `
                                                            : ''}
                                                        {patient.lastname}
                                                    </CardTitle>
                                                    <CardDescription className="mt-1">
                                                        {patient.age || 'Age not calculated'}
                                                    </CardDescription>
                                                </div>
                                                <Badge
                                                    variant={
                                                        patient.sex === 'male'
                                                            ? 'default'
                                                            : 'secondary'
                                                    }
                                                >
                                                    {patient.sex === 'male' ? 'Male' : 'Female'}
                                                </Badge>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-2 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">
                                                        Relationship:
                                                    </span>
                                                    <span className="font-medium capitalize">
                                                        {child.relationship}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">
                                                        Date of Birth:
                                                    </span>
                                                    <span className="font-medium">
                                                        {new Date(
                                                            patient.date_of_birth
                                                        ).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                {patient.bloodtype && (
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-600">
                                                            Blood Type:
                                                        </span>
                                                        <span className="font-medium">
                                                            {patient.bloodtype}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="mt-4 pt-4 border-t">
                                                <span className="text-blue-600 text-sm font-medium hover:text-blue-700">
                                                    View Details →
                                                </span>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* Important Notice */}
            <Card className="border-blue-200 bg-blue-50">
                <CardContent className="pt-6">
                    <div className="flex items-start space-x-3">
                        <div className="p-2 bg-blue-100 rounded-full">
                            <TbHeartbeat className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="font-medium text-blue-900">Read-Only Access</p>
                            <p className="text-sm text-blue-700 mt-1">
                                You have view-only access to your children's medical records. For
                                any updates or changes, please contact your healthcare provider.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

export default ParentDashboard
