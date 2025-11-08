# Troubleshooting Invitation Email Links

This guide helps resolve common issues with user invitation email links.

## Common Issue: "otp_expired" or "access_denied" Error

### Symptoms
When clicking the invitation link from email, users are redirected to the login page with an error like:
```
http://localhost:5173/activate#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired
```

### Root Causes

1. **Email Link Expiry (Most Common)**
   - Default Supabase invitation links expire after 1 hour
   - If the user clicks the link after expiration, they get `otp_expired` error

2. **Incorrect Redirect URL Configuration**
   - The redirect URL in Supabase settings doesn't match your app URL
   - Supabase blocks redirects to unauthorized URLs

3. **Link Already Used**
   - Invitation links are single-use
   - Clicking the link multiple times will fail

4. **Session Issues**
   - Browser blocking cookies/storage
   - Incognito mode with strict settings

## Solutions

### 1. Configure Email Link Expiry in Supabase

**Option A: Extend Expiry Time (Recommended)**

1. Go to Supabase Dashboard → Authentication → Settings
2. Find "Auth" section → "Confirm email" settings
3. Increase "Email link expiry" from default (3600 seconds / 1 hour) to longer duration
4. Recommended: 86400 seconds (24 hours) or 604800 seconds (7 days)
5. Click "Save"

**Option B: Use Magic Link Instead of Invite**

For longer-lasting links, consider using magic links instead of invites:
```typescript
// In edge function, use generateLink instead of inviteUserByEmail
const { data, error } = await supabaseAdmin.auth.admin.generateLink({
  type: 'magiclink',
  email: email,
  options: {
    redirectTo: `${req.headers.get('origin')}/activate`,
  }
})
```

### 2. Configure Redirect URLs in Supabase

1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Add your application URLs to "Redirect URLs":
   - Development: `http://localhost:5173/activate`
   - Production: `https://yourdomain.com/activate`
3. Also add the base URLs:
   - `http://localhost:5173/*`
   - `https://yourdomain.com/*`
4. Click "Save"

### 3. Update Edge Function Redirect URL

Ensure the edge function uses the correct redirect URL:

```typescript
// In supabase/functions/invite-user/index.ts
const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
  email,
  {
    redirectTo: `${req.headers.get('origin')}/activate`, // ✅ Dynamic based on request
    // OR use a fixed production URL:
    // redirectTo: 'https://yourdomain.com/activate', // ✅ Fixed for production
  }
)
```

### 4. Handle Expired Links Gracefully

The application now shows clear error messages:
- "The invitation link has expired. Please request a new invitation from your administrator."
- "Access denied. The invitation link may be invalid or already used."

**To resend an invitation:**
1. Super admin logs in
2. Goes to User Management
3. Finds the user with "pending" status
4. Deletes the pending user
5. Sends a new invitation

### 5. Test the Flow

**Test Invitation Flow:**

1. **As Super Admin:**
   ```
   1. Login to app
   2. Navigate to User Management
   3. Click "Invite User"
   4. Enter email: test@example.com
   5. Select role: Doctor
   6. Click "Send Invitation"
   ```

2. **Check Email:**
   - Open email inbox for test@example.com
   - Look for invitation email
   - Note: Check spam folder if not in inbox

3. **Click Link Quickly:**
   - Click the activation link in email
   - Should redirect to: `http://localhost:5173/activate`
   - Should see loading spinner, then activation form

4. **Complete Activation:**
   - Enter full name
   - Enter phone number (optional)
   - Enter password (min 8 characters)
   - Confirm password
   - Click "Activate Account"
   - Should redirect to dashboard

### 6. Debug Checklist

If issues persist, check:

- [ ] Supabase email templates configured correctly
- [ ] Email link expiry set appropriately (>1 hour)
- [ ] Redirect URLs added to Supabase settings
- [ ] Edge functions deployed with latest code
- [ ] User's email verified in Supabase auth users table
- [ ] Browser allows cookies and localStorage
- [ ] No browser extensions blocking the redirect
- [ ] CORS settings allow your domain

### 7. Monitor Edge Function Logs

Check Supabase edge function logs for errors:

```bash
# View logs for invite-user function
supabase functions logs invite-user

# Look for errors like:
# - "Profile creation error"
# - "Invalid email"
# - "User already exists"
```

### 8. Alternative Workaround: Manual Password Reset

If invitation links continue to fail:

1. Super admin invites user (creates account with pending status)
2. Super admin uses "Reset Password" on the user
3. User receives password reset email (different from invitation)
4. User clicks password reset link
5. User sets their password
6. Super admin manually activates the account (changes status to "active")

## Best Practices

1. **Quick Response**: Advise users to click invitation links within 1 hour
2. **Clear Communication**: Include expiry information in invitation emails
3. **Extended Expiry**: Set email link expiry to 24 hours minimum
4. **Monitor Logs**: Regularly check edge function logs for issues
5. **Test Flow**: Test the complete invitation flow after any configuration change

## Configuration Summary

### Required Supabase Settings

**Authentication → URL Configuration:**
```
Site URL: http://localhost:5173
Redirect URLs:
  - http://localhost:5173/activate
  - http://localhost:5173/*
  - https://yourdomain.com/activate
  - https://yourdomain.com/*
```

**Authentication → Settings → Auth:**
```
Email link expiry: 86400 seconds (24 hours)
Enable email confirmations: ON
```

**Authentication → Email Templates:**
```
Invite User template must use {{ .ConfirmationURL }}
```

## Still Having Issues?

1. Check Supabase Dashboard → Authentication → Users
   - Verify user was created
   - Check user status (should be in auth.users table)

2. Check browser console for errors
   - Open DevTools → Console
   - Look for authentication errors
   - Check Network tab for failed requests

3. Check Supabase logs
   - Go to Supabase Dashboard → Logs
   - Filter by "auth" logs
   - Look for invitation/verification errors

4. Verify environment variables
   - `VITE_SUPABASE_URL` matches your project
   - `VITE_SUPABASE_ANON_KEY` is correct

5. Clear browser cache and cookies
   - Hard refresh: Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)
   - Clear site data for localhost

## Contact Support

If none of the above resolves the issue:
- Check Supabase status: https://status.supabase.com/
- Review Supabase docs: https://supabase.com/docs/guides/auth/auth-email
- Contact Supabase support with edge function logs
