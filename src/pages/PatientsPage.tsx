import { useState, useEffect, useCallback } from 'react'
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
import { Users, UserPlus, Search, Phone, MapPin } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/ui/toast'
import type { Patient, CreatePatientData } from '@/types/patient'
import { rolePermissions } from '@/types/user'

// Import constants
import { INDIAN_STATES as states, LANGUAGES as languages } from '@/types/patient'

export function PatientsPage() {
  const { user } = useAuth()
  const { showToast } = useToast()
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [submitting, setSubmitting] = useState(false)
  
  const [formData, setFormData] = useState<CreatePatientData>({
    full_name: '',
    gender: 'male',
    date_of_birth: '',
    language_preference: 'Hindi',
    marital_status: 'single',
    aadhar_id: '',
    mobile_number: '',
    village: '',
    state: 'Delhi',
  })

  const userPermissions = user?.role ? rolePermissions[user.role] : null
  const canManagePatients = userPermissions?.canManagePatientProfiles

  const loadPatients = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        // If table doesn't exist, just set empty array
        if (error.code === '42P01') {
          console.warn('Patients table does not exist yet')
          setPatients([])
        } else {
          throw error
        }
      } else {
        setPatients(data as Patient[] || [])
      }
    } catch (error) {
      console.error('Error loading patients:', error)
      showToast('error', 'Failed to load patients')
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => {
    loadPatients()
  }, [loadPatients])

  const generatePatientId = () => {
    // Generate patient ID in format P001, P002, etc.
    const maxId = patients.reduce((max, patient) => {
      const num = parseInt(patient.patient_id.replace('P', ''))
      return num > max ? num : max
    }, 0)
    return `P${String(maxId + 1).padStart(3, '0')}`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!canManagePatients) {
      showToast('error', 'You do not have permission to add patients')
      return
    }

    setSubmitting(true)

    try {
      const patientId = generatePatientId()
      const patientData = {
        ...formData,
        patient_id: patientId,
        created_by: user?.id,
      }

      const { error } = await supabase
        .from('patients')
        .insert([patientData])

      if (error) throw error

      showToast('success', 'Patient added successfully!')
      setShowAddDialog(false)
      resetForm()
      loadPatients()
    } catch (error) {
      console.error('Error adding patient:', error)
      showToast('error', 'Failed to add patient. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    setFormData({
      full_name: '',
      gender: 'male',
      date_of_birth: '',
      language_preference: 'Hindi',
      marital_status: 'single',
      aadhar_id: '',
      mobile_number: '',
      village: '',
      state: 'Delhi',
    })
  }

  const handleInputChange = (field: keyof CreatePatientData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const filteredPatients = patients.filter(patient =>
    patient.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.patient_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.mobile_number.includes(searchTerm)
  )

  const getGenderBadge = (gender: string) => {
    return gender.charAt(0).toUpperCase() + gender.slice(1)
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-neutral-600">Loading patients...</p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold font-display text-neutral-900">Patients</h2>
            <p className="text-neutral-600 mt-1">Manage patient profiles and information</p>
          </div>
          {canManagePatients && (
            <Button onClick={() => setShowAddDialog(true)}>
              <UserPlus className="w-4 h-4 mr-2" />
              Add New Patient
            </Button>
          )}
        </div>

        {/* Search Bar */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Search className="w-5 h-5 text-neutral-400" />
              <Input
                placeholder="Search by name, patient ID, or mobile number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
            </div>
          </CardContent>
        </Card>

        {/* Patients List */}
        <Card>
          <CardHeader>
            <CardTitle>Patient Records</CardTitle>
            <CardDescription>
              {filteredPatients.length} patient{filteredPatients.length !== 1 ? 's' : ''} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredPatients.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
                <p className="text-neutral-600">No patients found</p>
                {canManagePatients && (
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => setShowAddDialog(true)}
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add Your First Patient
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredPatients.map((patient) => (
                  <div
                    key={patient.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-neutral-50 hover:bg-neutral-100 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-semibold text-neutral-900">{patient.full_name}</h3>
                        <Badge variant="secondary" className="text-xs">
                          {patient.patient_id}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {getGenderBadge(patient.gender)}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm text-neutral-600">
                        <div className="flex items-center space-x-2">
                          <Phone className="w-4 h-4" />
                          <span>{patient.mobile_number}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <MapPin className="w-4 h-4" />
                          <span>{patient.village}, {patient.state}</span>
                        </div>
                        <div>
                          <span className="font-medium">DOB:</span> {new Date(patient.date_of_birth).toLocaleDateString()}
                        </div>
                        <div>
                          <span className="font-medium">Language:</span> {patient.language_preference}
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">View Details</Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add Patient Dialog */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Patient</DialogTitle>
              <DialogDescription>
                Enter patient information to create a new profile
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4">
                {/* Full Name */}
                <div className="space-y-2">
                  <Label htmlFor="full_name">
                    Full Name <span className="text-danger-600">*</span>
                  </Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => handleInputChange('full_name', e.target.value)}
                    placeholder="Enter patient's full name"
                    required
                  />
                </div>

                {/* Gender and DOB */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="gender">
                      Gender <span className="text-danger-600">*</span>
                    </Label>
                    <Select
                      id="gender"
                      value={formData.gender}
                      onChange={(e) => handleInputChange('gender', e.target.value as CreatePatientData['gender'])}
                      required
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="date_of_birth">
                      Date of Birth <span className="text-danger-600">*</span>
                    </Label>
                    <Input
                      id="date_of_birth"
                      type="date"
                      value={formData.date_of_birth}
                      onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Language and Marital Status */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="language_preference">
                      Language Preference <span className="text-danger-600">*</span>
                    </Label>
                    <Select
                      id="language_preference"
                      value={formData.language_preference}
                      onChange={(e) => handleInputChange('language_preference', e.target.value)}
                      required
                    >
                      {languages.map((lang) => (
                        <option key={lang} value={lang}>
                          {lang}
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="marital_status">
                      Marital Status <span className="text-danger-600">*</span>
                    </Label>
                    <Select
                      id="marital_status"
                      value={formData.marital_status}
                      onChange={(e) => handleInputChange('marital_status', e.target.value as CreatePatientData['marital_status'])}
                      required
                    >
                      <option value="single">Single</option>
                      <option value="married">Married</option>
                      <option value="divorced">Divorced</option>
                      <option value="widowed">Widowed</option>
                    </Select>
                  </div>
                </div>

                {/* Aadhar ID and Mobile */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="aadhar_id">
                      Aadhar ID <span className="text-danger-600">*</span>
                    </Label>
                    <Input
                      id="aadhar_id"
                      value={formData.aadhar_id}
                      onChange={(e) => handleInputChange('aadhar_id', e.target.value)}
                      placeholder="XXXX XXXX XXXX"
                      pattern="[0-9\s]{12,14}"
                      maxLength={14}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="mobile_number">
                      Mobile Number <span className="text-danger-600">*</span>
                    </Label>
                    <Input
                      id="mobile_number"
                      type="tel"
                      value={formData.mobile_number}
                      onChange={(e) => handleInputChange('mobile_number', e.target.value)}
                      placeholder="+91 XXXXX XXXXX"
                      pattern="[\+]?[0-9\s]{10,15}"
                      required
                    />
                  </div>
                </div>

                {/* Village and State */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="village">
                      Village <span className="text-danger-600">*</span>
                    </Label>
                    <Input
                      id="village"
                      value={formData.village}
                      onChange={(e) => handleInputChange('village', e.target.value)}
                      placeholder="Enter village name"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="state">
                      State <span className="text-danger-600">*</span>
                    </Label>
                    <Select
                      id="state"
                      value={formData.state}
                      onChange={(e) => handleInputChange('state', e.target.value)}
                      required
                    >
                      {states.map((state) => (
                        <option key={state} value={state}>
                          {state}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAddDialog(false)
                    resetForm()
                  }}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Adding...' : 'Add Patient'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  )
}
