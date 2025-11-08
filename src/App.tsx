import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ToastProvider } from './components/ui/toast'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { UserManagementPage } from './pages/UserManagementPage'
import { PatientsPage } from './pages/PatientsPage'
import { ActivateAccountPage } from './pages/ActivateAccountPage'
import { ProfilePage } from './pages/ProfilePage'
import { ForgotPasswordPage } from './pages/ForgotPasswordPage'
import { ResetPasswordPage } from './pages/ResetPasswordPage'
import { useState, useEffect } from 'react'

function AppContent() {
  const { user, loading, session } = useAuth()
  const [currentPath, setCurrentPath] = useState(window.location.pathname)

  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname)
    }

    window.addEventListener('popstate', handleLocationChange)
    return () => window.removeEventListener('popstate', handleLocationChange)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-neutral-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Check if user is on reset password page (special case - user has temporary session for password reset)
  if (currentPath === '/reset-password') {
    return <ResetPasswordPage />
  }

  // Check if user needs to activate account
  const needsActivation = session && user && user.status === 'pending'

  if (needsActivation && currentPath !== '/activate') {
    return <ActivateAccountPage />
  }

  // If not logged in, show login page or forgot password page
  if (!session) {
    if (currentPath === '/forgot-password') {
      return <ForgotPasswordPage />
    }
    return <LoginPage />
  }

  // Route to different pages based on path
  switch (currentPath) {
    case '/users':
      return <UserManagementPage />
    case '/patients':
      return <PatientsPage />
    case '/activate':
      return <ActivateAccountPage />
    case '/profile':
      return <ProfilePage />
    default:
      return <DashboardPage />
  }
}

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </AuthProvider>
  )
}

export default App

