export const displayRoles = (role) => {
    switch (role) {
        case 'admin':
            return 'Admin'
        case 'facility_admin':
            return 'Facility Admin'
        case 'SystemAdmin':
            return 'System Admin'
        case 'doctor':
            return 'Doctor'
        case 'nurse':
            return 'Nurse'
        case 'staff':
            return 'Staff'
        case 'parent':
            return 'Parent'
        default:
            return role
    }
}

export default displayRoles
