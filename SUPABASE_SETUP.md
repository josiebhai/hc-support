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

-- Enable Realtime for users table (for real-time role updates)
ALTER PUBLICATION supabase_realtime ADD TABLE public.users;
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
4. **Important**: Set email link expiry appropriately
   - Go to Authentication > Settings > Auth section
   - Find "Email link expiry" setting
   - Default is 3600 seconds (1 hour) - consider increasing
   - Recommended: 86400 seconds (24 hours) or more
   - This prevents "otp_expired" errors

### 2. Configure Redirect URLs

**Critical for invitation links to work:**

1. Go to Authentication > URL Configuration
2. Set "Site URL" to your app's URL (e.g., `http://localhost:5173`)
3. Add redirect URLs:
   - Development: `http://localhost:5173/activate`
   - Development wildcard: `http://localhost:5173/*`
   - Production: `https://yourdomain.com/activate`
   - Production wildcard: `https://yourdomain.com/*`
4. Click "Save"

**Note**: Without correct redirect URLs, invitation links will fail with "access_denied" error.

### 3. Email Templates (Recommended)

Customize the email templates in Authentication > Email Templates:

**Invite User Template:**
```html
<h2>You're invited to join HealthCare Support</h2>
<p>You have been invited to join the HealthCare Support Patient Management System.</p>
<p><strong>Important:</strong> This link expires in 24 hours.</p>
<p>Click the link below to activate your account:</p>
<p><a href="{{ .ConfirmationURL }}">Activate Account</a></p>
<p>If the link doesn't work, copy and paste this URL into your browser:</p>
<p>{{ .ConfirmationURL }}</p>
```

**Important Notes:**
- Use `{{ .ConfirmationURL }}` (with double braces and dot prefix)
- Test the email delivery and link functionality
- Advise users to click the link promptly to avoid expiration

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

## Edge Functions Deployment

The application uses Supabase Edge Functions for secure admin operations (invite users, reset passwords, delete users). These functions run server-side with the service role key.

### Prerequisites
1. Install Supabase CLI: `npm install -g supabase`
2. Link your project: `supabase link --project-ref your-project-ref`

### Deploy Functions

Deploy all edge functions to your Supabase project:

```bash
# Deploy all functions
supabase functions deploy invite-user
supabase functions deploy reset-user-password
supabase functions deploy delete-user
```

Or deploy all at once:
```bash
supabase functions deploy
```

### Verify Deployment

Check that functions are deployed:
```bash
supabase functions list
```

You should see:
- `invite-user`
- `reset-user-password`
- `delete-user`

**Note:** Edge functions automatically have access to `SUPABASE_SERVICE_ROLE_KEY` in the deployment environment. You don't need to set this manually.

For detailed information about edge functions, see `supabase/functions/README.md`.

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
- Verify edge functions are deployed: `supabase functions list`
- Check the browser console for any error messages
- Ensure edge functions have been deployed to your Supabase project

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
