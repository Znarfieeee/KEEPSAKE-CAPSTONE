# Parent-Child Assignment API Documentation

## Overview
This document describes the comprehensive parent-child assignment system that allows doctors and facility administrators to manage parent/guardian access to patient (child) records.

## Database Schema Reference

### parent_access Table
```sql
CREATE TABLE public.parent_access (
  access_id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id uuid NOT NULL REFERENCES patients(patient_id),
  user_id uuid NOT NULL REFERENCES users(user_id),
  relationship VARCHAR CHECK (relationship IN ('parent', 'guardian', 'caregiver', 'family_member')),
  granted_by uuid REFERENCES users(user_id),
  granted_at DATE DEFAULT CURRENT_DATE,
  revoked_at DATE,
  is_active BOOLEAN NOT NULL DEFAULT true
);
```

## API Routes Summary

| Route | Method | Purpose | Auth Required |
|-------|--------|---------|---------------|
| `/patient_record/<patient_id>/parents` | GET | List all parents for a patient | doctor, facility_admin, nurse |
| `/parents/search` | GET | Search for existing parent users | doctor, facility_admin, nurse |
| `/patient_record/<patient_id>/assign-parent` | POST | Assign existing parent to child | doctor, facility_admin |
| `/patient_record/<patient_id>/create-and-assign-parent` | POST | Create new parent & assign to child | doctor, facility_admin |
| `/patient_record/<patient_id>/parent_access/<access_id>` | PUT | Update relationship type only | doctor, facility_admin |
| `/patient_record/<patient_id>/remove-parent/<access_id>` | DELETE | Revoke parent access (soft delete) | doctor, facility_admin |

---

## API Routes

### 1. Get All Parents for a Patient
**Endpoint:** `GET /patient_record/<patient_id>/parents`

**Description:** Retrieves all parents/guardians assigned to a specific patient with complete relationship details.

**Authorization:** Requires `doctor`, `facility_admin`, or `nurse` role.

**Response:**
```json
{
  "status": "success",
  "data": {
    "patient": {
      "patient_id": "uuid",
      "firstname": "John",
      "lastname": "Doe"
    },
    "parents": [
      {
        "access_id": "uuid",
        "relationship": "parent",
        "granted_at": "2025-01-15",
        "revoked_at": null,
        "is_active": true,
        "parent": {
          "user_id": "uuid",
          "email": "parent@example.com",
          "firstname": "Jane",
          "lastname": "Doe",
          "phone_number": "+1234567890",
          "is_active": true
        },
        "granted_by": {
          "name": "Dr. Smith Johnson",
          "email": "dr.smith@hospital.com"
        }
      }
    ],
    "count": 1
  }
}
```

**Example Usage:**
```javascript
// JavaScript/React
const response = await fetch(`/api/patient_record/${patientId}/parents`, {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
const data = await response.json();
```

---

### 2. Search for Existing Parents
**Endpoint:** `GET /parents/search?email=<email>&phone=<phone>`

**Description:** Search for existing parent users by email or phone number before creating a new account. This helps avoid duplicate accounts.

**Authorization:** Requires `doctor`, `facility_admin`, or `nurse` role.

**Query Parameters:**
- `email` (optional): Email address to search (partial match)
- `phone` (optional): Phone number to search (partial match)

**Note:** At least one search parameter is required.

**Response:**
```json
{
  "status": "success",
  "data": {
    "parents": [
      {
        "user_id": "uuid",
        "email": "parent@example.com",
        "firstname": "Jane",
        "lastname": "Doe",
        "phone_number": "+1234567890",
        "is_active": true,
        "created_at": "2025-01-01T00:00:00Z"
      }
    ],
    "count": 1,
    "search_criteria": {
      "email": "parent@example.com",
      "phone": null
    }
  }
}
```

