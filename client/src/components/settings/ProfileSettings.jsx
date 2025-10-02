import { useState, useEffect } from 'react'
import { useAuth } from '../../context/auth'
import { getProfile, updateProfile } from '../../api/settings'
import { showToast } from '../../util/alertHelper'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Button } from '../ui/Button'
import { Loader2 } from 'lucide-react'
import SettingsSkeleton from './SettingsSkeleton'

const ProfileSettings = () => {
    const { user } = useAuth()
    const [loading, setLoading] = useState(false)
    const [fetchingProfile, setFetchingProfile] = useState(true)
    const [profileData, setProfileData] = useState({
        firstname: '',
        lastname: '',
        middlename: '',
        specialty: '',
        license_number: '',
    })

    useEffect(() => {
        fetchProfile()
    }, [])

    const fetchProfile = async () => {
        try {
            setFetchingProfile(true)
            const response = await getProfile()
            if (response.status === 'success') {
                const { data } = response
                setProfileData({
                    firstname: data.firstname || '',
                    lastname: data.lastname || '',
                    middlename: data.middlename || '',
                    specialty: data.specialty || '',
                    license_number: data.license_number || '',
                })
            }
        } catch (error) {
            showToast('error', error.message || 'Failed to load profile')
        } finally {
            setFetchingProfile(false)
        }
    }

    const handleChange = (e) => {
        const { name, value } = e.target
        setProfileData((prev) => ({
            ...prev,
            [name]: value,
        }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        // Validation
        if (!profileData.firstname.trim() || !profileData.lastname.trim()) {
            showToast('error', 'First name and last name are required')
            return
        }

        try {
            setLoading(true)
            const response = await updateProfile(profileData)

            if (response.status === 'success') {
                showToast('success', 'Profile updated successfully')
            }
        } catch (error) {
            showToast('error', error.message || 'Failed to update profile')
        } finally {
            setLoading(false)
        }
    }

    if (fetchingProfile) {
        return <SettingsSkeleton />
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* First Name */}
                <div className="space-y-2">
                    <Label htmlFor="firstname">
                        First Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                        id="firstname"
                        name="firstname"
                        value={profileData.firstname}
                        onChange={handleChange}
                        placeholder="Enter your first name"
                        required
                    />
                </div>

                {/* Last Name */}
                <div className="space-y-2">
                    <Label htmlFor="lastname">
                        Last Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                        id="lastname"
                        name="lastname"
                        value={profileData.lastname}
                        onChange={handleChange}
                        placeholder="Enter your last name"
                        required
                    />
                </div>

                {/* Middle Name */}
                <div className="space-y-2">
                    <Label htmlFor="middlename">Middle Name</Label>
                    <Input
                        id="middlename"
                        name="middlename"
                        value={profileData.middlename}
                        onChange={handleChange}
                        placeholder="Enter your middle name (optional)"
                    />
                </div>

                {/* Specialty */}
                {(user?.role === 'doctor' || user?.role === 'facility_admin') && (
                    <div className="space-y-2">
                        <Label htmlFor="specialty">Specialty</Label>
                        <Input
                            id="specialty"
                            name="specialty"
                            value={profileData.specialty}
                            onChange={handleChange}
                            placeholder="Enter your specialty"
                        />
                    </div>
                )}

                {/* License Number */}
                {(user?.role === 'doctor' || user?.role === 'facility_admin') && (
                    <div className="space-y-2">
                        <Label htmlFor="license_number">License Number</Label>
                        <Input
                            id="license_number"
                            name="license_number"
                            value={profileData.license_number}
                            onChange={handleChange}
                            placeholder="Enter your license number"
                        />
                    </div>
                )}
            </div>

            {/* Read-only fields */}
            <div className="border-t pt-6 mt-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">
                    Account Information (Read-only)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" value={user?.email || ''} disabled />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="role">Role</Label>
                        <Input
                            id="role"
                            value={user?.role || ''}
                            disabled
                            className="capitalize"
                        />
                    </div>
                </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-6 border-t">
                <Button type="submit" disabled={loading} className="min-w-[120px]">
                    {loading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        'Save Changes'
                    )}
                </Button>
            </div>
        </form>
    )
}

export default ProfileSettings
