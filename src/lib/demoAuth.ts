// Demo/Mock authentication service for testing without Supabase
import type { User } from '@/types/user'

const DEMO_USERS: User[] = [
  {
    id: '1',
    email: 'admin@healthcare.com',
    role: 'super_admin',
    status: 'active',
    full_name: 'Dr. Sarah Johnson',
    phone: '+1 (555) 123-4567',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    activated_at: new Date().toISOString(),
  },
  {
    id: '2',
    email: 'doctor@healthcare.com',
    role: 'doctor',
    status: 'active',
    full_name: 'Dr. Michael Chen',
    phone: '+1 (555) 234-5678',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    activated_at: new Date().toISOString(),
  },
  {
    id: '3',
    email: 'nurse@healthcare.com',
    role: 'nurse',
    status: 'active',
    full_name: 'Emily Rodriguez',
    phone: '+1 (555) 345-6789',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    activated_at: new Date().toISOString(),
  },
  {
    id: '4',
    email: 'receptionist@healthcare.com',
    role: 'receptionist',
    status: 'active',
    full_name: 'Jessica Williams',
    phone: '+1 (555) 456-7890',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    activated_at: new Date().toISOString(),
  },
]

export const demoAuth = {
  users: [...DEMO_USERS],
  currentUser: null as User | null,
  
  signIn: async (email: string, password: string): Promise<{ user: User | null; error: Error | null }> => {
    // In demo mode, accept any password
    const user = DEMO_USERS.find(u => u.email === email)
    
    if (!user) {
      return { user: null, error: new Error('Invalid email or password') }
    }

    demoAuth.currentUser = user
    localStorage.setItem('demo_user', JSON.stringify(user))
    return { user, error: null }
  },

  signOut: async (): Promise<void> => {
    demoAuth.currentUser = null
    localStorage.removeItem('demo_user')
  },

  getCurrentUser: (): User | null => {
    const stored = localStorage.getItem('demo_user')
    if (stored) {
      try {
        return JSON.parse(stored) as User
      } catch {
        return null
      }
    }
    return null
  },

  getAllUsers: (): User[] => {
    return [...demoAuth.users]
  },

  inviteUser: async (email: string, role: User['role']): Promise<{ error: Error | null }> => {
    const newUser: User = {
      id: Date.now().toString(),
      email,
      role,
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      invited_by: demoAuth.currentUser?.id,
    }
    
    demoAuth.users.push(newUser)
    return { error: null }
  },

  updateUser: async (userId: string, updates: Partial<User>): Promise<{ error: Error | null }> => {
    const index = demoAuth.users.findIndex(u => u.id === userId)
    if (index === -1) {
      return { error: new Error('User not found') }
    }

    demoAuth.users[index] = {
      ...demoAuth.users[index],
      ...updates,
      updated_at: new Date().toISOString(),
    }

    // Update current user if it's the same user
    if (demoAuth.currentUser?.id === userId) {
      demoAuth.currentUser = demoAuth.users[index]
      localStorage.setItem('demo_user', JSON.stringify(demoAuth.currentUser))
    }

    return { error: null }
  },

  deleteUser: async (userId: string): Promise<{ error: Error | null }> => {
    const index = demoAuth.users.findIndex(u => u.id === userId)
    if (index === -1) {
      return { error: new Error('User not found') }
    }

    demoAuth.users.splice(index, 1)
    return { error: null }
  },
}

// Initialize demo auth with stored user if exists
demoAuth.currentUser = demoAuth.getCurrentUser()
