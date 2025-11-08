import { Layout } from '@/components/Layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Activity, Users, UserCheck, AlertCircle, TrendingUp, Calendar } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useEffect, useState } from 'react'

interface StatCardProps {
  title: string
  value: string
  change: string
  icon: React.ComponentType<{ className?: string }>
  trend?: 'up' | 'down'
}

function StatCard({ title, value, change, icon: Icon, trend = 'up' }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-neutral-600">{title}</CardTitle>
        <Icon className="h-4 w-4 text-neutral-500" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold font-display">{value}</div>
        <p className={`text-xs flex items-center mt-1 ${
          trend === 'up' ? 'text-success-600' : 'text-danger-600'
        }`}>
          <TrendingUp className={`h-3 w-3 mr-1 ${trend === 'down' ? 'rotate-180' : ''}`} />
          {change}
        </p>
      </CardContent>
    </Card>
  )
}

interface RecentPatient {
  id: number
  name: string
  condition: string
  status: 'stable' | 'critical' | 'recovering'
  time: string
}

const recentPatients: RecentPatient[] = [
  { id: 1, name: 'John Doe', condition: 'Hypertension', status: 'stable', time: '2 hours ago' },
  { id: 2, name: 'Jane Smith', condition: 'Diabetes Type 2', status: 'stable', time: '3 hours ago' },
  { id: 3, name: 'Robert Johnson', condition: 'Post Surgery', status: 'recovering', time: '5 hours ago' },
  { id: 4, name: 'Emily Davis', condition: 'Cardiac Arrest', status: 'critical', time: '6 hours ago' },
]

const getStatusColor = (status: RecentPatient['status']) => {
  switch (status) {
    case 'stable':
      return 'success'
    case 'critical':
      return 'destructive'
    case 'recovering':
      return 'warning'
    default:
      return 'default'
  }
}

export function DashboardPage() {
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking')

  useEffect(() => {
    // Test Supabase connection
    const testConnection = async () => {
      try {
        const { error } = await supabase.from('_test_').select('*').limit(1)
        // Even if table doesn't exist, if we get a proper error response, connection works
        if (error && error.message.includes('relation')) {
          setConnectionStatus('connected')
        } else if (!error) {
          setConnectionStatus('connected')
        } else {
          setConnectionStatus('disconnected')
        }
      } catch {
        setConnectionStatus('disconnected')
      }
    }

    testConnection()
  }, [])

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold font-display text-neutral-900">Dashboard</h2>
            <p className="text-neutral-600 mt-1">Welcome back, monitor your patients and appointments</p>
          </div>
          <div className="flex items-center space-x-3">
            <Badge variant={connectionStatus === 'connected' ? 'success' : connectionStatus === 'disconnected' ? 'destructive' : 'secondary'}>
              {connectionStatus === 'checking' ? 'Checking Supabase...' : connectionStatus === 'connected' ? '✓ Supabase Connected' : '✗ Supabase Disconnected'}
            </Badge>
            <Button>
              <Calendar className="w-4 h-4 mr-2" />
              New Appointment
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Patients"
            value="2,847"
            change="+12% from last month"
            icon={Users}
            trend="up"
          />
          <StatCard
            title="Active Cases"
            value="423"
            change="+8% from last week"
            icon={Activity}
            trend="up"
          />
          <StatCard
            title="Appointments Today"
            value="18"
            change="-3 from yesterday"
            icon={Calendar}
            trend="down"
          />
          <StatCard
            title="Staff on Duty"
            value="47"
            change="+5 from yesterday"
            icon={UserCheck}
            trend="up"
          />
        </div>

        {/* Recent Patients Section */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Patient Updates</CardTitle>
              <CardDescription>Latest patient status changes and admissions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentPatients.map((patient) => (
                  <div key={patient.id} className="flex items-center justify-between p-3 rounded-lg bg-neutral-50 hover:bg-neutral-100 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <p className="font-medium text-neutral-900">{patient.name}</p>
                        <Badge variant={getStatusColor(patient.status)} className="text-xs">
                          {patient.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-neutral-600 mt-1">{patient.condition}</p>
                      <p className="text-xs text-neutral-500 mt-1">{patient.time}</p>
                    </div>
                    <Button variant="ghost" size="sm">View</Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Frequently used functions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                <Button className="w-full justify-start" variant="outline">
                  <Users className="w-4 h-4 mr-2" />
                  Add New Patient
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Calendar className="w-4 h-4 mr-2" />
                  Schedule Appointment
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Activity className="w-4 h-4 mr-2" />
                  View Medical Records
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Emergency Alert
                </Button>
              </div>

              <div className="mt-6 p-4 bg-primary-50 border border-primary-200 rounded-lg">
                <h4 className="font-semibold text-primary-900 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Supabase Integration
                </h4>
                <p className="text-sm text-primary-800 mt-2">
                  This app is integrated with Supabase. Configure your environment variables to enable database features:
                </p>
                <ul className="text-xs text-primary-700 mt-2 space-y-1 list-disc list-inside">
                  <li>VITE_SUPABASE_URL</li>
                  <li>VITE_SUPABASE_ANON_KEY</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  )
}
