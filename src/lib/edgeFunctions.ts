import { supabase } from './supabase'

/**
 * Service for calling Supabase Edge Functions for admin operations.
 * These functions use the service role key on the server side.
 */

export interface InviteUserData {
  email: string
  role: 'super_admin' | 'doctor' | 'nurse' | 'receptionist'
}

export interface EdgeFunctionResponse<T = unknown> {
  success: boolean
  message?: string
  error?: string
  data?: T
}

/**
 * Invite a new user via edge function
 */
export async function inviteUser(data: InviteUserData): Promise<EdgeFunctionResponse<{ userId: string }>> {
  try {
    const { data: responseData, error } = await supabase.functions.invoke('invite-user', {
      body: data,
    })

    if (error) {
      console.error('Edge function error:', error)
      return {
        success: false,
        error: error.message || 'Failed to invite user',
      }
    }

    return responseData
  } catch (err) {
    console.error('Invite user error:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to invite user',
    }
  }
}

/**
 * Reset a user's password via edge function
 */
export async function resetUserPassword(email: string): Promise<EdgeFunctionResponse> {
  try {
    const { data: responseData, error } = await supabase.functions.invoke('reset-user-password', {
      body: { email },
    })

    if (error) {
      console.error('Edge function error:', error)
      return {
        success: false,
        error: error.message || 'Failed to reset password',
      }
    }

    return responseData
  } catch (err) {
    console.error('Reset password error:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to reset password',
    }
  }
}

/**
 * Delete a user via edge function
 */
export async function deleteUser(userId: string): Promise<EdgeFunctionResponse> {
  try {
    const { data: responseData, error } = await supabase.functions.invoke('delete-user', {
      body: { userId },
    })

    if (error) {
      console.error('Edge function error:', error)
      return {
        success: false,
        error: error.message || 'Failed to delete user',
      }
    }

    return responseData
  } catch (err) {
    console.error('Delete user error:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to delete user',
    }
  }
}
