import React, { useState, useEffect } from "react"

// API imports
// import { getFacilityUsers } from "../../api/admin/users"
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

const FacilityAdminDashboard = () => {
    const [users, setUsers] = useState([])
    const [selectedUser, setSelectedUser] = useState(null)
    const [showEditRole, setShowEditRole] = useState(false)
    const [showDeactivate, setShowDeactivate] = useState(false)
    const [showResetPassword, setShowResetPassword] = useState(false)

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
                    <UserTable
                        users={users}
                        onView={user => setSelectedUser(user)}
                        onEditRole={user => {
                            setSelectedUser(user)
                            setShowEditRole(true)
                        }}
                        onDeactivate={user => {
                            setSelectedUser(user)
                            setShowDeactivate(true)
                        }}
                        onReactivate={user => {
                            // TODO: Implement reactivate functionality
                            console.log("Reactivate user:", user)
                        }}
                        onResetPassword={user => {
                            setSelectedUser(user)
                            setShowResetPassword(true)
                        }}
                    />
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

export default FacilityAdminDashboard
