import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { User, UserRole, InviteUserData } from '@/types/user'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { UserPlus, Mail, Shield, Users, AlertCircle, CheckCircle, Trash2, RefreshCw } from 'lucide-react'

export function UserManagementPage() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showInviteDialog, setShowInviteDialog] = useState(false)
  const [inviteData, setInviteData] = useState<InviteUserData>({
    email: '',
    role: 'doctor',
  })
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteSuccess, setInviteSuccess] = useState(false)
  const [inviteError, setInviteError] = useState('')

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      setUsers(data as User[] || [])
    } catch (error) {
      console.error('Error loading users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInviteUser = async () => {
    setInviteLoading(true)
    setInviteError('')
    setInviteSuccess(false)

    try {
      // In a real implementation, this would call Supabase Auth Admin API
      // For now, we'll simulate the invite
      const { error } = await supabase.auth.admin.inviteUserByEmail(inviteData.email)

      if (error) {
        console.error('Invite error:', error)
        throw error
      }

      // Create user profile with pending status
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          email: inviteData.email,
          role: inviteData.role,
          status: 'pending',
          invited_by: currentUser?.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })

      if (profileError) throw profileError

      setInviteSuccess(true)
      setTimeout(() => {
        setShowInviteDialog(false)
        setInviteData({ email: '', role: 'doctor' })
        setInviteSuccess(false)
        loadUsers()
      }, 2000)
    } catch (error) {
      setInviteError((error as Error).message || 'Failed to invite user')
    } finally {
      setInviteLoading(false)
    }
  }

  const handleUpdateUserStatus = async (userId: string, status: User['status']) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', userId)

      if (error) throw error

      loadUsers()
    } catch (error) {
      console.error('Error updating user status:', error)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return

    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId)

      if (error) throw error

      loadUsers()
    } catch (error) {
      console.error('Error deleting user:', error)
    }
  }

  const handleResetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email)

      if (error) throw error

      alert('Password reset email sent successfully')
    } catch (err) {
      console.error('Password reset error:', err)
      alert('Failed to send password reset email')
    }
  }

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'super_admin':
        return 'destructive'
      case 'doctor':
        return 'default'
      case 'nurse':
        return 'secondary'
      case 'receptionist':
        return 'warning'
      default:
        return 'default'
    }
  }

  const getStatusBadgeColor = (status: User['status']) => {
    switch (status) {
      case 'active':
        return 'success'
      case 'pending':
        return 'warning'
      case 'inactive':
        return 'secondary'
      case 'terminated':
        return 'destructive'
      default:
        return 'default'
    }
  }

  if (currentUser?.role !== 'super_admin') {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-danger-600" />
              Access Denied
            </CardTitle>
            <CardDescription>
              You don't have permission to access this page. Only Super Admins can manage users.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold font-display text-neutral-900">User Management</h2>
          <p className="text-neutral-600 mt-1">Manage users, roles, and permissions</p>
        </div>
        <Button onClick={() => setShowInviteDialog(true)}>
          <UserPlus className="w-4 h-4 mr-2" />
          Invite User
        </Button>
      </div>

      {loading ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-neutral-600">Loading users...</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              All Users ({users.length})
            </CardTitle>
            <CardDescription>View and manage all user accounts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                        <span className="text-primary-700 font-semibold text-sm">
                          {user.full_name?.split(' ').map(n => n[0]).join('') || user.email[0].toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-neutral-900">
                          {user.full_name || 'No name set'}
                        </p>
                        <p className="text-sm text-neutral-600">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-13">
                      <Badge variant={getRoleBadgeColor(user.role)}>
                        {user.role.replace('_', ' ')}
                      </Badge>
                      <Badge variant={getStatusBadgeColor(user.status)}>
                        {user.status}
                      </Badge>
                      {user.phone && (
                        <span className="text-xs text-neutral-600">{user.phone}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {user.status === 'active' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleUpdateUserStatus(user.id, 'inactive')}
                      >
                        Deactivate
                      </Button>
                    )}
                    {user.status === 'inactive' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleUpdateUserStatus(user.id, 'active')}
                      >
                        Activate
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleResetPassword(user.email)}
                    >
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteUser(user.id)}
                    >
                      <Trash2 className="w-4 h-4 text-danger-600" />
                    </Button>
                  </div>
                </div>
              ))}
              {users.length === 0 && (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
                  <p className="text-neutral-600">No users found</p>
                  <p className="text-sm text-neutral-500 mt-1">
                    Click "Invite User" to add your first user
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Invite New User
            </DialogTitle>
            <DialogDescription>
              Send an email invitation to a new user. They will receive a link to activate their account.
            </DialogDescription>
          </DialogHeader>

          {inviteSuccess ? (
            <div className="flex flex-col items-center justify-center py-8">
              <CheckCircle className="w-16 h-16 text-success-600 mb-4" />
              <p className="text-lg font-medium text-neutral-900">Invitation Sent!</p>
              <p className="text-sm text-neutral-600 mt-2">
                The user will receive an email with activation instructions.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {inviteError && (
                <div className="flex items-center gap-2 p-3 bg-danger-50 border border-danger-200 rounded-md">
                  <AlertCircle className="w-4 h-4 text-danger-600" />
                  <p className="text-sm text-danger-700">{inviteError}</p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="invite-email">Email Address</Label>
                <Input
                  id="invite-email"
                  type="email"
                  placeholder="user@example.com"
                  value={inviteData.email}
                  onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
                  disabled={inviteLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="invite-role">Role</Label>
                <Select
                  id="invite-role"
                  value={inviteData.role}
                  onChange={(e) => setInviteData({ ...inviteData, role: e.target.value as UserRole })}
                  disabled={inviteLoading}
                >
                  <option value="doctor">Doctor</option>
                  <option value="nurse">Nurse</option>
                  <option value="receptionist">Receptionist</option>
                  <option value="super_admin">Super Admin</option>
                </Select>
              </div>

              <DialogFooter>
                <Button
                  variant="ghost"
                  onClick={() => setShowInviteDialog(false)}
                  disabled={inviteLoading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleInviteUser}
                  disabled={inviteLoading || !inviteData.email}
                >
                  {inviteLoading ? 'Sending...' : 'Send Invitation'}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
