import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.80.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing authorization header')
    }

    // Create Supabase client with service role key for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Create regular Supabase client to verify the requesting user
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    )

    // Verify the user is authenticated
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) {
      throw new Error('Unauthorized')
    }

    // Check if user is super admin
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !userProfile || userProfile.role !== 'super_admin') {
      throw new Error('Forbidden: Only super admins can invite users')
    }

    // Get request body
    const { email, role } = await req.json()

    if (!email || !role) {
      throw new Error('Missing required fields: email and role')
    }

    // Validate role
    const validRoles = ['super_admin', 'doctor', 'nurse', 'receptionist']
    if (!validRoles.includes(role)) {
      throw new Error('Invalid role')
    }

    // Invite user using admin API
    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      email,
      {
        redirectTo: `${req.headers.get('origin')}/activate`,
      }
    )

    if (inviteError) {
      throw inviteError
    }

    // Create user profile with pending status
    const { error: profileCreateError } = await supabaseAdmin
      .from('users')
      .insert({
        id: inviteData.user.id,
        email: email,
        role: role,
        status: 'pending',
        invited_by: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

    if (profileCreateError) {
      // If profile creation fails, we should clean up the auth user
      // but for now we'll just throw the error
      console.error('Profile creation error:', profileCreateError)
      throw profileCreateError
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'User invited successfully',
        userId: inviteData.user.id 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: error.message === 'Unauthorized' ? 401 : error.message === 'Forbidden: Only super admins can invite users' ? 403 : 400,
      },
    )
  }
})
