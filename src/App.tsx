import { AuthProvider, useAuth } from './contexts/AuthContext'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { UserManagementPage } from './pages/UserManagementPage'
import { ActivateAccountPage } from './pages/ActivateAccountPage'
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

  // Check if user needs to activate account
  const needsActivation = session && user && user.status === 'pending'
  
  if (needsActivation && currentPath !== '/activate') {
    return <ActivateAccountPage />
  }

  // If not logged in, show login page
  if (!session) {
    return <LoginPage />
  }

  // Route to different pages based on path
  switch (currentPath) {
    case '/users':
      return <UserManagementPage />
    case '/activate':
      return <ActivateAccountPage />
    default:
      return <DashboardPage />
  }
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App

