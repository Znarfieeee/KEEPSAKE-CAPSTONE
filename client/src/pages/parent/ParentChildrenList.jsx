import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getParentChildren } from '@/api/parent/children'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { TbHeartbeat, TbSearch } from 'react-icons/tb'
import { BiCalendar } from 'react-icons/bi'

function ParentChildrenList() {
  const [children, setChildren] = useState([])
  const [filteredChildren, setFilteredChildren] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchChildren()
  }, [])

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredChildren(children)
    } else {
      const query = searchQuery.toLowerCase()
      const filtered = children.filter((child) => {
        const patient = child.patient
        const fullName = `${patient.firstname} ${patient.middlename || ''} ${patient.lastname}`.toLowerCase()
        return fullName.includes(query) || child.relationship.toLowerCase().includes(query)
      })
      setFilteredChildren(filtered)
    }
  }, [searchQuery, children])

  const fetchChildren = async () => {
    try {
      setLoading(true)
      const response = await getParentChildren()
      if (response.status === 'success') {
        setChildren(response.data)
        setFilteredChildren(response.data)
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
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div>
          <Skeleton className="h-9 w-64 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>

        {/* Search Bar Skeleton */}
        <Skeleton className="h-10 w-full" />

        {/* Children Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="h-full">
              <CardHeader>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <Skeleton className="h-6 w-40 mb-2" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="h-6 w-16 rounded-full" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-6 w-20 rounded-full" />
                    </div>
                    <div className="flex justify-between">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-28" />
                    </div>
                    <div className="flex justify-between">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                  </div>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-5 w-48" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Info Card Skeleton */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-3">
              <Skeleton className="w-9 h-9 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
          </CardContent>
        </Card>
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
        <h1 className="text-3xl font-bold text-gray-900">My Children</h1>
        <p className="text-gray-600 mt-2">
          View your children's health information and medical records.
        </p>
      </div>

      {/* Search Bar */}
      {children.length > 0 && (
        <div className="relative">
          <TbSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="text"
            placeholder="Search by name or relationship..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      )}

      {/* Children List */}
      {filteredChildren.length === 0 && searchQuery ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <TbSearch className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 text-lg mb-2">No results found</p>
              <p className="text-gray-500 text-sm">
                Try adjusting your search query.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : filteredChildren.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <TbHeartbeat className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 text-lg mb-2">No children registered</p>
              <p className="text-gray-500 text-sm">
                Contact your healthcare provider to link your child's medical records.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredChildren.map((child) => {
            const patient = child.patient
            return (
              <Link key={patient.patient_id} to={`/keepsaker/child/${patient.patient_id}`}>
                <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer h-full">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-1">
                          {patient.firstname} {patient.middlename ? `${patient.middlename} ` : ''}{patient.lastname}
                        </CardTitle>
                        <CardDescription>
                          {patient.age || 'Age not calculated'}
                        </CardDescription>
                      </div>
                      <Badge variant={patient.sex === 'male' ? 'default' : 'secondary'}>
                        {patient.sex === 'male' ? 'Male' : 'Female'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {/* Basic Info */}
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Relationship:</span>
                          <Badge variant="outline" className="capitalize">
                            {child.relationship}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Date of Birth:</span>
                          <span className="font-medium">
                            {new Date(patient.date_of_birth).toLocaleDateString()}
                          </span>
                        </div>
                        {patient.bloodtype && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Blood Type:</span>
                            <span className="font-medium">{patient.bloodtype}</span>
                          </div>
                        )}
                      </div>

                      {/* Access Granted Date */}
                      <div className="pt-3 border-t text-xs text-gray-500">
                        Access granted: {new Date(child.granted_at).toLocaleDateString()}
                      </div>

                      {/* View Details Link */}
                      <div className="pt-2">
                        <span className="text-blue-600 text-sm font-medium hover:text-blue-700 flex items-center gap-1">
                          <TbHeartbeat className="w-4 h-4" />
                          View Medical Records →
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}

      {/* Info Card */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-blue-100 rounded-full flex-shrink-0">
              <TbHeartbeat className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-blue-900 mb-1">Important Information</p>
              <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                <li>All medical records are view-only for parents</li>
                <li>For updates or changes, contact your healthcare provider</li>
                <li>Click on any child card to view their complete medical history</li>
                <li>Medical records include vaccinations, allergies, prescriptions, and appointments</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default ParentChildrenList
