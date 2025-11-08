# Testing Guide: Patient Profile Feature

This guide explains how to test the new patient profile creation feature.

## Prerequisites

Before testing, you need to:

1. Set up Supabase (if not using demo mode)
   - Create a Supabase project at [supabase.com](https://supabase.com)
   - Copy your project URL and anon key
   - Create `.env` file from `.env.example` and add your credentials

2. Apply the database migration
   - Navigate to SQL Editor in Supabase Dashboard
   - Run the migration from `supabase/migrations/20250108_create_patients_table.sql`

## Testing Steps

### 1. Login

Use one of these demo accounts:
- **Super Admin**: `admin@healthcare.com` (any password in demo mode)
- **Receptionist**: `receptionist@healthcare.com` (any password in demo mode)

> Note: Only Super Admin and Receptionist roles can manage patient profiles.

### 2. Navigate to Patients Page

After login:
1. Look for "Patients" in the left sidebar navigation
2. Click on "Patients" to open the patient management page
3. You should see an empty list with an "Add New Patient" button

### 3. Add a New Patient

Click "Add New Patient" button to open the form dialog.

#### Test Case 1: Valid Patient Data

Fill in the form with valid data:
- **Full Name**: John Doe
- **Gender**: Male
- **Date of Birth**: 1990-01-15
- **Language Preference**: Hindi
- **Marital Status**: Single
- **Aadhar ID**: 1234 5678 9012
- **Mobile Number**: +91 98765 43210
- **Village**: Rampur
- **State**: Delhi

Click "Add Patient" and verify:
- Success message appears
- Dialog closes
- Patient appears in the list with ID "OP-0001"

#### Test Case 2: Form Validation

Try submitting with missing fields:
- Leave "Full Name" empty → Should see validation error
- Enter invalid Aadhar format → Should see pattern validation
- Try submitting → Form should not submit

#### Test Case 3: Multiple Patients

Add another patient with different data:
- **Full Name**: Jane Smith
- **Gender**: Female
- **Date of Birth**: 1985-06-20
- **Language Preference**: English
- **Marital Status**: Married
- **Aadhar ID**: 9876 5432 1098
- **Mobile Number**: +91 87654 32109
- **Village**: Laxmi Nagar
- **State**: Uttar Pradesh

Verify:
- New patient gets ID "OP-0002"
- Both patients appear in the list
- Patient IDs are sequential

### 4. Search Functionality

Test the search bar at the top:
- Search by name: "John" → Should show John Doe
- Search by patient ID: "OP-0002" → Should show Jane Smith
- Search by mobile: "98765" → Should show John Doe
- Clear search → Should show all patients

### 5. Patient Display

Verify each patient card shows:
- Full name with patient ID badge
- Gender badge
- Phone number with icon
- Village and state with location icon
- Date of birth formatted correctly
- Language preference

### 6. Permission Testing

#### Test as Receptionist
- Can see "Add New Patient" button ✓
- Can add new patients ✓
- Can view patient details ✓

#### Test as Doctor/Nurse
Login as:
- **Doctor**: `doctor@healthcare.com`
- **Nurse**: `nurse@healthcare.com`

Verify:
- Can see patients page in sidebar
- Can view patient list ✓
- CANNOT see "Add New Patient" button ✗
- Cannot add/edit/delete patients ✗

### 7. Integration Points

#### From Dashboard
1. Go to Dashboard (click "Dashboard" in sidebar)
2. Find "Quick Actions" card
3. Click "Add New Patient"
4. Should navigate to Patients page

#### Navigation
1. Verify "Patients" menu item highlights when on patients page
2. Navigate between pages and back to verify state management

## Expected Results

### UI/UX
- ✓ Clean, professional medical theme
- ✓ Form is well-organized and easy to fill
- ✓ Validation errors are clear and helpful
- ✓ Loading states show properly
- ✓ Success/error messages appear as toasts

### Functionality
- ✓ Patient IDs auto-generate sequentially (OP-0001, OP-0002, etc.)
- ✓ All required fields validated
- ✓ Search works across name, ID, and mobile
- ✓ Permissions enforced correctly
- ✓ Data persists in database

### Database
- ✓ Patients saved to `patients` table
- ✓ RLS policies enforce permissions
- ✓ Indexes improve search performance
- ✓ Timestamps auto-update

## Troubleshooting

### Issue: "Failed to fetch" error on login
**Solution**: You're in demo mode. The UI will work but without database persistence. To use full features, set up Supabase credentials.

### Issue: "Table doesn't exist" error
**Solution**: Apply the database migration from `supabase/migrations/20250108_create_patients_table.sql`

### Issue: Can't see "Add New Patient" button
**Solution**: Make sure you're logged in as Super Admin or Receptionist role.

### Issue: Patient ID not generating
**Solution**: Check that previous patients exist in database, or verify the generation logic in the code.

## Known Limitations

- In demo mode (without Supabase), patient data will not persist after page refresh
- File uploads (profile pictures) not yet implemented
- Bulk patient import not yet available
- Patient edit/delete functionality to be added in future updates

## Next Steps

After successfully testing:
1. Create real patient records using actual data
2. Test with larger datasets (50+ patients)
3. Verify performance with search and filtering
4. Test on different screen sizes (mobile, tablet, desktop)
5. Verify accessibility features
