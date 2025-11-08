export type UserRole = 'super_admin' | 'doctor' | 'nurse' | 'receptionist'

export type UserStatus = 'active' | 'inactive' | 'pending' | 'terminated'

export interface User {
  id: string
  email: string
  role: UserRole
  status: UserStatus
  full_name?: string
  profile_picture?: string
  phone?: string
  created_at: string
  updated_at: string
  invited_by?: string
  activated_at?: string
}

export interface UserPermissions {
  canViewMedicalChart: boolean
  canEditMedicalChart: boolean
  canManagePatientProfiles: boolean
  canManageUsers: boolean
  canLoginAsOthers: boolean
  canDeleteUsers: boolean
  canResetPasswords: boolean
}

export const rolePermissions: Record<UserRole, UserPermissions> = {
  super_admin: {
    canViewMedicalChart: true,
    canEditMedicalChart: true,
    canManagePatientProfiles: true,
    canManageUsers: true,
    canLoginAsOthers: true,
    canDeleteUsers: true,
    canResetPasswords: true,
  },
  doctor: {
    canViewMedicalChart: true,
    canEditMedicalChart: true,
    canManagePatientProfiles: false,
    canManageUsers: false,
    canLoginAsOthers: false,
    canDeleteUsers: false,
    canResetPasswords: false,
  },
  nurse: {
    canViewMedicalChart: true,
    canEditMedicalChart: true,
    canManagePatientProfiles: false,
    canManageUsers: false,
    canLoginAsOthers: false,
    canDeleteUsers: false,
    canResetPasswords: false,
  },
  receptionist: {
    canViewMedicalChart: true,
    canEditMedicalChart: false,
    canManagePatientProfiles: true,
    canManageUsers: false,
    canLoginAsOthers: false,
    canDeleteUsers: false,
    canResetPasswords: false,
  },
}

export interface InviteUserData {
  email: string
  role: UserRole
}

export interface ActivateAccountData {
  full_name: string
  password: string
  phone?: string
  profile_picture?: string
}
