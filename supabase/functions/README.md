# Supabase Edge Functions

This directory contains Supabase Edge Functions for secure admin operations that require the service role key.

## Functions

### 1. invite-user
Invites a new user to the system by email.

**Endpoint:** `/functions/v1/invite-user`

**Method:** POST

**Authorization:** Requires authenticated user with `super_admin` role

**Request Body:**
```json
{
  "email": "user@example.com",
  "role": "doctor" | "nurse" | "receptionist" | "super_admin"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User invited successfully",
  "userId": "uuid"
}
```

### 2. reset-user-password
Sends a password reset email to a user.

**Endpoint:** `/functions/v1/reset-user-password`

**Method:** POST

**Authorization:** Requires authenticated user with `super_admin` role

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password reset email sent successfully"
}
```

### 3. delete-user
Deletes a user from the system (both auth and profile).

**Endpoint:** `/functions/v1/delete-user`

**Method:** POST

**Authorization:** Requires authenticated user with `super_admin` role

**Request Body:**
```json
{
  "userId": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

## Deployment

### Prerequisites
1. Supabase CLI installed: `npm install -g supabase`
2. Supabase project created
3. Service role key configured

### Deploy Functions

1. Link your Supabase project:
```bash
supabase link --project-ref your-project-ref
```

2. Deploy all functions:
```bash
supabase functions deploy invite-user
supabase functions deploy reset-user-password
supabase functions deploy delete-user
```

Or deploy all at once:
```bash
supabase functions deploy
```

### Set Environment Variables

Edge functions need access to these environment variables (automatically available in Supabase):
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Your anon/public key
- `SUPABASE_SERVICE_ROLE_KEY` - Your service role key (automatic, do not set manually)

## Local Development

### Start Supabase locally:
```bash
supabase start
```

### Serve functions locally:
```bash
supabase functions serve
```

This will start all functions on `http://localhost:54321/functions/v1/`

### Test functions locally:
```bash
# Get auth token first
TOKEN="your-jwt-token"

# Test invite-user
curl -i --location --request POST 'http://localhost:54321/functions/v1/invite-user' \
  --header "Authorization: Bearer $TOKEN" \
  --header 'Content-Type: application/json' \
  --data '{"email":"test@example.com","role":"doctor"}'
```

## Security

- All functions verify that the requesting user is authenticated
- All functions verify that the requesting user has the `super_admin` role
- Service role key is only accessible server-side in edge functions
- CORS is configured to allow requests from your frontend

## Error Handling

All functions return consistent error responses:

```json
{
  "success": false,
  "error": "Error message here"
}
```

HTTP Status Codes:
- `200` - Success
- `400` - Bad request (validation error)
- `401` - Unauthorized (not authenticated)
- `403` - Forbidden (not authorized/not super admin)
- `500` - Internal server error

## Client Usage

Use the edge function helper in your React app:

```typescript
import { inviteUser, resetUserPassword, deleteUser } from '@/lib/edgeFunctions'

// Invite a user
const result = await inviteUser({
  email: 'user@example.com',
  role: 'doctor'
})

if (result.success) {
  console.log('User invited!')
}

// Reset password
const resetResult = await resetUserPassword('user@example.com')

// Delete user
const deleteResult = await deleteUser('user-id')
```

## Troubleshooting

### Function not found
- Make sure functions are deployed: `supabase functions list`
- Check function name matches exactly

### Unauthorized errors
- Verify you're passing the auth token in the Authorization header
- Check that your session is valid

### Forbidden errors
- Verify your user has `super_admin` role in the database
- Check the users table has the correct role set

### Service role key errors
- Service role key is automatically available in deployed functions
- For local development, make sure `supabase start` has been run

## Further Reading

- [Supabase Edge Functions Documentation](https://supabase.com/docs/guides/functions)
- [Deno Deploy Documentation](https://deno.com/deploy/docs)
