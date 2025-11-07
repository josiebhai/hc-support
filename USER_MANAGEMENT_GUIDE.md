# User Management System - Feature Guide

## Overview

The HealthCare Support Patient Management System includes a comprehensive user management system with role-based access control (RBAC), user invitations, and profile management.

## User Roles and Permissions

### Super Admin
- **Full system access** - Can perform all operations
- **User Management** - Create, invite, update, deactivate, and delete users
- **Login as Others** - Can access any user account
- **Reset Passwords** - Can reset passwords for any user
- **View/Edit Medical Charts** - Full access to patient records
- **Manage Patient Profiles** - Add, update, delete patient profiles

### Doctor
- **View Medical Charts** - Read access to patient medical records
- **Edit Medical Charts** - Can update patient medical records
- **Limited Access** - Cannot manage users or patient profiles

### Nurse
- **View Medical Charts** - Read access to patient medical records
- **Edit Medical Charts** - Can update patient medical records
- **Limited Access** - Cannot manage users or patient profiles

### Receptionist
- **View Medical Charts** - Read-only access to patient records
- **Manage Patient Profiles** - Can add, update, and delete patient profiles
- **No Chart Editing** - Cannot edit patient medical records
- **No User Management** - Cannot manage system users

## User Management Features

### 1. User Invitation Flow

**As a Super Admin:**

1. Navigate to **User Management** from the sidebar
2. Click the **"Invite User"** button
3. Fill in the invitation form:
   - **Email Address** - The user's email
   - **Role** - Select from Doctor, Nurse, Receptionist, or Super Admin
4. Click **"Send Invitation"**
5. The user receives an email with an activation link

**As an Invited User:**

1. Click the activation link in the invitation email
2. Complete the activation form:
   - **Full Name** - Your complete name
   - **Phone Number** - Optional contact number
   - **Password** - Create a secure password (min 8 characters)
   - **Confirm Password** - Re-enter your password
3. Click **"Activate Account"**
4. You're redirected to the dashboard

### 2. User Profile Management

**View All Users:**
- Access the User Management page (Super Admin only)
- View a list of all users with their:
  - Name and email
  - Role badge
  - Status badge (Active, Pending, Inactive, Terminated)
  - Phone number

**Update User Status:**
- **Activate** - Enable a user account
- **Deactivate** - Temporarily disable a user account
- **Terminate** - Permanently disable a user account

**User Actions:**
- **Reset Password** - Send a password reset email to a user
- **Delete User** - Permanently remove a user from the system (requires confirmation)

### 3. Profile Settings

Users can update their own profile information:
- Full name
- Phone number
- Profile picture (future enhancement)

### 4. Authentication Flow

**Login Process:**
1. Navigate to the login page
2. Enter your email and password
3. Click **"Sign In"**
4. If account is pending activation, you're redirected to the activation page
5. Otherwise, you're redirected to the dashboard

**Logout:**
- Click the logout button in the header
- Your session is cleared

## Navigation and Access Control

### Dynamic Navigation

The sidebar navigation automatically adjusts based on the user's role:

**All Users See:**
- Dashboard
- Patients
- Appointments
- Medical Records
- Settings

**Super Admins Additionally See:**
- User Management

### Page Access Control

Attempting to access restricted pages shows an "Access Denied" message. For example:
- Non-super admins cannot access the User Management page
- The system automatically enforces role-based restrictions

## User Status Types

### Active
- User can log in and use the system
- Full access to features based on their role

### Pending
- Account created but not yet activated
- User must complete the activation flow
- Cannot access the system until activated

### Inactive
- Temporarily disabled account
- User cannot log in
- Can be reactivated by a Super Admin

### Terminated
- Permanently disabled account
- User cannot log in
- Indicates the user is no longer with the organization

## Security Features

### Authentication
- **Email/Password** authentication via Supabase
- **Secure password** requirements (minimum 8 characters)
- **Session management** with automatic expiration
- **Password reset** functionality

### Authorization
- **Role-Based Access Control (RBAC)** enforced at the UI and database level
- **Row Level Security (RLS)** in Supabase protects data access
- **Granular permissions** based on user roles

### Data Protection
- **Encrypted passwords** stored in Supabase
- **Secure API calls** with authentication tokens
- **Protected endpoints** with proper authorization checks

## Demo Mode

For testing without Supabase setup, use these demo credentials:

| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@healthcare.com | any |
| Doctor | doctor@healthcare.com | any |
| Nurse | nurse@healthcare.com | any |
| Receptionist | receptionist@healthcare.com | any |

**Note:** Demo mode stores data in browser localStorage and resets on page refresh.

## Production Deployment

### Prerequisites
1. Supabase project configured (see [SUPABASE_SETUP.md](./SUPABASE_SETUP.md))
2. Environment variables set correctly
3. Email authentication enabled in Supabase

### Email Configuration

For user invitations to work in production:
1. Configure email templates in Supabase
2. Set up a custom email provider (optional)
3. Configure redirect URLs for activation links

### Initial Setup

1. Create the first Super Admin user manually in Supabase:
   ```sql
   UPDATE public.users
   SET role = 'super_admin', status = 'active'
   WHERE email = 'your-admin-email@example.com';
   ```

2. Log in as the Super Admin
3. Use the UI to invite additional users

## Troubleshooting

### Cannot log in
- Verify your email and password are correct
- Check if your account status is "Active"
- Contact your administrator if your account is inactive

### Cannot invite users
- Ensure you're logged in as a Super Admin
- Check that email authentication is enabled in Supabase
- Verify your Supabase configuration

### Activation link not working
- Check that the link hasn't expired
- Verify the redirect URL is configured correctly in Supabase
- Contact your administrator for a new invitation

## Future Enhancements

Planned features for the user management system:
- [ ] Profile picture upload
- [ ] Two-factor authentication (2FA)
- [ ] User activity audit logs
- [ ] Bulk user operations
- [ ] Advanced filtering and search
- [ ] User groups and teams
- [ ] Custom role creation
- [ ] Permission templates

## API Reference

### Authentication Context

The `useAuth()` hook provides:
- `user` - Current logged-in user
- `session` - Current authentication session
- `loading` - Loading state
- `signIn(email, password)` - Sign in function
- `signOut()` - Sign out function
- `updateUserProfile(data)` - Update profile function

Example usage:
```tsx
import { useAuth } from '@/contexts/AuthContext'

function MyComponent() {
  const { user, signOut } = useAuth()
  
  return (
    <div>
      <p>Welcome, {user?.full_name}</p>
      <button onClick={signOut}>Logout</button>
    </div>
  )
}
```

### Role Permissions

Check user permissions:
```tsx
import { rolePermissions } from '@/types/user'

const permissions = rolePermissions[user.role]
if (permissions.canManageUsers) {
  // Show user management features
}
```

## Support

For issues or questions:
1. Check this guide and the [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)
2. Review the console for error messages
3. Contact the development team
