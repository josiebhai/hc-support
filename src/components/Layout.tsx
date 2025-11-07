import { Activity, Users, Calendar, FileText, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

interface HeaderProps {
  className?: string
}

export function Header({ className }: HeaderProps) {
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
              <p className="text-sm font-medium text-neutral-900">Dr. Sarah Johnson</p>
              <p className="text-xs text-neutral-600">Super Admin</p>
            </div>
            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
              <span className="text-primary-700 font-semibold text-sm">SJ</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

interface NavItem {
  icon: React.ComponentType<{ className?: string }>
  label: string
  active?: boolean
}

const navItems: NavItem[] = [
  { icon: Activity, label: 'Dashboard', active: true },
  { icon: Users, label: 'Patients', active: false },
  { icon: Calendar, label: 'Appointments', active: false },
  { icon: FileText, label: 'Medical Records', active: false },
  { icon: Settings, label: 'Settings', active: false },
]

export function Sidebar() {
  return (
    <aside className="w-64 bg-white border-r border-neutral-200 shadow-sm">
      <nav className="p-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <button
              key={item.label}
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
