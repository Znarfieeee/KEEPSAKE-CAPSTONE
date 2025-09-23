import React, { useState, useEffect } from 'react'
import { assignUserToFacility } from '@/api/admin/users'

// UI Components
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DatePicker } from '@/components/ui/DatePicker'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { showToast } from '@/util/alertHelper'
import { getFacilities } from '@/api/admin/facility'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'

const formSchema = z.object({
    facility_id: z.string().min(1, 'Please select a facility'),
    facility_role: z.string().min(1, 'Please select a role'),
    department: z.string().optional(),
    start_date: z.string().min(1, 'Please select a start date'),
})

const facilityRoles = [
    { value: 'facility_admin', label: 'Facility Admin' },
    { value: 'doctor', label: 'Doctor' },
    { value: 'nurse', label: 'Nurse' },
    { value: 'admin', label: 'Admin' },
    { value: 'staff', label: 'Staff' },
]

const departments = [
    { value: 'none', label: 'No specific department' },
    { value: 'Pediatrics', label: 'Pediatrics' },
    { value: 'Cardiology', label: 'Cardiology' },
    { value: 'Emergency', label: 'Emergency' },
    { value: 'Surgery', label: 'Surgery' },
    { value: 'Administration', label: 'Administration' },
    { value: 'Radiology', label: 'Radiology' },
    { value: 'Laboratory', label: 'Laboratory' },
    { value: 'Pharmacy', label: 'Pharmacy' },
    { value: 'Nursing', label: 'Nursing' },
    { value: 'IT', label: 'IT' },
    { value: 'Human Resources', label: 'Human Resources' },
    { value: 'Finance', label: 'Finance' },
]