**Example Usage:**
```javascript
// Search by email
const response = await fetch('/api/parents/search?email=jane@example.com', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

// Search by phone
const response = await fetch('/api/parents/search?phone=123456', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

---

### 3. Assign Existing Parent to Child
**Endpoint:** `POST /patient_record/<patient_id>/assign-parent`

**Description:** Assign an existing parent user account to a patient. Use this when the parent already has an account in the system.

**Authorization:** Requires `doctor` or `facility_admin` role.

**Request Body:**
```json
{
  "parent_user_id": "uuid",
  "relationship": "parent"  // Options: parent, guardian, caregiver, family_member
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Successfully assigned Jane Doe as parent to John Doe",
  "data": {
    "access_record": {
      "access_id": "uuid",
      "patient_id": "uuid",
      "user_id": "uuid",
      "relationship": "parent",
      "granted_by": "uuid",
      "granted_at": "2025-01-15",
      "is_active": true
    },
    "parent": {
      "user_id": "uuid",
      "email": "parent@example.com",
      "firstname": "Jane",
      "lastname": "Doe",
      "role": "parent",
      "is_active": true
    },
    "patient": {
      "patient_id": "uuid",
      "firstname": "John",
      "lastname": "Doe"
    }
  }
}
```

**Error Cases:**
- **404**: Patient or parent user not found
- **400**: Parent user must have 'parent' role
- **409**: Parent is already assigned to this patient

**Example Usage:**
```javascript
const response = await fetch(`/api/patient_record/${patientId}/assign-parent`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    parent_user_id: '123e4567-e89b-12d3-a456-426614174000',
    relationship: 'parent'
  })
});
```

---

### 4. Create New Parent and Assign to Child
**Endpoint:** `POST /patient_record/<patient_id>/create-and-assign-parent`

**Description:** Create a new parent user account and immediately assign them to a patient. This is a convenience route that combines user creation and assignment in one operation.

**Authorization:** Requires `doctor` or `facility_admin` role.

**Request Body:**
```json
{
  "email": "newparent@example.com",
  "firstname": "Jane",
  "lastname": "Doe",
  "phone_number": "+1234567890",  // Optional
  "relationship": "parent",  // Required: parent, guardian, caregiver, family_member
  "facility_id": "uuid"  // Optional
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Successfully created parent account for Jane Doe and assigned as parent to John Doe",
  "data": {
    "parent_user": {
      "user_id": "uuid",
      "email": "newparent@example.com",
      "firstname": "Jane",
      "lastname": "Doe",
      "phone_number": "+1234567890",
      "role": "parent"
    },
    "generated_password": "Abc123!@",  // Auto-generated secure password
    "access_record": {
      "access_id": "uuid",
      "patient_id": "uuid",
      "user_id": "uuid",
      "relationship": "parent",
      "granted_by": "uuid",
      "granted_at": "2025-01-15",
      "is_active": true
    },
    "patient": {
      "patient_id": "uuid",
      "firstname": "John",
      "lastname": "Doe"
    }
  },
  "important": "Please share the generated password with the parent securely. They should change it after first login."
}
```

**Error Cases:**
- **404**: Patient not found
- **409**: Email already registered (suggests using assign-existing route)
- **400**: Missing required fields
- **500**: Failed to create auth account or database record

**Example Usage:**
```javascript
const response = await fetch(`/api/patient_record/${patientId}/create-and-assign-parent`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'newparent@example.com',
    firstname: 'Jane',
    lastname: 'Doe',
    phone_number: '+1234567890',
    relationship: 'parent',
    facility_id: facilityId  // Optional
  })
});

