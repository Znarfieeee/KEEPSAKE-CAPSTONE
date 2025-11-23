/**
 * FAQ Content Data
 * Comprehensive FAQ and Knowledge Base content for KEEPSAKE Healthcare System
 *
 * Organized by categories and includes role-specific content
 * Written in simple, clear language accessible to users of all ages
 */

// FAQ Categories
export const FAQ_CATEGORIES = {
    GETTING_STARTED: 'getting_started',
    ROLE_GUIDES: 'role_guides',
    TROUBLESHOOTING: 'troubleshooting',
    PRIVACY_SECURITY: 'privacy_security'
}

// Category Labels and Descriptions
export const CATEGORY_INFO = {
    [FAQ_CATEGORIES.GETTING_STARTED]: {
        label: 'Getting Started',
        description: 'Learn the basics of using KEEPSAKE',
        icon: 'BookOpen'
    },
    [FAQ_CATEGORIES.ROLE_GUIDES]: {
        label: 'Role Guides',
        description: 'Step-by-step guides for your role',
        icon: 'Users'
    },
    [FAQ_CATEGORIES.TROUBLESHOOTING]: {
        label: 'Troubleshooting',
        description: 'Solutions to common problems',
        icon: 'Wrench'
    },
    [FAQ_CATEGORIES.PRIVACY_SECURITY]: {
        label: 'Privacy & Security',
        description: 'Keep your account and data safe',
        icon: 'Shield'
    }
}

// User Roles
export const USER_ROLES = {
    ALL: 'all',
    ADMIN: 'admin',
    FACILITY_ADMIN: 'facility_admin',
    DOCTOR: 'doctor',
    NURSE: 'nurse',
    PARENT: 'parent'
}

// Role Labels
export const ROLE_LABELS = {
    [USER_ROLES.ALL]: 'All Users',
    [USER_ROLES.ADMIN]: 'System Administrator',
    [USER_ROLES.FACILITY_ADMIN]: 'Facility Administrator',
    [USER_ROLES.DOCTOR]: 'Doctor',
    [USER_ROLES.NURSE]: 'Nurse',
    [USER_ROLES.PARENT]: 'Parent/Guardian'
}

/**
 * Main FAQ Content
 * Each item has: id, question, answer, category, roles (array of roles that can see this)
 */