const UserAssignFacility = ({ open, onClose, userId, user }) => {
    const [facilities, setFacilities] = useState([])
    const [loading, setLoading] = useState(false)
    const [isFetching, setIsFetching] = useState(true)

    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            facility_id: '',
            facility_role: '',
            department: 'none',
            start_date: new Date().toISOString().split('T')[0], // Default to today
        },
    })

    useEffect(() => {
        const loadFacilities = async () => {
            setIsFetching(true)
            try {
                const response = await getFacilities()
                if (response.status === 'success') {
                    setFacilities(response.data)
                }
            } catch (error) {
                console.error('Failed to load facilities:', error)
                showToast('error', 'Failed to load facilities. Please try again.')
            } finally {
                setIsFetching(false)
            }
        }

        if (open) {
            form.reset({
                facility_id: '',
                facility_role: '',
                department: 'none',
                start_date: new Date().toISOString().split('T')[0], // Reset to today's date
            }) // Reset form when reopening
            loadFacilities()
        }
    }, [open, form])

    const onSubmit = async (data) => {
        if (isFetching) return

        setLoading(true)
        try {
            const selectedFacility = facilities.find((f) => f.facility_id === data.facility_id)
            const selectedRole = facilityRoles.find((r) => r.value === data.facility_role)

            if (!selectedFacility || !selectedRole) {
                throw new Error('Invalid facility or role selection')
            }

            const response = await assignUserToFacility(userId, {
                facility_id: data.facility_id,
                facility_role: data.facility_role,
                department: data.department === 'none' ? null : data.department,
                start_date: data.start_date,
            })

            if (response.status === 'success') {
                const message = user.assigned_facility
                    ? `${user.firstname} ${user.lastname} has been reassigned from ${user.assigned_facility} to ${selectedFacility.facility_name} as ${selectedRole.label}`
                    : `${user.firstname} ${user.lastname} has been assigned to ${selectedFacility.facility_name} as ${selectedRole.label}`

                showToast('success', message)
                onClose()
                form.reset()
            } else {
                throw new Error(
                    response.message ||
                        `Failed to ${
                            user.assigned_facility ? 'reassign' : 'assign'
                        } user to facility`
                )
            }
        } catch (error) {
            console.error('Facility assignment error:', error)
            showToast(
                'error',
                error.message || 'Failed to assign user to facility. Please try again.'
            )
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[400px] border-0 shadow-sm bg-white [&_button[data-slot=dialog-close]]:text-transparent [&_button[data-slot=dialog-close]]:p-1">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold">
                        {user.assigned_facility ? 'Reassign Facility' : 'Assign Facility'}
                    </DialogTitle>
                    <span className="flex gap-1">
                        <p className="text-sm text-black">
                            {user.assigned_facility ? 'Reassigning' : 'Assigning'} facility for
                        </p>
                        <p className="text-sm text-primary">
                            {user.firstname} {user.lastname}
                        </p>
                    </span>
                </DialogHeader>

                {user.assigned_facility && (
                    <div className="bg-muted/30 p-3 rounded-lg mb-4">
                        <h3 className="text-sm font-medium text-muted-foreground mb-2">
                            Current Assignment
                        </h3>
                        <div className="space-y-1">
                            <p className="text-sm">
                                <span className="font-medium">Facility:</span>{' '}
                                {user.assigned_facility}
                            </p>
                            <p className="text-sm">
                                <span className="font-medium">Role:</span> {user.facility_role}
                            </p>
                        </div>
                    </div>
                )}

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-sm font-medium mb-2">Select Role</h3>
                                <FormField
                                    control={form.control}
                                    name="facility_role"
                                    render={({ field }) => (
                                        <FormItem>
                                            <Select
                                                onValueChange={field.onChange}
                                                defaultValue={field.value}
                                                disabled={loading}
                                            >
                                                <FormControl>
                                                    <SelectTrigger className="w-full bg-white">
                                                        <SelectValue placeholder="Select a role" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {facilityRoles.map((role) => (
                                                        <SelectItem
                                                            key={role.value}
                                                            value={role.value}
                                                        >
                                                            {role.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div>
                                <h3 className="text-sm font-medium mb-2">Select Facility</h3>
                                <FormField
                                    control={form.control}
                                    name="facility_id"
                                    render={({ field }) => (
                                        <FormItem>
                                            <Select
                                                onValueChange={field.onChange}
                                                defaultValue={field.value}
                                                disabled={loading || isFetching}
                                            >
                                                <FormControl>
                                                    <SelectTrigger className="w-full bg-white">
                                                        {isFetching ? (
                                                            <div className="flex items-center gap-2">
                                                                <div className="size-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                                                <span className="text-muted-foreground">
                                                                    Loading facilities...
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <SelectValue placeholder="Select a facility" />
                                                        )}
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {facilities.length === 0 ? (
                                                        <div className="relative flex items-center justify-center py-2 px-2 text-sm text-muted-foreground">
                                                            No facilities available
                                                        </div>
                                                    ) : (
                                                        facilities.map((facility) => (
                                                            <SelectItem
                                                                key={facility.facility_id}
                                                                value={facility.facility_id}
                                                            >
                                                                {facility.facility_name}
                                                            </SelectItem>
                                                        ))
                                                    )}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div>
                                <h3 className="text-sm font-medium mb-2">Department (Optional)</h3>
                                <FormField
                                    control={form.control}
                                    name="department"
                                    render={({ field }) => (
                                        <FormItem>
                                            <Select
                                                onValueChange={field.onChange}
                                                defaultValue={field.value}
                                                disabled={loading}
                                            >
                                                <FormControl>
                                                    <SelectTrigger className="w-full bg-white">
                                                        <SelectValue placeholder="Select department (optional)" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {departments.map((dept) => (
                                                        <SelectItem
                                                            key={dept.value}
                                                            value={dept.value}
                                                        >
                                                            {dept.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div>
                                <h3 className="text-sm font-medium mb-2">Start Date</h3>
                                <FormField
                                    control={form.control}
                                    name="start_date"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormControl>
                                                <DatePicker
                                                    value={field.value}
                                                    onChange={field.onChange}
                                                    placeholder="Select start date"
                                                    disabled={loading}
                                                    className="w-full bg-white"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        <DialogFooter className="w-full mt-6 justify-between">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={onClose}
                                disabled={loading || isFetching}
                                className="px-4"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={loading || isFetching}
                                className="bg-primary text-white px-4 min-w-[120px]"
                            >
                                {loading ? (
                                    <span className="flex items-center gap-2">
                                        <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        Assigning...
                                    </span>
                                ) : isFetching ? (
                                    'Loading...'
                                ) : (
                                    'Assign Facility'
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}

export default UserAssignFacility
