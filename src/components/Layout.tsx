import { Activity, Users, Calendar, FileText, Settings, LogOut, Shield, User as UserIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from './ui/button'

interface HeaderProps {
  className?: string
}

export function Header({ className }: HeaderProps) {
  const { user, signOut } = useAuth()

  const getUserInitials = () => {
    if (user?.full_name) {
      return user.full_name.split(' ').map(n => n[0]).join('').toUpperCase()
    }
    return user?.email?.[0]?.toUpperCase() || 'U'
  }

  const getRoleLabel = (role: string) => {
    return role.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
  }

  return (
    <header className={cn("bg-white border-b border-neutral-200 shadow-sm", className)}>
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 bg-primary-600 rounded-lg">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold font-display text-neutral-900">
                HealthCare Support
              </h1>
              <p className="text-sm text-neutral-600">Patient Management System</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm font-medium text-neutral-900">
                {user?.full_name || user?.email || 'User'}
              </p>
              <p className="text-xs text-neutral-600">
                {user?.role ? getRoleLabel(user.role) : 'User'}
              </p>
            </div>
            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
              <span className="text-primary-700 font-semibold text-sm">{getUserInitials()}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}

interface NavItem {
  icon: React.ComponentType<{ className?: string }>
  label: string
  path: string
  active?: boolean
  adminOnly?: boolean
}

const navItems: NavItem[] = [
  { icon: Activity, label: 'Dashboard', path: '/', active: true },
  { icon: Users, label: 'Patients', path: '/patients', active: false },
  { icon: Calendar, label: 'Appointments', path: '/appointments', active: false },
  { icon: FileText, label: 'Medical Records', path: '/records', active: false },
  { icon: Shield, label: 'User Management', path: '/users', active: false, adminOnly: true },
  { icon: UserIcon, label: 'Profile', path: '/profile', active: false },
  { icon: Settings, label: 'Settings', path: '/settings', active: false },
]

export function Sidebar() {
  const { user } = useAuth()

  const filteredNavItems = navItems.filter(item => {
    if (item.adminOnly) {
      return user?.role === 'super_admin'
    }
    return true
  })

  const handleNavClick = (path: string) => {
    window.location.href = path
  }

  return (
    <aside className="w-64 bg-white border-r border-neutral-200 shadow-sm">
      <nav className="p-4 space-y-2">
        {filteredNavItems.map((item) => {
          const Icon = item.icon
          return (
            <button
              key={item.label}
              onClick={() => handleNavClick(item.path)}
              className={cn(
                "w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors text-left",
                item.active
                  ? "bg-primary-50 text-primary-700 font-medium"
                  : "text-neutral-600 hover:bg-neutral-50"
              )}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </button>
          )
        })}
      </nav>
    </aside>
  )
}

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="h-screen flex flex-col">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-neutral-50 custom-scrollbar">
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
