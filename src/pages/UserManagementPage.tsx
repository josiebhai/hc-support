import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/ui/toast'
import { inviteUser, resetUserPassword, deleteUser as deleteUserEdgeFunction } from '@/lib/edgeFunctions'
import type { User, UserRole, InviteUserData } from '@/types/user'
import { Layout } from '@/components/Layout'
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
import { UserPlus, Mail, Shield, Users, AlertCircle, CheckCircle, Trash2, RefreshCw, Edit } from 'lucide-react'

export function UserManagementPage() {
  const { user: currentUser } = useAuth()
  const { showToast } = useToast()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showInviteDialog, setShowInviteDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showRoleDialog, setShowRoleDialog] = useState(false)
  const [userToDelete, setUserToDelete] = useState<string | null>(null)
  const [userToEditRole, setUserToEditRole] = useState<User | null>(null)
  const [newRole, setNewRole] = useState<UserRole>('doctor')
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
      // Call edge function to invite user
      // This uses the service role key on the server side
      const result = await inviteUser({
        email: inviteData.email,
        role: inviteData.role,
      })

      if (!result.success) {
        throw new Error(result.error || 'Failed to invite user')
      }

      setInviteSuccess(true)
      showToast('success', 'User invited successfully!')
      setTimeout(() => {
        setShowInviteDialog(false)
        setInviteData({ email: '', role: 'doctor' })
        setInviteSuccess(false)
        loadUsers()
      }, 2000)
    } catch (error) {
      const errorMessage = (error as Error).message || 'Failed to invite user'
      setInviteError(errorMessage)
      showToast('error', errorMessage)
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
    setUserToDelete(userId)
    setShowDeleteDialog(true)
  }

  const confirmDeleteUser = async () => {
    if (!userToDelete) return

    try {
      // Call edge function to delete user
      const result = await deleteUserEdgeFunction(userToDelete)

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete user')
      }

      showToast('success', 'User deleted successfully')
      loadUsers()
    } catch (error) {
      showToast('error', (error as Error).message || 'Failed to delete user')
      console.error('Error deleting user:', error)
    } finally {
      setShowDeleteDialog(false)
      setUserToDelete(null)
    }
  }

  const handleResetPassword = async (email: string) => {
    try {
      // Call edge function to reset password
      const result = await resetUserPassword(email)

      if (!result.success) {
        throw new Error(result.error || 'Failed to send password reset email')
      }

      showToast('success', 'Password reset email sent successfully')
    } catch (err) {
      console.error('Password reset error:', err)
      showToast('error', (err as Error).message || 'Failed to send password reset email')
    }
  }

  const handleChangeRole = (user: User) => {
    setUserToEditRole(user)
    setNewRole(user.role)
    setShowRoleDialog(true)
  }

  const confirmRoleChange = async () => {
    if (!userToEditRole) return

    try {
      const { error } = await supabase
        .from('users')
        .update({ 
          role: newRole,
          updated_at: new Date().toISOString() 
        })
        .eq('id', userToEditRole.id)

      if (error) throw error

      showToast('success', `Role updated to ${newRole.replace('_', ' ')}`)
      loadUsers()
    } catch (error) {
      showToast('error', (error as Error).message || 'Failed to update role')
      console.error('Error updating role:', error)
    } finally {
      setShowRoleDialog(false)
      setUserToEditRole(null)
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
      <Layout>
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
      </Layout>
    )
  }

  return (
    <Layout>
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
                    <div className="flex items-center gap-2 ml-12">
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
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleChangeRole(user)}
                      title="Change role"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
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
                      title="Reset password"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteUser(user.id)}
                      title="Delete user"
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

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-danger-600" />
              Delete User
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this user? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteUser}
            >
              Delete User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary-600" />
              Change User Role
            </DialogTitle>
            <DialogDescription>
              Update the role for {userToEditRole?.full_name || userToEditRole?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="role-select">New Role</Label>
              <Select
                id="role-select"
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as UserRole)}
              >
                <option value="doctor">Doctor</option>
                <option value="nurse">Nurse</option>
                <option value="receptionist">Receptionist</option>
                <option value="super_admin">Super Admin</option>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setShowRoleDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmRoleChange}
            >
              Update Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </Layout>
  )
}
