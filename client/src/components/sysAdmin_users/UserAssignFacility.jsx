/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react"

// UI Components
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "../ui/Dialog"
import { Button } from "../../components/ui/Button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../ui/select"
import { showToast } from "../../util/alertHelper"
import { getFacilities } from "../../api/admin/facility"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "../ui/form"

const formSchema = z.object({
    facility_id: z.string().min(1, "Please select a facility"),
    facility_role: z.string().min(1, "Please select a role"),
})

const facilityRoles = [
    { value: "facility_admin", label: "Facility Admin" },
    { value: "doctor", label: "Doctor" },
    { value: "nurse", label: "Nurse" },
    { value: "staff", label: "Staff" },
    { value: "parent", label: "Parent" },
]

const UserAssignFacility = ({ open, onClose, userId, user }) => {
    const [facilities, setFacilities] = useState([])
    const [loading, setLoading] = useState(false)

    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            facility_id: "",
            facility_role: "",
        },
    })

    useEffect(() => {
        const loadFacilities = async () => {
            try {
                const response = await getFacilities()
                if (response.status === "success") {
                    setFacilities(response.data)
                }
            } catch (error) {
                console.error("Failed to load facilities:", error)
                showToast({
                    variant: "destructive",
                    title: "Error",
                    description: "Failed to load facilities. Please try again.",
                })
            }
        }

        if (open) {
            loadFacilities()
        }
    }, [open])

    const onSubmit = async data => {
        setLoading(true)
        try {
            // TODO: Implement the facility assignment API call here
            console.log("Assigning facility:", { userId, ...data })

            // Find the selected facility to get its name
            const selectedFacility = facilities.find(
                f => f.facility_id === data.facility_id
            )
            const selectedRole = facilityRoles.find(
                r => r.value === data.facility_role
            )

            showToast(
                "success",
                `${user.firstname} ${user.lastname} has been assigned to ${selectedFacility.facility_name} as ${selectedRole.label}`
            )

            onClose()
            form.reset()
        } catch (error) {
            showToast(
                "error",
                "Failed to assign user to facility. Please try again."
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
                        Assign Facility
                    </DialogTitle>
                    <span className="flex gap-1">
                        <p className="text-sm text-black">
                            Assigning facility for
                        </p>
                        <p className="text-sm text-primary">
                            {user.firstname} {user.lastname}
                        </p>
                    </span>
                </DialogHeader>

                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="space-y-4 mt-4">
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-sm font-medium mb-2">
                                    Select Facility
                                </h3>
                                <FormField
                                    control={form.control}
                                    name="facility_id"
                                    render={({ field }) => (
                                        <FormItem>
                                            <Select
                                                onValueChange={field.onChange}
                                                defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="w-full bg-white">
                                                        <SelectValue placeholder="Select a facility" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {facilities.map(
                                                        facility => (
                                                            <SelectItem
                                                                key={
                                                                    facility.facility_id
                                                                }
                                                                value={
                                                                    facility.facility_id
                                                                }>
                                                                {
                                                                    facility.facility_name
                                                                }
                                                            </SelectItem>
                                                        )
                                                    )}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div>
                                <h3 className="text-sm font-medium mb-2">
                                    Select Role
                                </h3>
                                <FormField
                                    control={form.control}
                                    name="facility_role"
                                    render={({ field }) => (
                                        <FormItem>
                                            <Select
                                                onValueChange={field.onChange}
                                                defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="w-full bg-white">
                                                        <SelectValue placeholder="Select a role" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {facilityRoles.map(role => (
                                                        <SelectItem
                                                            key={role.value}
                                                            value={role.value}>
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
                        </div>

                        <DialogFooter className="w-full mt-6 justify-between">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={onClose}
                                disabled={loading}
                                className="px-4">
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={loading}
                                className="bg-primary text-white px-4">
                                {loading ? "Assigning..." : "Assign Facility"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}

export default UserAssignFacility
