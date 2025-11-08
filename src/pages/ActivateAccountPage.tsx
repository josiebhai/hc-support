import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { ActivateAccountData } from '@/types/user'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Activity, AlertCircle, CheckCircle } from 'lucide-react'

export function ActivateAccountPage() {
  const [formData, setFormData] = useState<ActivateAccountData>({
    full_name: '',
    password: '',
    phone: '',
  })
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [verifyingToken, setVerifyingToken] = useState(true)
  const [tokenError, setTokenError] = useState('')
  const { updateUserProfile, session } = useAuth()

  useEffect(() => {
    const verifyInviteToken = async () => {
      // Check if we're coming from an invite link
      const hashParams = new URLSearchParams(window.location.hash.substring(1))
      const errorParam = hashParams.get('error')
      const errorDescription = hashParams.get('error_description')
      
      if (errorParam) {
        setTokenError(errorDescription || 'Invalid or expired invitation link')
        setVerifyingToken(false)
        return
      }

      // Check if there's a token in the URL (from email link)
      const urlParams = new URLSearchParams(window.location.search)
      const token = urlParams.get('token')
      const type = urlParams.get('type')

      if (token && type === 'invite') {
        try {
          // Verify the token and create session
          const { error } = await supabase.auth.verifyOtp({
            token_hash: token,
            type: 'invite',
          })

          if (error) {
            setTokenError('Invalid or expired invitation link. Please contact your administrator.')
            console.error('Token verification error:', error)
          }
        } catch (err) {
          setTokenError('Failed to verify invitation. Please try again.')
          console.error('Token verification exception:', err)
        }
      }
      
      setVerifyingToken(false)
    }

    verifyInviteToken()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Validate passwords match
    if (formData.password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    // Validate password strength
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long')
      setLoading(false)
      return
    }

    try {
      // Update the user's password
      const { error: passwordError } = await supabase.auth.updateUser({
        password: formData.password,
      })

      if (passwordError) throw passwordError

      // Update user profile
      const { error: profileError } = await updateUserProfile({
        full_name: formData.full_name,
        phone: formData.phone,
        status: 'active',
        activated_at: new Date().toISOString(),
      })

      if (profileError) throw profileError

      setSuccess(true)
    } catch (err) {
      setError((err as Error).message || 'Failed to activate account')
    } finally {
      setLoading(false)
    }
  }

  if (verifyingToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 p-4">
        <div className="w-full max-w-md">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center justify-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
                <p className="text-neutral-600">Verifying invitation...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (tokenError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 p-4">
        <div className="w-full max-w-md">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center justify-center py-8">
                <AlertCircle className="w-16 h-16 text-danger-600 mb-4" />
                <h2 className="text-2xl font-bold font-display text-neutral-900 mb-2">
                  Invitation Error
                </h2>
                <p className="text-neutral-600 text-center mb-6">
                  {tokenError}
                </p>
                <Button onClick={() => window.location.href = '/'}>
                  Go to Login
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 p-4">
        <div className="w-full max-w-md">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center justify-center py-8">
                <AlertCircle className="w-16 h-16 text-warning-600 mb-4" />
                <h2 className="text-2xl font-bold font-display text-neutral-900 mb-2">
                  Session Required
                </h2>
                <p className="text-neutral-600 text-center mb-6">
                  Please use the invitation link from your email to activate your account.
                </p>
                <Button onClick={() => window.location.href = '/'}>
                  Go to Login
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 p-4">
        <div className="w-full max-w-md">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center justify-center py-8">
                <CheckCircle className="w-16 h-16 text-success-600 mb-4" />
                <h2 className="text-2xl font-bold font-display text-neutral-900 mb-2">
                  Account Activated!
                </h2>
                <p className="text-neutral-600 text-center mb-6">
                  Your account has been successfully activated. You can now access the system.
                </p>
                <Button onClick={() => window.location.href = '/'}>
                  Go to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="flex items-center justify-center w-16 h-16 bg-primary-600 rounded-xl shadow-lg">
              <Activity className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold font-display text-neutral-900">
            Activate Your Account
          </h1>
          <p className="text-neutral-600 mt-2">Set up your password and profile details</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Complete Your Profile</CardTitle>
            <CardDescription>
              Provide your details to activate your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 p-3 bg-danger-50 border border-danger-200 rounded-md">
                  <AlertCircle className="w-4 h-4 text-danger-600" />
                  <p className="text-sm text-danger-700">{error}</p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name *</Label>
                <Input
                  id="full_name"
                  type="text"
                  placeholder="John Doe"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter a strong password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  disabled={loading}
                />
                <p className="text-xs text-neutral-600">
                  Must be at least 8 characters long
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm_password">Confirm Password *</Label>
                <Input
                  id="confirm_password"
                  type="password"
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? 'Activating Account...' : 'Activate Account'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <p className="text-xs text-neutral-600">
            © 2024 HealthCare Support. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  )
}
