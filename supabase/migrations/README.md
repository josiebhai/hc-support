# Database Migrations

This directory contains SQL migration files for the Supabase database.

## How to Apply Migrations

### Option 1: Using Supabase Dashboard (Recommended for quick setup)

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy the contents of the migration file
4. Paste and execute the SQL

### Option 2: Using Supabase CLI

If you have Supabase CLI installed:

```bash
# Link your project (first time only)
supabase link --project-ref your-project-ref

# Apply migrations
supabase db push
```

## Migration Files

### 20250108_create_patients_table.sql

Creates the `patients` table with the following features:

- Patient profile fields (name, gender, DOB, contact info, etc.)
- Automatic patient ID generation (P001, P002, etc.)
- Row Level Security (RLS) policies
- Indexes for performance optimization
- Automatic timestamp updates

**Required fields:**
- Patient ID (unique identifier)
- Full Name
- Gender
- Date of Birth
- Language Preference
- Marital Status
- Aadhar ID (Indian identification)
- Mobile Number
- Village
- State

**Permissions:**
- All authenticated users can read patient data
- Only Super Admin and Receptionist can create/update/delete patients

## Notes

- Make sure the `users` table exists before applying the patients migration
- The migration includes RLS policies that reference the `users` table
- Patient IDs are in format P001, P002, etc. and must be unique