export const FAQ_CONTENT = [
    // ==========================================
    // GETTING STARTED - General Questions
    // ==========================================
    {
        id: 'gs-001',
        question: 'What is KEEPSAKE?',
        answer: `KEEPSAKE is a healthcare facility management system designed to help manage patient records, appointments, and medical information securely.

**Key Features:**
• Secure patient record management
• Easy appointment scheduling
• Prescription tracking
• Real-time updates across all users
• Role-based access for different staff members

KEEPSAKE keeps all your important healthcare information in one safe place.`,
        category: FAQ_CATEGORIES.GETTING_STARTED,
        roles: [USER_ROLES.ALL]
    },
    {
        id: 'gs-002',
        question: 'How do I log in to my account?',
        answer: `**To log in to KEEPSAKE:**

1. Open your web browser (Chrome, Firefox, Safari, or Edge)
2. Go to the KEEPSAKE website
3. You will see the login page
4. Enter your email address in the first box
5. Enter your password in the second box
6. Click the "Log In" button

**Important Tips:**
• Make sure your Caps Lock key is OFF
• Double-check your email spelling
• If you forgot your password, click "Forgot Password"

**Need Help?**
If you cannot log in after trying these steps, contact your facility administrator.`,
        category: FAQ_CATEGORIES.GETTING_STARTED,
        roles: [USER_ROLES.ALL]
    },
    {
        id: 'gs-003',
        question: 'How do I change my password?',
        answer: `**To change your password:**

1. Log in to your account
2. Click on "Settings" in the menu (look for the gear icon)
3. Find the "Security" or "Password" section
4. Click "Change Password"
5. Enter your current (old) password
6. Enter your new password
7. Enter your new password again to confirm
8. Click "Save" or "Update Password"

**Tips for a Strong Password:**
• Use at least 8 characters
• Mix uppercase and lowercase letters
• Include numbers (0-9)
• Add special characters (!@#$%)
• Do NOT use your name or birthday

**Example of a strong password:** MyDog2024!Happy`,
        category: FAQ_CATEGORIES.GETTING_STARTED,
        roles: [USER_ROLES.ALL]
    },
    {
        id: 'gs-004',
        question: 'What do I do if I forgot my password?',
        answer: `**If you forgot your password, follow these steps:**

1. Go to the login page
2. Click "Forgot Password" (below the login button)
3. Enter your email address
4. Click "Send Reset Link"
5. Check your email inbox (and spam folder)
6. Click the link in the email
7. Create a new password
8. Log in with your new password

**Important:**
• The reset link expires after 24 hours
• Check your spam/junk folder if you do not see the email
• If you still have problems, contact your administrator

**The reset email will come from KEEPSAKE - do not delete it!**`,
        category: FAQ_CATEGORIES.GETTING_STARTED,
        roles: [USER_ROLES.ALL]
    },
    {
        id: 'gs-005',
        question: 'How do I navigate the dashboard?',
        answer: `**Understanding Your Dashboard:**

Your dashboard is your home page. It shows important information at a glance.

**Main Parts of the Screen:**

1. **Side Menu (Left Side)**
   • Click items to go to different sections
   • Icons help you find things quickly

2. **Top Bar**
   • Shows your name
   • Has notification bell
   • Quick access to settings

3. **Main Content Area (Center)**
   • Shows the current page content
   • This is where you do most of your work

**Tips for Easy Navigation:**
• Use the side menu to move between pages
• Click your name to see profile options
• Look for the bell icon for new notifications
• The home icon always takes you back to the dashboard`,
        category: FAQ_CATEGORIES.GETTING_STARTED,
        roles: [USER_ROLES.ALL]
    },
    {
        id: 'gs-006',
        question: 'How do I log out of my account?',
        answer: `**To log out safely:**

1. Look for your name or profile picture (usually in the top corner)
2. Click on it to open a menu
3. Click "Log Out" or "Sign Out"
4. You will return to the login page

**Why Logging Out is Important:**
• Keeps your account secure
• Prevents others from seeing your information
• Always log out when using shared computers

**Remember:** Always log out when you are done, especially on public or shared computers!`,
        category: FAQ_CATEGORIES.GETTING_STARTED,
        roles: [USER_ROLES.ALL]
    },

    // ==========================================
    // ROLE GUIDES - System Administrator
    // ==========================================
    {
        id: 'rg-admin-001',
        question: 'How do I add a new facility?',
        answer: `**To add a new healthcare facility:**

1. Go to "Facilities" in the side menu
2. Click the "Add Facility" button (usually top right)
3. Fill in the facility information:
   • Facility name
   • Address
   • Contact phone number
   • Email address
4. Click "Save" or "Create Facility"

**After Creating a Facility:**
• You can assign administrators to manage it
• Add staff members (doctors, nurses)
• The facility will appear in your facilities list

**Note:** Only System Administrators can create new facilities.`,
        category: FAQ_CATEGORIES.ROLE_GUIDES,
        roles: [USER_ROLES.ADMIN]
    },
    {
        id: 'rg-admin-002',
        question: 'How do I manage user accounts?',
        answer: `**To manage users in the system:**

**View All Users:**
1. Click "Users" in the side menu
2. You will see a list of all users
3. Use the search box to find specific users

**Add a New User:**
1. Click "Add User" button
2. Fill in their information (name, email, role)
3. Assign them to a facility
4. Click "Create User"
5. They will receive an email with login instructions

**Edit a User:**
1. Find the user in the list
2. Click the "Edit" button (pencil icon)
3. Make your changes
4. Click "Save"

**Deactivate a User:**
1. Find the user
2. Click "Deactivate" or toggle their status
3. Confirm the action

**Important:** Deactivating a user prevents them from logging in but keeps their records.`,
        category: FAQ_CATEGORIES.ROLE_GUIDES,
        roles: [USER_ROLES.ADMIN]
    },
    {
        id: 'rg-admin-003',
        question: 'How do I view system reports and statistics?',
        answer: `**To view system-wide reports:**

1. Go to your Admin Dashboard
2. Look for "Reports" or "Statistics" section
3. Choose the type of report you want:
   • User activity reports
   • Facility statistics
   • System usage reports

**Understanding the Dashboard Widgets:**
• **Total Users:** Number of registered users
• **Active Facilities:** Facilities currently operating
• **Recent Activity:** Latest actions in the system

**Tips:**
• Reports update in real-time
• You can often filter by date range
• Export options may be available for detailed analysis`,
        category: FAQ_CATEGORIES.ROLE_GUIDES,
        roles: [USER_ROLES.ADMIN]
    },

    // ==========================================
    // ROLE GUIDES - Facility Administrator
    // ==========================================
    {
        id: 'rg-facadmin-001',
        question: 'How do I manage staff at my facility?',
        answer: `**Managing Your Facility Staff:**

**View Your Staff:**
1. Go to "Staff" or "Users" in your menu
2. See all staff members at your facility
3. Use filters to sort by role (doctors, nurses, etc.)

**Add New Staff:**
1. Click "Add Staff Member"
2. Enter their information:
   • Full name
   • Email address
   • Phone number
   • Role (Doctor, Nurse, etc.)
3. Click "Save"
4. They will receive login credentials by email

**Edit Staff Information:**
1. Click on a staff member's name
2. Click "Edit"
3. Update the necessary information
4. Click "Save Changes"

**Note:** You can only manage staff at your assigned facility.`,
        category: FAQ_CATEGORIES.ROLE_GUIDES,
        roles: [USER_ROLES.FACILITY_ADMIN]
    },
    {
        id: 'rg-facadmin-002',
        question: 'How do I update facility information?',
        answer: `**To update your facility details:**

1. Go to "Facility Settings" or "My Facility"
2. Click "Edit" or the pencil icon
3. Update the information you need to change:
   • Facility name
   • Address
   • Phone number
   • Operating hours
   • Contact email
4. Click "Save Changes"

**What You Can Update:**
• Basic contact information
• Operating hours
• Facility description
• Emergency contact details

**What Requires System Admin:**
• Facility status changes
• Major structural changes
• Billing information`,
        category: FAQ_CATEGORIES.ROLE_GUIDES,
        roles: [USER_ROLES.FACILITY_ADMIN]
    },

    // ==========================================
    // ROLE GUIDES - Doctor
    // ==========================================
    {
        id: 'rg-doctor-001',
        question: 'How do I view my patient list?',
        answer: `**To see your patients:**

1. Click "Patients" in the side menu
2. Your patient list will appear
3. You can:
   • Search by name
   • Filter by status
   • Sort by date

**Patient List Shows:**
• Patient name
• Age
• Last visit date
• Current status

**To View Patient Details:**
1. Click on a patient's name
2. See their complete record
3. View medical history, allergies, and notes

**Quick Tip:** Use the search bar at the top to quickly find a specific patient.`,
        category: FAQ_CATEGORIES.ROLE_GUIDES,
        roles: [USER_ROLES.DOCTOR]
    },
    {
        id: 'rg-doctor-002',
        question: 'How do I create a prescription?',
        answer: `**To write a prescription:**

1. Open the patient's record
2. Click "Prescriptions" tab
3. Click "New Prescription" button
4. Fill in the prescription details:
   • Medication name
   • Dosage (how much to take)
   • Frequency (how often)
   • Duration (how long)
   • Special instructions
5. Review the information
6. Click "Save Prescription"

**Important Reminders:**
• Double-check the dosage
• Verify patient allergies first
• Add clear instructions for the patient
• The prescription saves to the patient's record

**The prescription will be visible to:**
• The patient (or parent/guardian)
• Nurses at your facility
• Other authorized doctors`,
        category: FAQ_CATEGORIES.ROLE_GUIDES,
        roles: [USER_ROLES.DOCTOR]
    },
    {
        id: 'rg-doctor-003',
        question: 'How do I manage appointments?',
        answer: `**Viewing Your Appointments:**

1. Click "Appointments" in the menu
2. See your schedule for today
3. Use the calendar to view other dates

**Your Appointment View Shows:**
• Patient name
• Appointment time
• Appointment type
• Status (confirmed, pending, completed)

**To Update an Appointment:**
1. Click on the appointment
2. Choose an action:
   • Mark as completed
   • Add notes
   • Reschedule
3. Save your changes

**After an Appointment:**
1. Open the appointment
2. Click "Complete" or "Add Notes"
3. Write your consultation notes
4. Update any prescriptions if needed
5. Save your changes`,
        category: FAQ_CATEGORIES.ROLE_GUIDES,
        roles: [USER_ROLES.DOCTOR]
    },
    {
        id: 'rg-doctor-004',
        question: 'How do I add notes to a patient record?',
        answer: `**Adding Notes to Patient Records:**

1. Open the patient's profile
2. Go to "Medical Notes" or "History" tab
3. Click "Add Note" button
4. Write your notes:
   • Chief complaint
   • Examination findings
   • Diagnosis
   • Treatment plan
5. Click "Save Note"

**Good Notes Include:**
• Date and time of visit
• Symptoms described by patient
• Your observations
• Tests ordered
• Treatment given
• Follow-up instructions

**Tips for Clear Notes:**
• Be specific and detailed
• Use simple language
• Note any patient concerns
• Include follow-up plans`,
        category: FAQ_CATEGORIES.ROLE_GUIDES,
        roles: [USER_ROLES.DOCTOR]
    },

    // ==========================================
    // ROLE GUIDES - Nurse
    // ==========================================
    {
        id: 'rg-nurse-001',
        question: 'How do I record vital signs?',
        answer: `**Recording Patient Vital Signs:**

1. Search for the patient or scan their QR code
2. Open their record
3. Click "Vitals" or "Record Vitals"
4. Enter the measurements:
   • **Temperature** (in °C or °F)
   • **Blood Pressure** (systolic/diastolic)
   • **Heart Rate** (beats per minute)
   • **Weight** (in kg or lbs)
   • **Height** (in cm or feet/inches)
5. Add any notes if needed
6. Click "Save"

**Tips for Accurate Recording:**
• Double-check numbers before saving
• Record the time of measurement
• Note any unusual readings
• Alert the doctor if values are concerning

**The vitals will be visible to doctors immediately.**`,
        category: FAQ_CATEGORIES.ROLE_GUIDES,
        roles: [USER_ROLES.NURSE]
    },
    {
        id: 'rg-nurse-002',
        question: 'How do I check in a patient?',
        answer: `**Patient Check-In Process:**

**Method 1: Using QR Code**
1. Click "Scan QR" or use the scanner
2. Point camera at patient's QR code
3. Patient details will appear
4. Confirm the patient identity
5. Click "Check In"

**Method 2: Manual Search**
1. Click "Check In" or "Search Patient"
2. Type the patient's name
3. Select from the results
4. Verify their information
5. Click "Check In"

**After Check-In:**
• Patient appears in waiting list
• Doctor is notified
• You can record initial vitals
• Update appointment status to "Arrived"`,
        category: FAQ_CATEGORIES.ROLE_GUIDES,
        roles: [USER_ROLES.NURSE]
    },
    {
        id: 'rg-nurse-003',
        question: 'How do I view patient allergies?',
        answer: `**Finding Patient Allergies:**

1. Open the patient's record
2. Look for the "Allergies" section (usually highlighted)
3. Allergies are often shown with a warning icon

**Allergy Information Shows:**
• Allergen name (medicine, food, etc.)
• Type of reaction
• Severity level
• Date recorded

**Important:**
• ALWAYS check allergies before any procedure
• Allergies are highlighted in RED for visibility
• Report any new allergies immediately
• Update records if patient reports new allergies

**If Patient Reports New Allergy:**
1. Click "Add Allergy"
2. Enter the allergen name
3. Describe the reaction
4. Select severity
5. Save the record`,
        category: FAQ_CATEGORIES.ROLE_GUIDES,
        roles: [USER_ROLES.NURSE]
    },

    // ==========================================
    // ROLE GUIDES - Parent/Guardian
    // ==========================================
    {
        id: 'rg-parent-001',
        question: 'How do I view my child\'s medical records?',
        answer: `**Viewing Your Child's Records:**

1. Log in to your parent account
2. You will see your children listed on the dashboard
3. Click on your child's name
4. View their medical information:
   • Personal details
   • Medical history
   • Allergies
   • Vaccinations
   • Recent visits
   • Current prescriptions

**What You Can See:**
• All medical records
• Doctor's notes from visits
• Prescription history
• Upcoming appointments
• Growth charts

**What You Can Do:**
• View records (read-only)
• Request appointments
• Send messages to healthcare providers
• Download records if needed`,
        category: FAQ_CATEGORIES.ROLE_GUIDES,
        roles: [USER_ROLES.PARENT]
    },
    {
        id: 'rg-parent-002',
        question: 'How do I book an appointment?',
        answer: `**Booking an Appointment:**

1. Go to "Appointments" in your menu
2. Click "Book New Appointment"
3. Select your child (if you have multiple children)
4. Choose the type of visit:
   • Regular checkup
   • Sick visit
   • Follow-up
   • Other
5. Select a preferred date
6. Choose an available time slot
7. Add any notes about the visit reason
8. Click "Book Appointment"

**After Booking:**
• You will see a confirmation message
• The appointment appears in your calendar
• You may receive an email confirmation
• The facility will confirm the appointment

**To Cancel or Reschedule:**
1. Go to your appointments
2. Find the appointment
3. Click "Cancel" or "Reschedule"
4. Follow the prompts`,
        category: FAQ_CATEGORIES.ROLE_GUIDES,
        roles: [USER_ROLES.PARENT]
    },
    {
        id: 'rg-parent-003',
        question: 'How do I access my child\'s QR code?',
        answer: `**Finding Your Child's QR Code:**

1. Log in to your account
2. Go to your child's profile
3. Look for the "QR Code" button or section
4. Click to display the QR code

**What is the QR Code For?**
• Quick check-in at the facility
• Nurses scan it to access your child's record
• Faster service during visits
• Secure patient identification

**Tips:**
• You can save the QR code to your phone
• Take a screenshot for easy access
• Show it when you arrive at the facility
• Each child has their own unique QR code

**The QR code is SAFE:**
• It only works at authorized facilities
• It does not contain private medical data
• Staff must be logged in to use it`,
        category: FAQ_CATEGORIES.ROLE_GUIDES,
        roles: [USER_ROLES.PARENT]
    },
    {
        id: 'rg-parent-004',
        question: 'How do I update my contact information?',
        answer: `**Updating Your Information:**

1. Click on "Settings" in the menu
2. Go to "Profile" or "Account"
3. Click "Edit" next to your information
4. Update what you need:
   • Phone number
   • Email address
   • Home address
   • Emergency contact
5. Click "Save Changes"

**Why Keep Information Updated:**
• Facilities can reach you in emergencies
• Appointment reminders go to correct email/phone
• Important notices reach you
• Your child's records stay accurate

**Important:**
• Use an email you check regularly
• Provide a phone number where you can be reached
• Keep emergency contact information current`,
        category: FAQ_CATEGORIES.ROLE_GUIDES,
        roles: [USER_ROLES.PARENT]
    },

    // ==========================================
    // TROUBLESHOOTING
    // ==========================================
    {
        id: 'ts-001',
        question: 'I cannot log in to my account',
        answer: `**If you cannot log in, try these steps:**

**Step 1: Check Your Email Address**
• Make sure you typed it correctly
• Check for typos (like ".con" instead of ".com")
• Try copying and pasting if unsure

**Step 2: Check Your Password**
• Turn OFF Caps Lock
• Make sure Num Lock is ON if using numbers
• Try typing it in a notepad first to see it
• Remember: passwords are case-sensitive

**Step 3: Reset Your Password**
• Click "Forgot Password" on the login page
• Enter your email
• Check your email for the reset link
• Create a new password

**Step 4: Clear Browser Cache**
• Try opening a "Private" or "Incognito" window
• Or clear your browser history and cache

**Still Cannot Log In?**
Contact your facility administrator or IT support.`,
        category: FAQ_CATEGORIES.TROUBLESHOOTING,
        roles: [USER_ROLES.ALL]
    },
    {
        id: 'ts-002',
        question: 'The page is loading slowly or not at all',
        answer: `**If KEEPSAKE is slow or not loading:**

**Quick Fixes:**

1. **Refresh the page**
   • Press F5 on your keyboard
   • Or click the refresh button in your browser

2. **Check your internet**
   • Try opening another website
   • Restart your WiFi router if needed

3. **Try a different browser**
   • Use Chrome, Firefox, Safari, or Edge
   • Clear your current browser's cache

4. **Close other tabs**
   • Too many open tabs slow things down
   • Close tabs you are not using

5. **Restart your device**
   • Turn your computer off and on again
   • This fixes many problems

**If Problem Continues:**
• Try again in a few minutes
• The system might be updating
• Contact support if it persists more than 30 minutes`,
        category: FAQ_CATEGORIES.TROUBLESHOOTING,
        roles: [USER_ROLES.ALL]
    },
    {
        id: 'ts-003',
        question: 'I see an error message',
        answer: `**When you see an error message:**

**Step 1: Read the Message**
• The message often tells you what is wrong
• Write down or screenshot the error

**Step 2: Try These Fixes**
• Refresh the page (press F5)
• Log out and log back in
• Try a different browser
• Clear your browser cache

**Common Error Types:**

• **"Session Expired"**
  - Log in again
  - This happens after inactivity

• **"Access Denied"**
  - You may not have permission
  - Contact your administrator

• **"Not Found"**
  - The page may have moved
  - Go back to the main menu

• **"Server Error"**
  - Wait a few minutes
  - The system may be updating

**Report the Error:**
If the error keeps happening, use the Feedback form to report it.`,
        category: FAQ_CATEGORIES.TROUBLESHOOTING,
        roles: [USER_ROLES.ALL]
    },
    {
        id: 'ts-004',
        question: 'My changes did not save',
        answer: `**If your changes did not save:**

**Check These Things:**

1. **Did you click "Save"?**
   • Look for a Save button
   • It might say "Save," "Submit," or "Update"

2. **Was there an error?**
   • Red text or messages indicate problems
   • Required fields might be empty
   • Check for red highlighted boxes

3. **Did the page refresh?**
   • Sometimes accidental refresh loses changes
   • Try making changes again

4. **Is your internet working?**
   • Changes cannot save without internet
   • Check your connection

**To Avoid Losing Work:**
• Save frequently
• Do not close the browser while saving
• Wait for confirmation messages
• Look for "Saved successfully" notifications

**If Changes Keep Not Saving:**
Contact your administrator - there may be a system issue.`,
        category: FAQ_CATEGORIES.TROUBLESHOOTING,
        roles: [USER_ROLES.ALL]
    },
    {
        id: 'ts-005',
        question: 'I was logged out unexpectedly',
        answer: `**Why You Might Be Logged Out:**

**Common Reasons:**

1. **Session Timeout**
   • For security, you are logged out after 30 minutes of no activity
   • This protects your account
   • Simply log in again

2. **Logged In Elsewhere**
   • Someone may have logged into your account
   • If you did not do this, change your password immediately

3. **Browser Cleared**
   • Clearing cookies logs you out
   • This is normal behavior

4. **System Update**
   • Sometimes updates require everyone to log in again

**What To Do:**
• Log in again with your credentials
• If you cannot log in, reset your password
• If suspicious, contact your administrator

**Security Tip:**
If you did not expect to be logged out, change your password as a precaution.`,
        category: FAQ_CATEGORIES.TROUBLESHOOTING,
        roles: [USER_ROLES.ALL]
    },
    {
        id: 'ts-006',
        question: 'The QR code scanner is not working',
        answer: `**Fixing QR Code Scanner Issues:**

**Step 1: Check Camera Permission**
• Your browser needs camera access
• Look for a camera icon in the address bar
• Click it and select "Allow"

**Step 2: Good Lighting**
• Make sure there is enough light
• Avoid glare on the QR code
• Hold the code steady

**Step 3: Proper Distance**
• Not too close, not too far
• The QR code should fill most of the camera view
• Hold steady for 2-3 seconds

**Step 4: Try These Fixes**
• Clean your camera lens
• Refresh the page
• Try a different browser
• Restart the app

**Alternative Method:**
If scanning does not work, search for the patient manually using their name.`,
        category: FAQ_CATEGORIES.TROUBLESHOOTING,
        roles: [USER_ROLES.NURSE, USER_ROLES.DOCTOR]
    },

    // ==========================================
    // PRIVACY & SECURITY
    // ==========================================
    {
        id: 'ps-001',
        question: 'How is my data protected?',
        answer: `**Your Data is Protected By:**

**Security Measures:**

1. **Encryption**
   • All data is encrypted (scrambled) during transfer
   • Even if intercepted, it cannot be read
   • We use industry-standard encryption

2. **Secure Login**
   • Passwords are safely stored
   • We never see your actual password
   • Session timeouts protect unattended computers

3. **Access Control**
   • Only authorized people can see your data
   • Different roles have different access levels
   • All access is logged and monitored

4. **Regular Security Updates**
   • Our system is regularly updated
   • Security patches are applied promptly
   • We monitor for any threats

**Your Privacy Rights:**
• Your medical information is confidential
• We follow healthcare privacy regulations
• You can request information about your data`,
        category: FAQ_CATEGORIES.PRIVACY_SECURITY,
        roles: [USER_ROLES.ALL]
    },
    {
        id: 'ps-002',
        question: 'How do I create a strong password?',
        answer: `**Creating a Strong Password:**

**A Good Password Has:**
• At least 8 characters (longer is better)
• Mix of uppercase (ABC) and lowercase (abc)
• Numbers (123)
• Special characters (!@#$%^&*)

**Examples of Strong Passwords:**
• MyDog$Runs2Fast!
• Blue42*Ocean#Wave
• Happy!Birthday2024

**Examples of WEAK Passwords (Never Use):**
• password123
• 12345678
• Your name or birthday
• qwerty

**Password Tips:**
• Use a phrase you can remember
• Never share your password
• Do not use the same password everywhere
• Change it if you think someone knows it

**Easy Method - Use a Passphrase:**
Think of a sentence and use parts:
"My cat Felix loves to eat fish" = McF!2Eat*F`,
        category: FAQ_CATEGORIES.PRIVACY_SECURITY,
        roles: [USER_ROLES.ALL]
    },
    {
        id: 'ps-003',
        question: 'What should I do if I suspect unauthorized access?',
        answer: `**If You Suspect Someone Accessed Your Account:**

**Take These Steps Immediately:**

1. **Change Your Password**
   • Do this right away
   • Use a completely new password
   • Do not reuse old passwords

2. **Check Recent Activity**
   • Look at your recent sessions
   • Note any unfamiliar activity
   • Check times you were not logged in

3. **Log Out All Sessions**
   • Go to Settings > Security
   • Click "Log out all devices"
   • This ends all active sessions

4. **Contact Your Administrator**
   • Report the suspicious activity
   • They can investigate further
   • They may need to take additional action

5. **Watch for Unusual Activity**
   • Monitor your account closely
   • Report anything strange

**Signs of Unauthorized Access:**
• Changes you did not make
• Emails about actions you did not do
• Unable to log in with your password
• Unknown devices in your active sessions`,
        category: FAQ_CATEGORIES.PRIVACY_SECURITY,
        roles: [USER_ROLES.ALL]
    },
    {
        id: 'ps-004',
        question: 'Who can see my information?',
        answer: `**Who Has Access to Your Information:**

**Your Data is Visible To:**

**For Patients (via Parent/Guardian Account):**
• Your child's assigned doctors
• Nurses at the facility during visits
• Facility administrators (for administrative purposes)
• You (the parent/guardian)

**For Healthcare Staff:**
• Only patients at your assigned facility
• Information needed for your role
• Audit logs track all access

**Role-Based Access Means:**
• Doctors see medical details for treatment
• Nurses see vitals and basic info
• Administrators see operational data
• Parents see their own children's records

**We Do NOT Share Your Data With:**
• Unauthorized third parties
• Other patients
• Marketing companies
• Anyone without proper authorization

**Your Rights:**
• Ask who has accessed your records
• Request corrections to your information
• Know how your data is used`,
        category: FAQ_CATEGORIES.PRIVACY_SECURITY,
        roles: [USER_ROLES.ALL]
    },
    {
        id: 'ps-005',
        question: 'How do I enable two-factor authentication (2FA)?',
        answer: `**What is Two-Factor Authentication (2FA)?**

2FA adds extra security. After entering your password, you also enter a code sent to your phone or email.

**To Enable 2FA:**

1. Go to Settings
2. Click "Security" tab
3. Find "Two-Factor Authentication"
4. Click "Enable"
5. Choose your method:
   • Text message (SMS)
   • Email
   • Authenticator app
6. Follow the setup instructions
7. Enter the verification code
8. Save your backup codes

**How It Works:**
• Log in with your password
• Receive a code on your phone/email
• Enter the code
• You are now logged in

**Why Use 2FA?**
• Much harder for hackers to access your account
• Even if someone gets your password, they cannot log in
• Protects sensitive medical information

**Keep Your Backup Codes Safe!**
These codes help you log in if you lose access to your phone.`,
        category: FAQ_CATEGORIES.PRIVACY_SECURITY,
        roles: [USER_ROLES.PARENT]
    },
    {
        id: 'ps-006',
        question: 'What happens to my data when my account is closed?',
        answer: `**When an Account is Deactivated:**

**For Healthcare Staff:**
• Your login is disabled
• You cannot access the system
• Your activity records are kept for audit purposes
• Patient records you created remain for continuity of care

**For Parent/Guardian Accounts:**
• Your login is disabled
• Medical records are retained as required by law
• You can request data export before closure
• Contact the facility for record access afterward

**Data Retention:**
• Medical records are kept according to legal requirements
• This is typically several years
• Records may be needed for ongoing patient care

**Your Rights:**
• Request your data before account closure
• Ask questions about what is retained
• Contact the facility for future record access

**Important:**
Healthcare records are kept for legal and medical reasons, even after account closure. This ensures continuity of care.`,
        category: FAQ_CATEGORIES.PRIVACY_SECURITY,
        roles: [USER_ROLES.ALL]
    }
]

