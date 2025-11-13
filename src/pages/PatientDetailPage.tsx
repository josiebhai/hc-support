import { useState, useEffect, useCallback } from 'react'
import { Layout } from '@/components/Layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { DatePicker } from '@/components/ui/datepicker'
import { Select } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { 
  ArrowLeft, 
  Plus, 
  Calendar, 
  User, 
  FileText, 
  Activity, 
  Pill, 
  Stethoscope,
  AlertCircle,
  CalendarClock,
  ChevronDown,
  ChevronUp,
  Trash2,
  Printer
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/ui/toast'
import type { Patient } from '@/types/patient'
import type { PatientVisit, CreatePatientVisitData, ChronicCondition, Medicine } from '@/types/patientVisit'
import { CHRONIC_CONDITIONS, MEDICINE_FREQUENCIES, MEAL_TIMINGS } from '@/types/patientVisit'
import { rolePermissions } from '@/types/user'

interface PatientDetailPageProps {
  patientId: string
  onBack: () => void
}

export function PatientDetailPage({ patientId, onBack }: PatientDetailPageProps) {
  const { user } = useAuth()
  const { showToast } = useToast()
  const [patient, setPatient] = useState<Patient | null>(null)
  const [visits, setVisits] = useState<PatientVisit[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddVisitDialog, setShowAddVisitDialog] = useState(false)
  const [showEditVisitDialog, setShowEditVisitDialog] = useState(false)
  const [selectedVisit, setSelectedVisit] = useState<PatientVisit | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState<'basic' | 'health' | 'notes'>('basic')
  const [expandedVisits, setExpandedVisits] = useState<Set<string>>(new Set())
  const [showPrescriptionDialog, setShowPrescriptionDialog] = useState(false)
  const [selectedPrescriptionVisit, setSelectedPrescriptionVisit] = useState<PatientVisit | null>(null)
  
  const [formData, setFormData] = useState<CreatePatientVisitData>({
    patient_id: patientId,
    visit_date: new Date().toISOString(),
    treating_doctor_name: '',
    height_cm: null,
    weight_kg: null,
    known_allergies: '',
    chronic_conditions: [],
    current_medications: '',
    immunization_status: '',
    last_health_checkup_date: null,
    doctor_notes: '',
    followup_date: null,
    followup_notes: '',
    prescriptions: '',
    medicines: [],
  })

  const userPermissions = user?.role ? rolePermissions[user.role] : null
  const canEditMedicalChart = userPermissions?.canEditMedicalChart

  const loadPatientAndVisits = useCallback(async () => {
    try {
      // Load patient details
      const { data: patientData, error: patientError } = await supabase
        .from('patients')
        .select('*')
        .eq('id', patientId)
        .single()

      if (patientError) throw patientError
      setPatient(patientData as Patient)

      // Load visits
      const { data: visitsData, error: visitsError } = await supabase
        .from('patient_visits')
        .select('*')
        .eq('patient_id', patientId)
        .order('visit_date', { ascending: false })

      if (visitsError) {
        // If table doesn't exist, just set empty array
        if (visitsError.code === '42P01') {
          console.warn('Patient visits table does not exist yet')
          setVisits([])
        } else {
          throw visitsError
        }
      } else {
        setVisits(visitsData as PatientVisit[] || [])
      }
    } catch (error) {
      console.error('Error loading patient data:', error)
      showToast('error', 'Failed to load patient data')
    } finally {
      setLoading(false)
    }
  }, [patientId, showToast])

  useEffect(() => {
    loadPatientAndVisits()
  }, [loadPatientAndVisits])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!canEditMedicalChart) {
      showToast('error', 'You do not have permission to add patient visits')
      return
    }

    setSubmitting(true)

    try {
      const visitData = {
        ...formData,
        created_by: user?.id,
      }

      const { error } = await supabase
        .from('patient_visits')
        .insert([visitData])

      if (error) throw error

      showToast('success', 'Visit added successfully!')
      setShowAddVisitDialog(false)
      resetForm()
      loadPatientAndVisits()
    } catch (error) {
      console.error('Error adding visit:', error)
      showToast('error', 'Failed to add visit. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!canEditMedicalChart || !selectedVisit) {
      showToast('error', 'You do not have permission to edit patient visits')
      return
    }

    setSubmitting(true)

    try {
      const updateData = {
        treating_doctor_name: formData.treating_doctor_name,
        height_cm: formData.height_cm,
        weight_kg: formData.weight_kg,
        known_allergies: formData.known_allergies,
        chronic_conditions: formData.chronic_conditions,
        current_medications: formData.current_medications,
        immunization_status: formData.immunization_status,
        last_health_checkup_date: formData.last_health_checkup_date,
        doctor_notes: formData.doctor_notes,
        followup_date: formData.followup_date,
        followup_notes: formData.followup_notes,
        prescriptions: formData.prescriptions,
        updated_by: user?.id,
      }

      const { error } = await supabase
        .from('patient_visits')
        .update(updateData)
        .eq('id', selectedVisit.id)

      if (error) throw error

      showToast('success', 'Visit updated successfully!')
      setShowEditVisitDialog(false)
      setSelectedVisit(null)
      resetForm()
      loadPatientAndVisits()
    } catch (error) {
      console.error('Error updating visit:', error)
      showToast('error', 'Failed to update visit. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    setFormData({
      patient_id: patientId,
      visit_date: new Date().toISOString(),
      height_cm: null,
      weight_kg: null,
      known_allergies: '',
      chronic_conditions: [],
      current_medications: '',
      immunization_status: '',
      last_health_checkup_date: null,
      doctor_notes: '',
      treating_doctor_name: '',
      followup_date: null,
      followup_notes: '',
      prescriptions: '',
      medicines: [],
    })
  }

  const handleInputChange = (field: keyof CreatePatientVisitData, value: string | number | null | ChronicCondition[] | Medicine[]) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleChronicConditionChange = (condition: ChronicCondition) => {
    const currentConditions = formData.chronic_conditions || []
    
    // If "None" is selected, clear all other selections
    if (condition === 'None') {
      setFormData(prev => ({ ...prev, chronic_conditions: ['None'] }))
      return
    }
    
    // Remove "None" if any other condition is selected
    const filteredConditions = currentConditions.filter(c => c !== 'None')
    
    if (filteredConditions.includes(condition)) {
      // Remove the condition if already selected
      const updated = filteredConditions.filter(c => c !== condition)
      setFormData(prev => ({ ...prev, chronic_conditions: updated }))
    } else {
      // Add the condition
      setFormData(prev => ({ ...prev, chronic_conditions: [...filteredConditions, condition] }))
    }
  }

  const addMedicine = () => {
    const newMedicine: Medicine = {
      id: `temp-${Date.now()}`,
      medicine_name: '',
      dosage: '',
      frequency: 'Twice daily',
      duration: '',
      meal_timing: 'After food',
      notes: '',
    }
    setFormData(prev => ({
      ...prev,
      medicines: [...(prev.medicines || []), newMedicine]
    }))
  }

  const removeMedicine = (id: string) => {
    setFormData(prev => ({
      ...prev,
      medicines: (prev.medicines || []).filter(m => m.id !== id)
    }))
  }

  const updateMedicine = (id: string, field: keyof Medicine, value: string) => {
    setFormData(prev => ({
      ...prev,
      medicines: (prev.medicines || []).map(m =>
        m.id === id ? { ...m, [field]: value } : m
      )
    }))
  }

  const viewPrescription = (visit: PatientVisit) => {
    setSelectedPrescriptionVisit(visit)
    setShowPrescriptionDialog(true)
  }

  const printPrescription = () => {
    window.print()
  }

  const openEditDialog = (visit: PatientVisit) => {
    setSelectedVisit(visit)
    setActiveTab('basic') // Reset to basic tab when opening edit dialog
    setFormData({
      patient_id: patientId,
      visit_date: visit.visit_date,
      treating_doctor_name: visit.treating_doctor_name || '',
      height_cm: visit.height_cm,
      weight_kg: visit.weight_kg,
      known_allergies: visit.known_allergies || '',
      chronic_conditions: visit.chronic_conditions || [],
      current_medications: visit.current_medications || '',
      immunization_status: visit.immunization_status || '',
      last_health_checkup_date: visit.last_health_checkup_date,
      doctor_notes: visit.doctor_notes || '',
      followup_date: visit.followup_date,
      followup_notes: visit.followup_notes || '',
      prescriptions: visit.prescriptions || '',
      medicines: visit.medicines || [],
    })
    setShowEditVisitDialog(true)
  }

  const toggleVisitExpansion = (visitId: string) => {
    setExpandedVisits(prev => {
      const newSet = new Set(prev)
      if (newSet.has(visitId)) {
        newSet.delete(visitId)
      } else {
        newSet.add(visitId)
      }
      return newSet
    })
  }

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date()
    const birthDate = new Date(dateOfBirth)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-neutral-600">Loading patient details...</p>
          </div>
        </div>
      </Layout>
    )
  }

  if (!patient) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-neutral-600">Patient not found</p>
          <Button variant="outline" className="mt-4" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Patients
          </Button>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h2 className="text-3xl font-bold font-display text-neutral-900">{patient.full_name}</h2>
              <p className="text-neutral-600 mt-1">Patient ID: {patient.patient_id}</p>
            </div>
          </div>
          {canEditMedicalChart && (
            <Button onClick={() => setShowAddVisitDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Visit
            </Button>
          )}
        </div>

        {/* Patient Information Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <User className="w-5 h-5 mr-2" />
                Patient Information
              </CardTitle>
              <div className="flex items-center space-x-2">
                {patient.blood_group && (
                  <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                    Blood: {patient.blood_group}
                  </Badge>
                )}
                <Badge variant="secondary">
                  Age: {calculateAge(patient.date_of_birth)} years
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-medium text-neutral-600">Gender:</span>
                <p className="text-neutral-900">{patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1)}</p>
              </div>
              <div>
                <span className="font-medium text-neutral-600">Date of Birth:</span>
                <p className="text-neutral-900">{new Date(patient.date_of_birth).toLocaleDateString()}</p>
              </div>
              <div>
                <span className="font-medium text-neutral-600">Mobile:</span>
                <p className="text-neutral-900">{patient.mobile_number}</p>
              </div>
              <div>
                <span className="font-medium text-neutral-600">Language:</span>
                <p className="text-neutral-900">{patient.language_preference || 'N/A'}</p>
              </div>
              <div>
                <span className="font-medium text-neutral-600">Marital Status:</span>
                <p className="text-neutral-900">{patient.marital_status ? patient.marital_status.charAt(0).toUpperCase() + patient.marital_status.slice(1) : 'N/A'}</p>
              </div>
              <div>
                <span className="font-medium text-neutral-600">Location:</span>
                <p className="text-neutral-900">{patient.village ? `${patient.village}, ` : ''}{patient.state || 'N/A'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Visits History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Visit History
            </CardTitle>
            <CardDescription>
              {visits.length} visit{visits.length !== 1 ? 's' : ''} recorded
            </CardDescription>
          </CardHeader>
          <CardContent>
            {visits.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
                <p className="text-neutral-600">No visits recorded yet</p>
                {canEditMedicalChart && (
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => setShowAddVisitDialog(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Visit
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {visits.map((visit) => {
                  const isExpanded = expandedVisits.has(visit.id)
                  const hasHealthData = visit.height_cm || visit.weight_kg || visit.chronic_conditions?.length || visit.known_allergies
                  const hasMedications = visit.current_medications || visit.prescriptions || visit.immunization_status || (visit.medicines && visit.medicines.length > 0)
                  const hasNotes = visit.doctor_notes || visit.followup_notes
                  
                  return (
                    <Card key={visit.id} className="overflow-hidden border-l-4 border-l-primary-400">
                      {/* Visit Header - Always Visible */}
                      <div className="p-4 bg-gradient-to-r from-primary-50 to-white">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                            <Badge variant="secondary" className="font-semibold">
                              {new Date(visit.visit_date).toLocaleDateString('en-US', { 
                                weekday: 'short', 
                                year: 'numeric', 
                                month: 'short', 
                                day: 'numeric' 
                              })}
                            </Badge>
                            <Badge variant="outline">
                              {new Date(visit.visit_date).toLocaleTimeString('en-US', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </Badge>
                            {visit.treating_doctor_name && (
                              <Badge variant="outline" className="bg-primary-50 text-primary-700 border-primary-200">
                                <Stethoscope className="w-3 h-3 mr-1" />
                                Dr. {visit.treating_doctor_name}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            {canEditMedicalChart && (
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => openEditDialog(visit)}
                                className="text-primary-600 hover:text-primary-700"
                              >
                                Edit
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleVisitExpansion(visit.id)}
                            >
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        </div>

                        {/* Quick Summary - Always Visible */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                          {visit.height_cm && visit.weight_kg && (
                            <div className="flex items-center space-x-2">
                              <Activity className="w-4 h-4 text-primary-600" />
                              <span className="text-neutral-700">
                                {visit.height_cm}cm / {visit.weight_kg}kg
                              </span>
                            </div>
                          )}
                          {visit.followup_date && (
                            <div className="flex items-center space-x-2">
                              <CalendarClock className="w-4 h-4 text-orange-600" />
                              <span className="text-neutral-700">
                                Follow-up: {new Date(visit.followup_date).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                          {visit.known_allergies && (
                            <div className="flex items-center space-x-2">
                              <AlertCircle className="w-4 h-4 text-red-600" />
                              <span className="text-red-700 font-medium">Allergies</span>
                            </div>
                          )}
                          {visit.prescriptions && (
                            <div className="flex items-center space-x-2">
                              <Pill className="w-4 h-4 text-green-600" />
                              <span className="text-neutral-700">Prescriptions</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Detailed Information - Collapsible */}
                      {isExpanded && (
                        <div className="p-4 space-y-4 bg-white">
                          {/* Health Metrics Section */}
                          {hasHealthData && (
                            <div className="border-t pt-4">
                              <h4 className="flex items-center text-sm font-semibold text-neutral-700 mb-3">
                                <Activity className="w-4 h-4 mr-2 text-primary-600" />
                                Health Information
                              </h4>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                                {visit.height_cm && (
                                  <div className="bg-neutral-50 p-3 rounded-md">
                                    <span className="text-neutral-600 text-xs">Height</span>
                                    <p className="text-neutral-900 font-semibold">{visit.height_cm} cm</p>
                                  </div>
                                )}
                                {visit.weight_kg && (
                                  <div className="bg-neutral-50 p-3 rounded-md">
                                    <span className="text-neutral-600 text-xs">Weight</span>
                                    <p className="text-neutral-900 font-semibold">{visit.weight_kg} kg</p>
                                  </div>
                                )}
                                {visit.last_health_checkup_date && (
                                  <div className="bg-neutral-50 p-3 rounded-md">
                                    <span className="text-neutral-600 text-xs">Last Checkup</span>
                                    <p className="text-neutral-900 font-semibold">
                                      {new Date(visit.last_health_checkup_date).toLocaleDateString()}
                                    </p>
                                  </div>
                                )}
                              </div>
                              
                              {visit.chronic_conditions && visit.chronic_conditions.length > 0 && (
                                <div className="mt-3">
                                  <span className="text-neutral-600 text-xs">Chronic Conditions</span>
                                  <div className="flex flex-wrap gap-2 mt-2">
                                    {visit.chronic_conditions.map((condition) => (
                                      <Badge key={condition} variant="outline" className="text-xs">
                                        {condition}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {visit.known_allergies && (
                                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                                  <div className="flex items-center space-x-2 mb-1">
                                    <AlertCircle className="w-4 h-4 text-red-600" />
                                    <span className="text-red-700 font-semibold text-xs">Allergies</span>
                                  </div>
                                  <p className="text-red-900 text-sm">{visit.known_allergies}</p>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Medications Section */}
                          {hasMedications && (
                            <div className="border-t pt-4">
                              <h4 className="flex items-center text-sm font-semibold text-neutral-700 mb-3">
                                <Pill className="w-4 h-4 mr-2 text-green-600" />
                                Medications & Immunization
                              </h4>
                              {visit.current_medications && (
                                <div className="mb-3 p-3 bg-green-50 rounded-md">
                                  <span className="text-green-700 font-medium text-xs">Current Medications</span>
                                  <p className="text-neutral-900 text-sm mt-1 whitespace-pre-wrap">{visit.current_medications}</p>
                                </div>
                              )}
                              {visit.prescriptions && (
                                <div className="mb-3 p-3 bg-blue-50 rounded-md">
                                  <span className="text-blue-700 font-medium text-xs">Prescriptions (Notes)</span>
                                  <p className="text-neutral-900 text-sm mt-1 whitespace-pre-wrap">{visit.prescriptions}</p>
                                </div>
                              )}
                              {visit.medicines && visit.medicines.length > 0 && (
                                <div className="mb-3">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-blue-700 font-semibold text-sm">Prescribed Medicines</span>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => viewPrescription(visit)}
                                      className="text-blue-600 hover:text-blue-700"
                                    >
                                      <Printer className="w-3 h-3 mr-1" />
                                      View Prescription
                                    </Button>
                                  </div>
                                  <div className="space-y-2">
                                    {visit.medicines.map((medicine, index) => (
                                      <div key={medicine.id || index} className="p-3 bg-blue-50 rounded-md border border-blue-200">
                                        <div className="flex items-start justify-between">
                                          <div className="flex-1">
                                            <p className="font-semibold text-neutral-900">{index + 1}. {medicine.medicine_name}</p>
                                            <div className="mt-1 text-xs text-neutral-600 space-y-1">
                                              <p><span className="font-medium">Dosage:</span> {medicine.dosage}</p>
                                              <p><span className="font-medium">Frequency:</span> {medicine.frequency}</p>
                                              <p><span className="font-medium">Duration:</span> {medicine.duration}</p>
                                              <p><span className="font-medium">Timing:</span> {medicine.meal_timing}</p>
                                              {medicine.notes && (
                                                <p><span className="font-medium">Notes:</span> {medicine.notes}</p>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {visit.immunization_status && (
                                <div className="p-3 bg-purple-50 rounded-md">
                                  <span className="text-purple-700 font-medium text-xs">Immunization Status</span>
                                  <p className="text-neutral-900 text-sm mt-1">{visit.immunization_status}</p>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Notes Section */}
                          {hasNotes && (
                            <div className="border-t pt-4">
                              <h4 className="flex items-center text-sm font-semibold text-neutral-700 mb-3">
                                <FileText className="w-4 h-4 mr-2 text-blue-600" />
                                Clinical Notes
                              </h4>
                              {visit.doctor_notes && (
                                <div className="mb-3 p-3 bg-neutral-50 rounded-md border border-neutral-200">
                                  <span className="text-neutral-600 font-medium text-xs">Doctor Notes</span>
                                  <p className="text-neutral-900 text-sm mt-1 whitespace-pre-wrap">{visit.doctor_notes}</p>
                                </div>
                              )}
                              {visit.followup_notes && (
                                <div className="p-3 bg-orange-50 rounded-md border border-orange-200">
                                  <span className="text-orange-700 font-medium text-xs">Follow-up Instructions</span>
                                  <p className="text-neutral-900 text-sm mt-1 whitespace-pre-wrap">{visit.followup_notes}</p>
                                  {visit.followup_date && (
                                    <div className="mt-2 flex items-center space-x-2 text-xs text-orange-600">
                                      <CalendarClock className="w-3 h-3" />
                                      <span>Next appointment: {new Date(visit.followup_date).toLocaleDateString()}</span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </Card>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add Visit Dialog */}
        <Dialog open={showAddVisitDialog} onOpenChange={setShowAddVisitDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>Add New Visit</DialogTitle>
              <DialogDescription>
                Record patient health information for this visit. All fields are optional.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
              {/* Tabs */}
              <div className="flex border-b border-neutral-200 mb-4">
                <button
                  type="button"
                  onClick={() => setActiveTab('basic')}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    activeTab === 'basic'
                      ? 'border-b-2 border-primary-600 text-primary-600'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4" />
                    <span>Basic Info</span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('health')}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    activeTab === 'health'
                      ? 'border-b-2 border-primary-600 text-primary-600'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Activity className="w-4 h-4" />
                    <span>Health & Medications</span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('notes')}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    activeTab === 'notes'
                      ? 'border-b-2 border-primary-600 text-primary-600'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4" />
                    <span>Notes & Follow-up</span>
                  </div>
                </button>
              </div>

              {/* Tab Content - Scrollable */}
              <div className="flex-1 overflow-y-auto px-1">
                {/* Basic Info Tab */}
                {activeTab === 'basic' && (
                  <div className="space-y-4 pb-4">
                    <div className="space-y-2">
                      <Label htmlFor="visit_date">Visit Date and Time</Label>
                      <Input
                        id="visit_date"
                        type="datetime-local"
                        value={formData.visit_date ? new Date(formData.visit_date).toISOString().slice(0, 16) : ''}
                        onChange={(e) => handleInputChange('visit_date', e.target.value ? new Date(e.target.value).toISOString() : '')}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="treating_doctor_name">Treating Doctor Name</Label>
                      <Input
                        id="treating_doctor_name"
                        value={formData.treating_doctor_name}
                        onChange={(e) => handleInputChange('treating_doctor_name', e.target.value)}
                        placeholder="e.g., Dr. Smith"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="height_cm">Height (cm)</Label>
                        <Input
                          id="height_cm"
                          type="number"
                          step="0.01"
                          value={formData.height_cm || ''}
                          onChange={(e) => handleInputChange('height_cm', e.target.value ? parseFloat(e.target.value) : null)}
                          placeholder="e.g., 170.5"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="weight_kg">Weight (kg)</Label>
                        <Input
                          id="weight_kg"
                          type="number"
                          step="0.01"
                          value={formData.weight_kg || ''}
                          onChange={(e) => handleInputChange('weight_kg', e.target.value ? parseFloat(e.target.value) : null)}
                          placeholder="e.g., 70.5"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <DatePicker
                        id="last_health_checkup_date"
                        value={formData.last_health_checkup_date || ''}
                        onChange={(value) => handleInputChange('last_health_checkup_date', value)}
                        label="Last Health Checkup Date"
                      />
                    </div>
                  </div>
                )}

                {/* Health & Medications Tab */}
                {activeTab === 'health' && (
                  <div className="space-y-4 pb-4">
                    <div className="space-y-2">
                      <Label>Chronic Conditions</Label>
                      <div className="flex flex-wrap gap-2">
                        {CHRONIC_CONDITIONS.map((condition) => (
                          <label
                            key={condition}
                            className="flex items-center space-x-2 px-3 py-2 rounded-md border border-neutral-300 cursor-pointer hover:bg-neutral-50 transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={formData.chronic_conditions?.includes(condition) || false}
                              onChange={() => handleChronicConditionChange(condition)}
                              className="rounded"
                            />
                            <span className="text-sm">{condition}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="known_allergies">
                        <div className="flex items-center space-x-2">
                          <AlertCircle className="w-4 h-4 text-red-600" />
                          <span>Known Allergies</span>
                        </div>
                      </Label>
                      <Input
                        id="known_allergies"
                        value={formData.known_allergies}
                        onChange={(e) => handleInputChange('known_allergies', e.target.value)}
                        placeholder="e.g., Penicillin, Peanuts"
                        className="border-red-200 focus:border-red-400"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="current_medications">Current Medications</Label>
                      <textarea
                        id="current_medications"
                        value={formData.current_medications}
                        onChange={(e) => handleInputChange('current_medications', e.target.value)}
                        placeholder="List current medications..."
                        className="w-full min-h-[100px] px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="prescriptions">Prescription Notes (Optional)</Label>
                      <textarea
                        id="prescriptions"
                        value={formData.prescriptions}
                        onChange={(e) => handleInputChange('prescriptions', e.target.value)}
                        placeholder="Add any additional prescription notes or instructions..."
                        className="w-full min-h-[80px] px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>

                    {/* Medicines List */}
                    <div className="space-y-3 p-4 bg-blue-50 rounded-md border border-blue-200">
                      <div className="flex items-center justify-between">
                        <Label className="text-blue-900 font-semibold">Prescribed Medicines</Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={addMedicine}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Add Medicine
                        </Button>
                      </div>
                      
                      {formData.medicines && formData.medicines.length > 0 ? (
                        <div className="space-y-3">
                          {formData.medicines.map((medicine, index) => (
                            <div key={medicine.id} className="p-3 bg-white rounded-md border border-blue-200 space-y-2">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-semibold text-sm text-blue-900">Medicine #{index + 1}</span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeMedicine(medicine.id)}
                                  className="text-red-600 hover:text-red-700 h-8 w-8 p-0"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-2">
                                <div className="col-span-2">
                                  <Label className="text-xs">Medicine Name *</Label>
                                  <Input
                                    value={medicine.medicine_name}
                                    onChange={(e) => updateMedicine(medicine.id, 'medicine_name', e.target.value)}
                                    placeholder="e.g., Paracetamol"
                                    className="text-sm"
                                  />
                                </div>
                                
                                <div>
                                  <Label className="text-xs">Dosage *</Label>
                                  <Input
                                    value={medicine.dosage}
                                    onChange={(e) => updateMedicine(medicine.id, 'dosage', e.target.value)}
                                    placeholder="e.g., 500mg"
                                    className="text-sm"
                                  />
                                </div>
                                
                                <div>
                                  <Label className="text-xs">Frequency *</Label>
                                  <Select
                                    value={medicine.frequency}
                                    onChange={(e) => updateMedicine(medicine.id, 'frequency', e.target.value)}
                                    className="text-sm"
                                  >
                                    {MEDICINE_FREQUENCIES.map((freq) => (
                                      <option key={freq} value={freq}>
                                        {freq}
                                      </option>
                                    ))}
                                  </Select>
                                </div>
                                
                                <div>
                                  <Label className="text-xs">Duration *</Label>
                                  <Input
                                    value={medicine.duration}
                                    onChange={(e) => updateMedicine(medicine.id, 'duration', e.target.value)}
                                    placeholder="e.g., 5 days"
                                    className="text-sm"
                                  />
                                </div>
                                
                                <div>
                                  <Label className="text-xs">Meal Timing *</Label>
                                  <Select
                                    value={medicine.meal_timing}
                                    onChange={(e) => updateMedicine(medicine.id, 'meal_timing', e.target.value)}
                                    className="text-sm"
                                  >
                                    {MEAL_TIMINGS.map((timing) => (
                                      <option key={timing} value={timing}>
                                        {timing}
                                      </option>
                                    ))}
                                  </Select>
                                </div>
                                
                                <div className="col-span-2">
                                  <Label className="text-xs">Special Instructions (Optional)</Label>
                                  <Input
                                    value={medicine.notes || ''}
                                    onChange={(e) => updateMedicine(medicine.id, 'notes', e.target.value)}
                                    placeholder="Any special instructions..."
                                    className="text-sm"
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-blue-700 text-center py-4">
                          No medicines added. Click "Add Medicine" to start prescribing.
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="immunization_status">Immunization Status</Label>
                      <Input
                        id="immunization_status"
                        value={formData.immunization_status}
                        onChange={(e) => handleInputChange('immunization_status', e.target.value)}
                        placeholder="e.g., All vaccinations up to date"
                      />
                    </div>
                  </div>
                )}

                {/* Notes & Follow-up Tab */}
                {activeTab === 'notes' && (
                  <div className="space-y-4 pb-4">
                    <div className="space-y-2">
                      <Label htmlFor="doctor_notes">Doctor Notes</Label>
                      <textarea
                        id="doctor_notes"
                        value={formData.doctor_notes}
                        onChange={(e) => handleInputChange('doctor_notes', e.target.value)}
                        placeholder="Add clinical observations and notes about this visit..."
                        className="w-full min-h-[150px] px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>

                    <div className="p-4 bg-orange-50 border border-orange-200 rounded-md space-y-4">
                      <h4 className="flex items-center text-sm font-semibold text-orange-700">
                        <CalendarClock className="w-4 h-4 mr-2" />
                        Follow-up Information
                      </h4>
                      
                      <div className="space-y-2">
                        <DatePicker
                          id="followup_date"
                          value={formData.followup_date || ''}
                          onChange={(value) => handleInputChange('followup_date', value)}
                          label="Follow-up Date"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="followup_notes">Follow-up Instructions</Label>
                        <textarea
                          id="followup_notes"
                          value={formData.followup_notes}
                          onChange={(e) => handleInputChange('followup_notes', e.target.value)}
                          placeholder="Add follow-up instructions and next steps..."
                          className="w-full min-h-[100px] px-3 py-2 border border-orange-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter className="mt-4 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAddVisitDialog(false)
                    setActiveTab('basic')
                    resetForm()
                  }}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Adding...' : 'Add Visit'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Visit Dialog */}
        <Dialog open={showEditVisitDialog} onOpenChange={setShowEditVisitDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>Edit Visit</DialogTitle>
              <DialogDescription>
                Update patient health information for this visit. All fields are optional.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleUpdate} className="flex flex-col flex-1 overflow-hidden">
              {/* Tabs */}
              <div className="flex border-b border-neutral-200 mb-4">
                <button
                  type="button"
                  onClick={() => setActiveTab('basic')}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    activeTab === 'basic'
                      ? 'border-b-2 border-primary-600 text-primary-600'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4" />
                    <span>Basic Info</span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('health')}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    activeTab === 'health'
                      ? 'border-b-2 border-primary-600 text-primary-600'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Activity className="w-4 h-4" />
                    <span>Health & Medications</span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('notes')}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    activeTab === 'notes'
                      ? 'border-b-2 border-primary-600 text-primary-600'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4" />
                    <span>Notes & Follow-up</span>
                  </div>
                </button>
              </div>

              {/* Tab Content - Scrollable */}
              <div className="flex-1 overflow-y-auto px-1">
                {/* Basic Info Tab */}
                {activeTab === 'basic' && (
                  <div className="space-y-4 pb-4">
                    <div className="p-3 bg-neutral-100 rounded-md">
                      <Label className="text-xs text-neutral-600">Visit Date</Label>
                      <p className="text-neutral-900 font-medium">
                        {formData.visit_date && new Date(formData.visit_date).toLocaleString()}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit_treating_doctor_name">Treating Doctor Name</Label>
                      <Input
                        id="edit_treating_doctor_name"
                        value={formData.treating_doctor_name}
                        onChange={(e) => handleInputChange('treating_doctor_name', e.target.value)}
                        placeholder="e.g., Dr. Smith"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit_height_cm">Height (cm)</Label>
                        <Input
                          id="edit_height_cm"
                          type="number"
                          step="0.01"
                          value={formData.height_cm || ''}
                          onChange={(e) => handleInputChange('height_cm', e.target.value ? parseFloat(e.target.value) : null)}
                          placeholder="e.g., 170.5"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="edit_weight_kg">Weight (kg)</Label>
                        <Input
                          id="edit_weight_kg"
                          type="number"
                          step="0.01"
                          value={formData.weight_kg || ''}
                          onChange={(e) => handleInputChange('weight_kg', e.target.value ? parseFloat(e.target.value) : null)}
                          placeholder="e.g., 70.5"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <DatePicker
                        id="edit_last_health_checkup_date"
                        value={formData.last_health_checkup_date || ''}
                        onChange={(value) => handleInputChange('last_health_checkup_date', value)}
                        label="Last Health Checkup Date"
                      />
                    </div>
                  </div>
                )}

                {/* Health & Medications Tab */}
                {activeTab === 'health' && (
                  <div className="space-y-4 pb-4">
                    <div className="space-y-2">
                      <Label>Chronic Conditions</Label>
                      <div className="flex flex-wrap gap-2">
                        {CHRONIC_CONDITIONS.map((condition) => (
                          <label
                            key={condition}
                            className="flex items-center space-x-2 px-3 py-2 rounded-md border border-neutral-300 cursor-pointer hover:bg-neutral-50 transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={formData.chronic_conditions?.includes(condition) || false}
                              onChange={() => handleChronicConditionChange(condition)}
                              className="rounded"
                            />
                            <span className="text-sm">{condition}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit_known_allergies">
                        <div className="flex items-center space-x-2">
                          <AlertCircle className="w-4 h-4 text-red-600" />
                          <span>Known Allergies</span>
                        </div>
                      </Label>
                      <Input
                        id="edit_known_allergies"
                        value={formData.known_allergies}
                        onChange={(e) => handleInputChange('known_allergies', e.target.value)}
                        placeholder="e.g., Penicillin, Peanuts"
                        className="border-red-200 focus:border-red-400"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit_current_medications">Current Medications</Label>
                      <textarea
                        id="edit_current_medications"
                        value={formData.current_medications}
                        onChange={(e) => handleInputChange('current_medications', e.target.value)}
                        placeholder="List current medications..."
                        className="w-full min-h-[100px] px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit_prescriptions">New Prescriptions</Label>
                      <textarea
                        id="edit_prescriptions"
                        value={formData.prescriptions}
                        onChange={(e) => handleInputChange('prescriptions', e.target.value)}
                        placeholder="Add any additional prescription notes or instructions..."
                        className="w-full min-h-[80px] px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>

                    {/* Medicines List */}
                    <div className="space-y-3 p-4 bg-blue-50 rounded-md border border-blue-200">
                      <div className="flex items-center justify-between">
                        <Label className="text-blue-900 font-semibold">Prescribed Medicines</Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={addMedicine}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Add Medicine
                        </Button>
                      </div>
                      
                      {formData.medicines && formData.medicines.length > 0 ? (
                        <div className="space-y-3">
                          {formData.medicines.map((medicine, index) => (
                            <div key={medicine.id} className="p-3 bg-white rounded-md border border-blue-200 space-y-2">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-semibold text-sm text-blue-900">Medicine #{index + 1}</span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeMedicine(medicine.id)}
                                  className="text-red-600 hover:text-red-700 h-8 w-8 p-0"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-2">
                                <div className="col-span-2">
                                  <Label className="text-xs">Medicine Name *</Label>
                                  <Input
                                    value={medicine.medicine_name}
                                    onChange={(e) => updateMedicine(medicine.id, 'medicine_name', e.target.value)}
                                    placeholder="e.g., Paracetamol"
                                    className="text-sm"
                                  />
                                </div>
                                
                                <div>
                                  <Label className="text-xs">Dosage *</Label>
                                  <Input
                                    value={medicine.dosage}
                                    onChange={(e) => updateMedicine(medicine.id, 'dosage', e.target.value)}
                                    placeholder="e.g., 500mg"
                                    className="text-sm"
                                  />
                                </div>
                                
                                <div>
                                  <Label className="text-xs">Frequency *</Label>
                                  <Select
                                    value={medicine.frequency}
                                    onChange={(e) => updateMedicine(medicine.id, 'frequency', e.target.value)}
                                    className="text-sm"
                                  >
                                    {MEDICINE_FREQUENCIES.map((freq) => (
                                      <option key={freq} value={freq}>
                                        {freq}
                                      </option>
                                    ))}
                                  </Select>
                                </div>
                                
                                <div>
                                  <Label className="text-xs">Duration *</Label>
                                  <Input
                                    value={medicine.duration}
                                    onChange={(e) => updateMedicine(medicine.id, 'duration', e.target.value)}
                                    placeholder="e.g., 5 days"
                                    className="text-sm"
                                  />
                                </div>
                                
                                <div>
                                  <Label className="text-xs">Meal Timing *</Label>
                                  <Select
                                    value={medicine.meal_timing}
                                    onChange={(e) => updateMedicine(medicine.id, 'meal_timing', e.target.value)}
                                    className="text-sm"
                                  >
                                    {MEAL_TIMINGS.map((timing) => (
                                      <option key={timing} value={timing}>
                                        {timing}
                                      </option>
                                    ))}
                                  </Select>
                                </div>
                                
                                <div className="col-span-2">
                                  <Label className="text-xs">Special Instructions (Optional)</Label>
                                  <Input
                                    value={medicine.notes || ''}
                                    onChange={(e) => updateMedicine(medicine.id, 'notes', e.target.value)}
                                    placeholder="Any special instructions..."
                                    className="text-sm"
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-blue-700 text-center py-4">
                          No medicines added. Click "Add Medicine" to start prescribing.
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit_immunization_status">Immunization Status</Label>
                      <Input
                        id="edit_immunization_status"
                        value={formData.immunization_status}
                        onChange={(e) => handleInputChange('immunization_status', e.target.value)}
                        placeholder="e.g., All vaccinations up to date"
                      />
                    </div>
                  </div>
                )}

                {/* Notes & Follow-up Tab */}
                {activeTab === 'notes' && (
                  <div className="space-y-4 pb-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit_doctor_notes">Doctor Notes</Label>
                      <textarea
                        id="edit_doctor_notes"
                        value={formData.doctor_notes}
                        onChange={(e) => handleInputChange('doctor_notes', e.target.value)}
                        placeholder="Add clinical observations and notes about this visit..."
                        className="w-full min-h-[150px] px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>

                    <div className="p-4 bg-orange-50 border border-orange-200 rounded-md space-y-4">
                      <h4 className="flex items-center text-sm font-semibold text-orange-700">
                        <CalendarClock className="w-4 h-4 mr-2" />
                        Follow-up Information
                      </h4>
                      
                      <div className="space-y-2">
                        <DatePicker
                          id="edit_followup_date"
                          value={formData.followup_date || ''}
                          onChange={(value) => handleInputChange('followup_date', value)}
                          label="Follow-up Date"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="edit_followup_notes">Follow-up Instructions</Label>
                        <textarea
                          id="edit_followup_notes"
                          value={formData.followup_notes}
                          onChange={(e) => handleInputChange('followup_notes', e.target.value)}
                          placeholder="Add follow-up instructions and next steps..."
                          className="w-full min-h-[100px] px-3 py-2 border border-orange-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter className="mt-4 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowEditVisitDialog(false)
                    setSelectedVisit(null)
                    setActiveTab('basic')
                    resetForm()
                  }}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Updating...' : 'Update Visit'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Prescription View Dialog */}
        <Dialog open={showPrescriptionDialog} onOpenChange={setShowPrescriptionDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto print:max-w-full print:shadow-none">
            <DialogHeader className="print:hidden">
              <DialogTitle>Prescription</DialogTitle>
              <DialogDescription>
                View and print the prescription for this visit
              </DialogDescription>
            </DialogHeader>

            {selectedPrescriptionVisit && (
              <div className="prescription-content space-y-6 py-4">
                {/* Header - Print Only */}
                <div className="hidden print:block text-center border-b-2 border-primary-600 pb-4 mb-6">
                  <h1 className="text-2xl font-bold text-primary-700">HealthCare Support</h1>
                  <p className="text-sm text-neutral-600">Patient Management System</p>
                </div>

                {/* Patient & Doctor Info */}
                <div className="grid grid-cols-2 gap-6 p-4 bg-neutral-50 rounded-md print:bg-white print:border print:border-neutral-300">
                  <div>
                    <h3 className="font-semibold text-neutral-700 mb-2">Patient Information</h3>
                    <p className="text-sm"><span className="font-medium">Name:</span> {patient?.full_name}</p>
                    <p className="text-sm"><span className="font-medium">Patient ID:</span> {patient?.patient_id}</p>
                    <p className="text-sm"><span className="font-medium">Age:</span> {calculateAge(patient?.date_of_birth || '')} years</p>
                    {patient?.blood_group && (
                      <p className="text-sm"><span className="font-medium">Blood Group:</span> {patient.blood_group}</p>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-neutral-700 mb-2">Visit Information</h3>
                    <p className="text-sm"><span className="font-medium">Date:</span> {new Date(selectedPrescriptionVisit.visit_date).toLocaleDateString()}</p>
                    {selectedPrescriptionVisit.treating_doctor_name && (
                      <p className="text-sm"><span className="font-medium">Doctor:</span> Dr. {selectedPrescriptionVisit.treating_doctor_name}</p>
                    )}
                  </div>
                </div>

                {/* Allergies Warning */}
                {selectedPrescriptionVisit.known_allergies && (
                  <div className="p-4 bg-red-50 border-2 border-red-500 rounded-md print:border-red-700">
                    <div className="flex items-center space-x-2 mb-2">
                      <AlertCircle className="w-5 h-5 text-red-600" />
                      <h3 className="font-bold text-red-700">ALLERGIES</h3>
                    </div>
                    <p className="text-sm text-red-900 font-medium">{selectedPrescriptionVisit.known_allergies}</p>
                  </div>
                )}

                {/* Diagnosis/Notes */}
                {selectedPrescriptionVisit.doctor_notes && (
                  <div className="p-4 bg-blue-50 rounded-md print:bg-white print:border print:border-neutral-300">
                    <h3 className="font-semibold text-neutral-700 mb-2">Diagnosis / Clinical Notes</h3>
                    <p className="text-sm whitespace-pre-wrap">{selectedPrescriptionVisit.doctor_notes}</p>
                  </div>
                )}

                {/* Prescription Table */}
                {selectedPrescriptionVisit.medicines && selectedPrescriptionVisit.medicines.length > 0 && (
                  <div>
                    <h3 className="font-bold text-lg text-primary-700 mb-3 flex items-center">
                      <Pill className="w-5 h-5 mr-2" />
                      Rx - Prescription
                    </h3>
                    <table className="w-full border-collapse border border-neutral-300">
                      <thead>
                        <tr className="bg-primary-50 print:bg-neutral-100">
                          <th className="border border-neutral-300 p-2 text-left text-sm font-semibold">#</th>
                          <th className="border border-neutral-300 p-2 text-left text-sm font-semibold">Medicine</th>
                          <th className="border border-neutral-300 p-2 text-left text-sm font-semibold">Dosage</th>
                          <th className="border border-neutral-300 p-2 text-left text-sm font-semibold">Frequency</th>
                          <th className="border border-neutral-300 p-2 text-left text-sm font-semibold">Duration</th>
                          <th className="border border-neutral-300 p-2 text-left text-sm font-semibold">Timing</th>
                          <th className="border border-neutral-300 p-2 text-left text-sm font-semibold">Instructions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedPrescriptionVisit.medicines.map((medicine, index) => (
                          <tr key={medicine.id || index} className="hover:bg-neutral-50">
                            <td className="border border-neutral-300 p-2 text-sm">{index + 1}</td>
                            <td className="border border-neutral-300 p-2 text-sm font-medium">{medicine.medicine_name}</td>
                            <td className="border border-neutral-300 p-2 text-sm">{medicine.dosage}</td>
                            <td className="border border-neutral-300 p-2 text-sm">{medicine.frequency}</td>
                            <td className="border border-neutral-300 p-2 text-sm">{medicine.duration}</td>
                            <td className="border border-neutral-300 p-2 text-sm">{medicine.meal_timing}</td>
                            <td className="border border-neutral-300 p-2 text-sm">{medicine.notes || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Additional Prescription Notes */}
                {selectedPrescriptionVisit.prescriptions && (
                  <div className="p-4 bg-neutral-50 rounded-md print:bg-white print:border print:border-neutral-300">
                    <h3 className="font-semibold text-neutral-700 mb-2">Additional Instructions</h3>
                    <p className="text-sm whitespace-pre-wrap">{selectedPrescriptionVisit.prescriptions}</p>
                  </div>
                )}

                {/* Follow-up Information */}
                {(selectedPrescriptionVisit.followup_date || selectedPrescriptionVisit.followup_notes) && (
                  <div className="p-4 bg-orange-50 border border-orange-200 rounded-md print:bg-white print:border-orange-500">
                    <h3 className="font-semibold text-orange-700 mb-2 flex items-center">
                      <CalendarClock className="w-4 h-4 mr-2" />
                      Follow-up
                    </h3>
                    {selectedPrescriptionVisit.followup_date && (
                      <p className="text-sm mb-1">
                        <span className="font-medium">Next Visit:</span> {new Date(selectedPrescriptionVisit.followup_date).toLocaleDateString()}
                      </p>
                    )}
                    {selectedPrescriptionVisit.followup_notes && (
                      <p className="text-sm whitespace-pre-wrap">{selectedPrescriptionVisit.followup_notes}</p>
                    )}
                  </div>
                )}

                {/* Footer - Print Only */}
                <div className="hidden print:block mt-8 pt-4 border-t border-neutral-300">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-xs text-neutral-600">Prescribed by:</p>
                      <p className="text-sm font-semibold mt-2">
                        {selectedPrescriptionVisit.treating_doctor_name ? `Dr. ${selectedPrescriptionVisit.treating_doctor_name}` : '_________________'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-neutral-600">Date:</p>
                      <p className="text-sm font-semibold mt-2">
                        {new Date(selectedPrescriptionVisit.visit_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter className="print:hidden">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowPrescriptionDialog(false)}
              >
                Close
              </Button>
              <Button
                type="button"
                onClick={printPrescription}
              >
                <Printer className="w-4 h-4 mr-2" />
                Print Prescription
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  )
}