const data = await response.json();
// IMPORTANT: Save data.data.generated_password to share with parent
console.log('Generated password:', data.data.generated_password);
```

**Important Notes:**
- The system generates a secure 8-character password automatically
- The password is returned ONLY once - make sure to save it
- Share the password with the parent securely (email, SMS, or in-person)
- Advise the parent to change their password after first login

---

### 5. Update Parent Relationship Type
**Endpoint:** `PUT /patient_record/<patient_id>/parent_access/<access_id>`

**Description:** Update the relationship type for an existing parent-child assignment (e.g., change from 'parent' to 'guardian'). This route does NOT revoke access - use the DELETE route for that.

**Authorization:** Requires `doctor` or `facility_admin` role.

**Request Body:**
```json
{
  "relationship": "guardian"  // Options: parent, guardian, caregiver, family_member
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Successfully updated Jane Doe's relationship to John Doe as 'guardian'",
  "data": [
    {
      "access_id": "uuid",
      "patient_id": "uuid",
      "user_id": "uuid",
      "relationship": "guardian",
      "granted_by": "uuid",
      "granted_at": "2025-01-15",
      "is_active": true
    }
  ]
}
```

**Error Cases:**
- **404**: Patient or parent access record not found
- **400**: Cannot update revoked parent access (must create new assignment)
- **400**: Invalid relationship type

**Example Usage:**
```javascript
const response = await fetch(
  `/api/patient_record/${patientId}/parent_access/${accessId}`,
  {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      relationship: 'guardian'
    })
  }
);
```

---

### 6. Remove Parent Assignment (Revoke Access)
**Endpoint:** `DELETE /patient_record/<patient_id>/remove-parent/<access_id>`

**Description:** Soft-delete (revoke) a parent's access to a patient's records. Sets `is_active=False` and records `revoked_at` timestamp. The parent user account remains intact; only the relationship is removed.

**Important:** This is different from the PUT route above. Use DELETE to completely revoke access, use PUT to only change the relationship type.

**Authorization:** Requires `doctor` or `facility_admin` role.

**Response:**
```json
{
  "status": "success",
  "message": "Successfully removed Jane Doe's access to John Doe's records",
  "data": {
    "access_id": "uuid",
    "revoked_at": "2025-01-15"
  }
}
```

**Example Usage:**
```javascript
const response = await fetch(
  `/api/patient_record/${patientId}/remove-parent/${accessId}`,
  {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }
);
```

---

## Complete Workflow Examples

### Workflow 1: Assign Existing Parent to New Patient
```javascript
// 1. Doctor searches for parent by email
const searchResponse = await fetch('/api/parents/search?email=jane@example.com', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const searchData = await searchResponse.json();

// 2. If parent found, assign them to patient
if (searchData.data.count > 0) {
  const parentUserId = searchData.data.parents[0].user_id;

  const assignResponse = await fetch(`/api/patient_record/${patientId}/assign-parent`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      parent_user_id: parentUserId,
      relationship: 'parent'
    })
  });

  const assignData = await assignResponse.json();
  console.log('Parent assigned:', assignData.message);
}
```

### Workflow 2: Create New Parent and Assign
```javascript
// 1. Check if email exists first
const searchResponse = await fetch('/api/parents/search?email=newparent@example.com', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const searchData = await searchResponse.json();

// 2. If no existing account, create and assign
if (searchData.data.count === 0) {
  const createResponse = await fetch(
    `/api/patient_record/${patientId}/create-and-assign-parent`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'newparent@example.com',
        firstname: 'Jane',
        lastname: 'Doe',
        phone_number: '+1234567890',
        relationship: 'parent'
      })
    }
  );

  const createData = await createResponse.json();

  // CRITICAL: Save and display the generated password
  const generatedPassword = createData.data.generated_password;
  alert(`Parent account created! Password: ${generatedPassword}`);

  // Share password with parent via email/SMS/print
  sharePasswordWithParent(createData.data.parent_user.email, generatedPassword);
}
```

### Workflow 3: View and Manage Patient's Parents
```javascript
// 1. Get all parents for a patient
const parentsResponse = await fetch(`/api/patient_record/${patientId}/parents`, {
  headers: { 'Authorization': `Bearer ${token}` }
});
const parentsData = await parentsResponse.json();

console.log(`Patient has ${parentsData.data.count} parent(s) assigned`);

// 2. Display parents in UI
parentsData.data.parents.forEach(parent => {
  console.log(`
    Name: ${parent.parent.firstname} ${parent.parent.lastname}
    Email: ${parent.parent.email}
    Relationship: ${parent.relationship}
    Status: ${parent.is_active ? 'Active' : 'Revoked'}
  `);
});

