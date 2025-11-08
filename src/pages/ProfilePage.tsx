import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/ui/toast'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Layout } from '@/components/Layout'
import { User, Lock, AlertCircle } from 'lucide-react'

export function ProfilePage() {
  const { user, updateUserProfile } = useAuth()
  const { showToast } = useToast()
  const [profileLoading, setProfileLoading] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [profileData, setProfileData] = useState({
    full_name: user?.full_name || '',
    phone: user?.phone || '',
  })
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [passwordError, setPasswordError] = useState('')

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setProfileLoading(true)

    try {
      const { error } = await updateUserProfile({
        full_name: profileData.full_name,
        phone: profileData.phone,
      })

      if (error) throw error

      showToast('success', 'Your profile has been updated successfully.')
    } catch (err) {
      showToast('error', (err as Error).message || 'Failed to update profile')
    } finally {
      setProfileLoading(false)
    }
  }

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError('')
    setPasswordLoading(true)

    // Validate passwords
    if (passwordData.newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters long')
      setPasswordLoading(false)
      return
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New passwords do not match')
      setPasswordLoading(false)
      return
    }

    try {
      // Update password
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword,
      })

      if (error) throw error

      showToast('success', 'Your password has been changed successfully.')

      // Clear form
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })
    } catch (err) {
      setPasswordError((err as Error).message || 'Failed to update password')
      showToast('error', (err as Error).message || 'Failed to update password')
    } finally {
      setPasswordLoading(false)
    }
  }

  const getRoleLabel = (role: string) => {
    return role.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
  }

  return (
    <Layout>
      <div className="max-w-4xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold font-display text-neutral-900 mb-2">
            Profile Settings
          </h1>
          <p className="text-neutral-600">
            Manage your account settings and preferences
          </p>
        </div>

        <div className="space-y-6">
          {/* Profile Information Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-primary-600" />
                <CardTitle>Profile Information</CardTitle>
              </div>
              <CardDescription>
                Update your personal information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="bg-neutral-50"
                  />
                  <p className="text-xs text-neutral-600">
                    Email cannot be changed
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Input
                    id="role"
                    type="text"
                    value={user?.role ? getRoleLabel(user.role) : ''}
                    disabled
                    className="bg-neutral-50"
                  />
                  <p className="text-xs text-neutral-600">
                    Role is assigned by your administrator
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input
                    id="full_name"
                    type="text"
                    placeholder="John Doe"
                    value={profileData.full_name}
                    onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                    disabled={profileLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                    value={profileData.phone}
                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                    disabled={profileLoading}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={profileLoading}
                >
                  {profileLoading ? 'Updating...' : 'Update Profile'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Change Password Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-primary-600" />
                <CardTitle>Change Password</CardTitle>
              </div>
              <CardDescription>
                Update your password to keep your account secure
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordUpdate} className="space-y-4">
                {passwordError && (
                  <div className="flex items-center gap-2 p-3 bg-danger-50 border border-danger-200 rounded-md">
                    <AlertCircle className="w-4 h-4 text-danger-600" />
                    <p className="text-sm text-danger-700">{passwordError}</p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="new_password">New Password</Label>
                  <Input
                    id="new_password"
                    type="password"
                    placeholder="Enter new password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    required
                    disabled={passwordLoading}
                  />
                  <p className="text-xs text-neutral-600">
                    Must be at least 8 characters long
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm_password">Confirm New Password</Label>
                  <Input
                    id="confirm_password"
                    type="password"
                    placeholder="Re-enter new password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    required
                    disabled={passwordLoading}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={passwordLoading}
                >
                  {passwordLoading ? 'Updating Password...' : 'Update Password'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Account Information Card */}
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>
                View your account details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between py-2 border-b border-neutral-200">
                  <span className="text-neutral-600">Account Status</span>
                  <span className="font-medium text-neutral-900 capitalize">
                    {user?.status || 'Unknown'}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-neutral-200">
                  <span className="text-neutral-600">Account Created</span>
                  <span className="font-medium text-neutral-900">
                    {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-neutral-600">Last Updated</span>
                  <span className="font-medium text-neutral-900">
                    {user?.updated_at ? new Date(user.updated_at).toLocaleDateString() : 'Unknown'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  )
}
