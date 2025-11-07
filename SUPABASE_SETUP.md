# Supabase Database Setup for User Management

This document provides instructions for setting up the required database tables and authentication in Supabase for the user management system.

## Prerequisites

1. A Supabase account and project
2. Access to the Supabase SQL Editor

## Database Schema

### 1. Users Table

Run the following SQL in your Supabase SQL Editor to create the users table:

```sql
-- Create users table
CREATE TABLE IF NOT EXISTS public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('super_admin', 'doctor', 'nurse', 'receptionist')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('active', 'inactive', 'pending', 'terminated')),
    full_name TEXT,
    profile_picture TEXT,
    phone TEXT,
    invited_by UUID REFERENCES public.users(id),
    activated_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
-- Super admins can do everything
CREATE POLICY "Super admins have full access" ON public.users
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'super_admin'
        )
    );

-- Users can read their own data
CREATE POLICY "Users can read own data" ON public.users
    FOR SELECT
    USING (id = auth.uid());

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON public.users(status);
```

### 2. Create Trigger for Updated Timestamp

```sql
-- Create trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

### 3. Create Function to Sync Auth Users with Users Table

```sql
-- Function to create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, role, status, created_at, updated_at)
    VALUES (
        NEW.id,
        NEW.email,
        'doctor', -- Default role
        'pending',
        NOW(),
        NOW()
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function when a new user signs up
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();
```

## Authentication Setup

### 1. Enable Email Auth

1. Go to Authentication > Settings in your Supabase dashboard
2. Enable Email provider
3. Configure email templates for invitation and password reset

### 2. Email Templates (Optional but Recommended)

You can customize the email templates in Authentication > Email Templates:

**Invite User Template:**
```html
<h2>You're invited to join HealthCare Support</h2>
<p>You have been invited to join the HealthCare Support Patient Management System.</p>
<p>Click the link below to activate your account:</p>
<p><a href="{{ .ConfirmationURL }}">Activate Account</a></p>
```

**Reset Password Template:**
```html
<h2>Reset your password</h2>
<p>Click the link below to reset your password:</p>
<p><a href="{{ .ConfirmationURL }}">Reset Password</a></p>
```

## Initial Super Admin Setup

After setting up the database, you need to create an initial super admin user:

```sql
-- First, sign up a user through the application or Supabase Auth
-- Then, update their role to super_admin

UPDATE public.users
SET role = 'super_admin', status = 'active'
WHERE email = 'your-admin-email@example.com';
```

## Environment Variables

Make sure to set these environment variables in your `.env` file:

```env
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

You can find these values in your Supabase project settings under API.

## Testing the Setup

1. Start the development server: `npm run dev`
2. Try logging in with your super admin account
3. Test creating a new user invitation
4. Verify that invited users can activate their accounts

## Troubleshooting

### Users table not found
- Make sure you've run all the SQL scripts above
- Check that the table exists in the Supabase Table Editor

### Authentication not working
- Verify your environment variables are set correctly
- Check that Email authentication is enabled in Supabase
- Ensure the users table has proper RLS policies

### Cannot invite users
- Make sure you're logged in as a super admin
- Check the browser console for any error messages
- Verify that the Supabase Admin API is accessible (may require service role key for production)

## Security Notes

1. **Row Level Security (RLS)** is enabled on the users table to ensure data security
2. Only super admins can manage other users
3. Users can only view and update their own profiles
4. All sensitive operations are protected by Supabase authentication

## Next Steps

Once the database is set up, you can:
1. Create patient management tables
2. Add medical records tables
3. Implement appointment scheduling
4. Add audit logging for user actions