// 3. Remove a parent if needed
const accessIdToRemove = parentsData.data.parents[0].access_id;
await fetch(`/api/patient_record/${patientId}/remove-parent/${accessIdToRemove}`, {
  method: 'DELETE',
  headers: { 'Authorization': `Bearer ${token}` }
});
```

---

## Validation Rules

### Relationship Types
Valid relationship values:
- `parent` - Biological or adoptive parent
- `guardian` - Legal guardian
- `caregiver` - Primary caregiver (non-parent)
- `family_member` - Extended family member with access

### Email Validation
- Must be unique in the system
- Must be a valid email format
- Case-insensitive (stored as lowercase)

### Password Generation
- Auto-generated passwords are 8 characters
- Include uppercase, lowercase, numbers, and special characters
- Format: `Abc123!@` (example)

---

## Error Handling

### Common HTTP Status Codes
- `200 OK` - Successful GET/PUT/DELETE
- `201 Created` - Successfully created new resource
- `400 Bad Request` - Invalid input or validation error
- `401 Unauthorized` - Authentication required or invalid
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Patient, parent, or access record not found
- `409 Conflict` - Duplicate assignment or email already exists
- `500 Internal Server Error` - Server-side error

### Example Error Response
```json
{
  "status": "error",
  "message": "Email john@example.com is already registered",
  "suggestion": "Use the 'assign existing parent' route if this parent already has an account"
}
```

---

## Security Considerations

1. **Role-Based Access Control**
   - Only doctors and facility admins can create/assign/remove parents
   - Nurses can view parent assignments

2. **Password Security**
   - Auto-generated passwords are cryptographically secure
   - Passwords managed by Supabase Auth (never stored in plain text)
   - Parents should change password after first login

3. **Audit Logging**
   - All parent assignment operations are logged
   - Includes user email, timestamps, and actions performed
   - Check server logs for audit trail

4. **Data Privacy**
   - Parents can only access their assigned children's records
   - Access can be revoked at any time by doctors/facility admins
   - Soft-delete preserves audit trail

---

## Integration with Existing Routes

### Related Routes (Already Existing)
These routes are already implemented in `parent_routes.py`:

- `GET /parent/children` - Parent views their assigned children
- `GET /parent/child/<patient_id>` - Parent views specific child details
- `GET /parent/child/<patient_id>/appointments` - Parent views child appointments

### Data Consistency
The new routes maintain consistency with:
- Real-time updates system (Supabase subscriptions)
- Redis cache invalidation
- Audit logging system
- Session management

---

## Testing Checklist

### Manual Testing Steps
1. ✅ Search for non-existent parent (should return empty)
2. ✅ Create new parent and assign to patient (verify password returned)
3. ✅ Search for newly created parent (should find them)
4. ✅ Try to assign same parent again (should fail with 409)
5. ✅ Get all parents for patient (should show new parent)
6. ✅ Remove parent assignment (verify soft-delete)
7. ✅ Verify parent can still login but can't access revoked patient

### API Testing with cURL

```bash
# 1. Search for parent
curl -X GET "http://localhost:5000/api/parents/search?email=test@example.com" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 2. Create and assign parent
curl -X POST "http://localhost:5000/api/patient_record/PATIENT_ID/create-and-assign-parent" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newparent@example.com",
    "firstname": "Jane",
    "lastname": "Doe",
    "relationship": "parent",
    "phone_number": "+1234567890"
  }'

# 3. Get patient's parents
curl -X GET "http://localhost:5000/api/patient_record/PATIENT_ID/parents" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 4. Assign existing parent
curl -X POST "http://localhost:5000/api/patient_record/PATIENT_ID/assign-parent" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "parent_user_id": "USER_ID",
    "relationship": "guardian"
  }'

# 5. Remove parent assignment
curl -X DELETE "http://localhost:5000/api/patient_record/PATIENT_ID/remove-parent/ACCESS_ID" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## File Locations

- **Backend Routes:** `server/routes/pediapro/doctor_patient_records.py`
  - `update_parent_relationship()` - Line 606
  - `get_patient_parents()` - Line 707
  - `search_parents()` - Line 803
  - `assign_existing_parent_to_child()` - Line 875
  - `create_and_assign_parent()` - Line 999
  - `remove_parent_assignment()` - Line 1219
- **Parent Routes:** `server/routes/parent/parent_routes.py`
- **Database Schema:** `server/dbschema.txt` (lines 187-200)
- **Password Generator:** `server/utils/gen_password.py`

---

## Support and Troubleshooting

### Common Issues

**Issue:** "Email already registered" error
- **Solution:** Use the search route first, then use assign-existing route

**Issue:** "Parent user must have 'parent' role"
- **Solution:** Only users with role='parent' can be assigned to patients

**Issue:** Generated password not displaying
- **Solution:** Check response data structure: `response.data.data.generated_password`

**Issue:** Real-time updates not working
- **Solution:** Ensure cache invalidation is working and Supabase subscriptions are active

### Debug Mode
To enable detailed logging, check server logs for lines starting with:
- `AUDIT:` - Audit trail entries
- `DEBUG:` - Detailed debugging information

---

## Future Enhancements

Potential improvements for future versions:
- [ ] Email notification when parent is assigned to patient
- [ ] Password reset flow for parents
- [ ] Multi-language support for parent communications
- [ ] Parent consent/approval workflow
- [ ] Bulk parent assignment for multiple children
- [ ] Parent activity tracking and analytics
- [ ] Temporary access grants (time-limited access)

---

**Last Updated:** 2025-10-31
**API Version:** 1.0
**Maintained By:** KEEPSAKE Development Team
