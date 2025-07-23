import React from "react"
import { useAuth } from "../../context/auth"
// Placeholder imports for modular components
import UserTable from "../../components/facilityAdmin/UserTable"
import SearchBar from "../../components/facilityAdmin/SearchBar"
import RoleFilterDropdown from "../../components/facilityAdmin/RoleFilterDropdown"
import StatusFilterDropdown from "../../components/facilityAdmin/StatusFilterDropdown"
import UserDetailsModal from "../../components/facilityAdmin/UserDetailsModal"
import AddUserModal from "../../components/facilityAdmin/AddUserModal"
import EditRoleModal from "../../components/facilityAdmin/EditRoleModal"
import DeactivateUserConfirm from "../../components/facilityAdmin/DeactivateUserConfirm"
import ResetPasswordModal from "../../components/facilityAdmin/ResetPasswordModal"
import AddUserButton from "../../components/facilityAdmin/AddUserButton"

const FacilityAdminPage = () => {
    const { user } = useAuth()
    // Facility admin access only (placeholder logic)
    if (!user || user.role !== "facility_admin") {
        return (
            <div className="p-8 text-center text-red-500">
                Access denied. Facility admin only.
            </div>
        )
    }

    // State for filters and modals (to be implemented)

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold">
                        Facility User Management
                    </h1>
                    <AddUserButton />
                </div>
                <div className="flex flex-wrap gap-4 mb-4">
                    <SearchBar placeholder="Search user by name or email" />
                    <RoleFilterDropdown
                        options={[
                            "doctor",
                            "nurse",
                            "parent",
                            "caregiver",
                            "staff",
                        ]}
                    />
                    <StatusFilterDropdown options={["active", "inactive"]} />
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                    <UserTable />
                </div>
                {/* Modals (conditionally rendered) */}
                <UserDetailsModal />
                <AddUserModal />
                <EditRoleModal />
                <DeactivateUserConfirm />
                <ResetPasswordModal />
            </div>
        </div>
    )
}

export default FacilityAdminPage
