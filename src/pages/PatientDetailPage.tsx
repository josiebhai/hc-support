import { useState, useEffect, useCallback } from 'react'
import { Layout } from '@/components/Layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { DatePicker } from '@/components/ui/datepicker'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ArrowLeft, Plus, Calendar, User, FileText } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/ui/toast'
import type { Patient } from '@/types/patient'
import type { PatientVisit, CreatePatientVisitData, ChronicCondition, BloodGroup } from '@/types/patientVisit'
import { BLOOD_GROUPS, CHRONIC_CONDITIONS } from '@/types/patientVisit'
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
  
  const [formData, setFormData] = useState<CreatePatientVisitData>({
    patient_id: patientId,
    visit_date: new Date().toISOString(),
    height_cm: null,
    weight_kg: null,
    blood_group: '',
    known_allergies: '',
    chronic_conditions: [],
    current_medications: '',
    immunization_status: '',
    last_health_checkup_date: null,
    doctor_notes: '',
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
        height_cm: formData.height_cm,
        weight_kg: formData.weight_kg,
        blood_group: formData.blood_group,
        known_allergies: formData.known_allergies,
        chronic_conditions: formData.chronic_conditions,
        current_medications: formData.current_medications,
        immunization_status: formData.immunization_status,
        last_health_checkup_date: formData.last_health_checkup_date,
        doctor_notes: formData.doctor_notes,
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
      blood_group: '',
      known_allergies: '',
      chronic_conditions: [],
      current_medications: '',
      immunization_status: '',
      last_health_checkup_date: null,
      doctor_notes: '',
    })
  }

  const handleInputChange = (field: keyof CreatePatientVisitData, value: string | number | null | ChronicCondition[] | BloodGroup) => {
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

  const openEditDialog = (visit: PatientVisit) => {
    setSelectedVisit(visit)
    setFormData({
      patient_id: patientId,
      visit_date: visit.visit_date,
      height_cm: visit.height_cm,
      weight_kg: visit.weight_kg,
      blood_group: visit.blood_group || '',
      known_allergies: visit.known_allergies || '',
      chronic_conditions: visit.chronic_conditions || [],
      current_medications: visit.current_medications || '',
      immunization_status: visit.immunization_status || '',
      last_health_checkup_date: visit.last_health_checkup_date,
      doctor_notes: visit.doctor_notes || '',
    })
    setShowEditVisitDialog(true)
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
            <CardTitle className="flex items-center">
              <User className="w-5 h-5 mr-2" />
              Patient Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
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
                {visits.map((visit) => (
                  <div
                    key={visit.id}
                    className="p-4 rounded-lg bg-neutral-50 hover:bg-neutral-100 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary">
                          {new Date(visit.visit_date).toLocaleDateString()}
                        </Badge>
                        <Badge variant="outline">
                          {new Date(visit.visit_date).toLocaleTimeString()}
                        </Badge>
                      </div>
                      {canEditMedicalChart && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => openEditDialog(visit)}
                        >
                          Edit
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                      {visit.height_cm && (
                        <div>
                          <span className="font-medium text-neutral-600">Height:</span>
                          <p className="text-neutral-900">{visit.height_cm} cm</p>
                        </div>
                      )}
                      {visit.weight_kg && (
                        <div>
                          <span className="font-medium text-neutral-600">Weight:</span>
                          <p className="text-neutral-900">{visit.weight_kg} kg</p>
                        </div>
                      )}
                      {visit.blood_group && (
                        <div>
                          <span className="font-medium text-neutral-600">Blood Group:</span>
                          <p className="text-neutral-900">{visit.blood_group}</p>
                        </div>
                      )}
                      {visit.last_health_checkup_date && (
                        <div>
                          <span className="font-medium text-neutral-600">Last Checkup:</span>
                          <p className="text-neutral-900">{new Date(visit.last_health_checkup_date).toLocaleDateString()}</p>
                        </div>
                      )}
                    </div>

                    {visit.chronic_conditions && visit.chronic_conditions.length > 0 && (
                      <div className="mb-3">
                        <span className="font-medium text-neutral-600 text-sm">Chronic Conditions:</span>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {visit.chronic_conditions.map((condition) => (
                            <Badge key={condition} variant="outline" className="text-xs">
                              {condition}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {visit.known_allergies && (
                      <div className="mb-3">
                        <span className="font-medium text-neutral-600 text-sm">Allergies:</span>
                        <p className="text-neutral-900 text-sm mt-1">{visit.known_allergies}</p>
                      </div>
                    )}

                    {visit.current_medications && (
                      <div className="mb-3">
                        <span className="font-medium text-neutral-600 text-sm">Current Medications:</span>
                        <p className="text-neutral-900 text-sm mt-1">{visit.current_medications}</p>
                      </div>
                    )}

                    {visit.immunization_status && (
                      <div className="mb-3">
                        <span className="font-medium text-neutral-600 text-sm">Immunization Status:</span>
                        <p className="text-neutral-900 text-sm mt-1">{visit.immunization_status}</p>
                      </div>
                    )}

                    {visit.doctor_notes && (
                      <div className="pt-3 border-t border-neutral-200">
                        <span className="font-medium text-neutral-600 text-sm">Doctor Notes:</span>
                        <p className="text-neutral-900 text-sm mt-1 whitespace-pre-wrap">{visit.doctor_notes}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add Visit Dialog */}
        <Dialog open={showAddVisitDialog} onOpenChange={setShowAddVisitDialog}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Visit</DialogTitle>
              <DialogDescription>
                Record patient health information for this visit. All fields are optional.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4">
                {/* Visit Date */}
                <div className="space-y-2">
                  <Label htmlFor="visit_date">Visit Date and Time</Label>
                  <Input
                    id="visit_date"
                    type="datetime-local"
                    value={formData.visit_date ? new Date(formData.visit_date).toISOString().slice(0, 16) : ''}
                    onChange={(e) => handleInputChange('visit_date', e.target.value ? new Date(e.target.value).toISOString() : '')}
                  />
                </div>

                {/* Health Metrics Section */}
                <div className="pt-4 border-t border-neutral-200">
                  <h3 className="text-lg font-semibold mb-4">Health Information</h3>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
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

                  <div className="space-y-2 mb-4">
                    <Label htmlFor="blood_group">Blood Group</Label>
                    <Select
                      id="blood_group"
                      value={formData.blood_group}
                      onChange={(e) => handleInputChange('blood_group', e.target.value as BloodGroup)}
                    >
                      <option value="">Select blood group (optional)</option>
                      {BLOOD_GROUPS.filter(bg => bg !== '').map((bg) => (
                        <option key={bg} value={bg}>
                          {bg}
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div className="space-y-2 mb-4">
                    <Label>Chronic Conditions</Label>
                    <div className="flex flex-wrap gap-2">
                      {CHRONIC_CONDITIONS.map((condition) => (
                        <label
                          key={condition}
                          className="flex items-center space-x-2 px-3 py-2 rounded-md border border-neutral-300 cursor-pointer hover:bg-neutral-50"
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

                  <div className="space-y-2 mb-4">
                    <Label htmlFor="known_allergies">Known Allergies</Label>
                    <Input
                      id="known_allergies"
                      value={formData.known_allergies}
                      onChange={(e) => handleInputChange('known_allergies', e.target.value)}
                      placeholder="e.g., Penicillin, Peanuts"
                    />
                  </div>

                  <div className="space-y-2 mb-4">
                    <Label htmlFor="current_medications">Current Medications</Label>
                    <textarea
                      id="current_medications"
                      value={formData.current_medications}
                      onChange={(e) => handleInputChange('current_medications', e.target.value)}
                      placeholder="List current medications..."
                      className="w-full min-h-[80px] px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div className="space-y-2 mb-4">
                    <Label htmlFor="immunization_status">Immunization Status</Label>
                    <Input
                      id="immunization_status"
                      value={formData.immunization_status}
                      onChange={(e) => handleInputChange('immunization_status', e.target.value)}
                      placeholder="e.g., All vaccinations up to date"
                    />
                  </div>

                  <div className="space-y-2 mb-4">
                    <DatePicker
                      id="last_health_checkup_date"
                      value={formData.last_health_checkup_date || ''}
                      onChange={(value) => handleInputChange('last_health_checkup_date', value)}
                      label="Last Health Checkup Date"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="doctor_notes">Doctor Notes</Label>
                    <textarea
                      id="doctor_notes"
                      value={formData.doctor_notes}
                      onChange={(e) => handleInputChange('doctor_notes', e.target.value)}
                      placeholder="Add notes about this visit..."
                      className="w-full min-h-[120px] px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAddVisitDialog(false)
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
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Visit</DialogTitle>
              <DialogDescription>
                Update patient health information for this visit. All fields are optional.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleUpdate}>
              <div className="space-y-4 py-4">
                <div className="mb-4">
                  <Label className="text-sm text-neutral-600">Visit Date</Label>
                  <p className="text-neutral-900 font-medium">
                    {formData.visit_date && new Date(formData.visit_date).toLocaleString()}
                  </p>
                </div>

                {/* Health Metrics Section - Same as Add Dialog */}
                <div className="pt-4 border-t border-neutral-200">
                  <h3 className="text-lg font-semibold mb-4">Health Information</h3>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
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

                  <div className="space-y-2 mb-4">
                    <Label htmlFor="edit_blood_group">Blood Group</Label>
                    <Select
                      id="edit_blood_group"
                      value={formData.blood_group}
                      onChange={(e) => handleInputChange('blood_group', e.target.value as BloodGroup)}
                    >
                      <option value="">Select blood group (optional)</option>
                      {BLOOD_GROUPS.filter(bg => bg !== '').map((bg) => (
                        <option key={bg} value={bg}>
                          {bg}
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div className="space-y-2 mb-4">
                    <Label>Chronic Conditions</Label>
                    <div className="flex flex-wrap gap-2">
                      {CHRONIC_CONDITIONS.map((condition) => (
                        <label
                          key={condition}
                          className="flex items-center space-x-2 px-3 py-2 rounded-md border border-neutral-300 cursor-pointer hover:bg-neutral-50"
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

                  <div className="space-y-2 mb-4">
                    <Label htmlFor="edit_known_allergies">Known Allergies</Label>
                    <Input
                      id="edit_known_allergies"
                      value={formData.known_allergies}
                      onChange={(e) => handleInputChange('known_allergies', e.target.value)}
                      placeholder="e.g., Penicillin, Peanuts"
                    />
                  </div>

                  <div className="space-y-2 mb-4">
                    <Label htmlFor="edit_current_medications">Current Medications</Label>
                    <textarea
                      id="edit_current_medications"
                      value={formData.current_medications}
                      onChange={(e) => handleInputChange('current_medications', e.target.value)}
                      placeholder="List current medications..."
                      className="w-full min-h-[80px] px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div className="space-y-2 mb-4">
                    <Label htmlFor="edit_immunization_status">Immunization Status</Label>
                    <Input
                      id="edit_immunization_status"
                      value={formData.immunization_status}
                      onChange={(e) => handleInputChange('immunization_status', e.target.value)}
                      placeholder="e.g., All vaccinations up to date"
                    />
                  </div>

                  <div className="space-y-2 mb-4">
                    <DatePicker
                      id="edit_last_health_checkup_date"
                      value={formData.last_health_checkup_date || ''}
                      onChange={(value) => handleInputChange('last_health_checkup_date', value)}
                      label="Last Health Checkup Date"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit_doctor_notes">Doctor Notes</Label>
                    <textarea
                      id="edit_doctor_notes"
                      value={formData.doctor_notes}
                      onChange={(e) => handleInputChange('doctor_notes', e.target.value)}
                      placeholder="Add notes about this visit..."
                      className="w-full min-h-[120px] px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowEditVisitDialog(false)
                    setSelectedVisit(null)
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
      </div>
    </Layout>
  )
}