/**
 * Get FAQs filtered by category
 * @param {string} category - The category to filter by
 * @returns {Array} Filtered FAQ items
 */
export const getFAQsByCategory = (category) => {
    if (category === 'all') return FAQ_CONTENT
    return FAQ_CONTENT.filter(faq => faq.category === category)
}

/**
 * Get FAQs filtered by user role
 * @param {string} role - The user role to filter by
 * @returns {Array} Filtered FAQ items
 */
export const getFAQsByRole = (role) => {
    return FAQ_CONTENT.filter(faq =>
        faq.roles.includes(USER_ROLES.ALL) || faq.roles.includes(role)
    )
}

/**
 * Get FAQs filtered by both category and role
 * @param {string} category - The category to filter by
 * @param {string} role - The user role to filter by
 * @returns {Array} Filtered FAQ items
 */
export const getFAQsByCategoryAndRole = (category, role) => {
    return FAQ_CONTENT.filter(faq => {
        const matchesCategory = category === 'all' || faq.category === category
        const matchesRole = faq.roles.includes(USER_ROLES.ALL) || faq.roles.includes(role)
        return matchesCategory && matchesRole
    })
}

/**
 * Search FAQs by keyword
 * @param {string} keyword - Search term
 * @param {string} role - User role for filtering (optional)
 * @returns {Array} Matching FAQ items
 */
export const searchFAQs = (keyword, role = null) => {
    const searchTerm = keyword.toLowerCase()

    return FAQ_CONTENT.filter(faq => {
        // Check if matches search term
        const matchesSearch =
            faq.question.toLowerCase().includes(searchTerm) ||
            faq.answer.toLowerCase().includes(searchTerm)

        // Check if matches role (if provided)
        const matchesRole = !role ||
            faq.roles.includes(USER_ROLES.ALL) ||
            faq.roles.includes(role)

        return matchesSearch && matchesRole
    })
}

/**
 * Get all available categories
 * @returns {Array} Category objects with id, label, description, and icon
 */
export const getAllCategories = () => {
    return Object.entries(CATEGORY_INFO).map(([id, info]) => ({
        id,
        ...info
    }))
}

export default FAQ_CONTENT
