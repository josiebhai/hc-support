export type ChronicCondition = 'Diabetes' | 'Hypertension' | 'Asthma' | 'Tuberculosis' | 'None'

export interface PatientVisit {
  id: string
  patient_id: string
  visit_date: string // ISO date format
  
  // Treating Doctor
  treating_doctor_name?: string
  
  // Health Information (all optional)
  height_cm?: number | null
  weight_kg?: number | null
  known_allergies?: string
  chronic_conditions?: ChronicCondition[]
  current_medications?: string
  immunization_status?: string
  last_health_checkup_date?: string | null // ISO date format
  doctor_notes?: string
  
  // Follow-up and Prescriptions (optional)
  followup_date?: string | null // ISO date format for follow-up appointment
  followup_notes?: string
  prescriptions?: string
  
  // Metadata
  created_at: string
  updated_at: string
  created_by?: string
  updated_by?: string
}

export interface CreatePatientVisitData {
  patient_id: string
  visit_date?: string
  treating_doctor_name?: string
  height_cm?: number | null
  weight_kg?: number | null
  known_allergies?: string
  chronic_conditions?: ChronicCondition[]
  current_medications?: string
  immunization_status?: string
  last_health_checkup_date?: string | null
  doctor_notes?: string
  followup_date?: string | null
  followup_notes?: string
  prescriptions?: string
}

export interface UpdatePatientVisitData {
  treating_doctor_name?: string
  height_cm?: number | null
  weight_kg?: number | null
  known_allergies?: string
  chronic_conditions?: ChronicCondition[]
  current_medications?: string
  immunization_status?: string
  last_health_checkup_date?: string | null
  doctor_notes?: string
  followup_date?: string | null
  followup_notes?: string
  prescriptions?: string
}

// Chronic condition options
export const CHRONIC_CONDITIONS: ChronicCondition[] = [
  'Diabetes',
  'Hypertension',
  'Asthma',
  'Tuberculosis',
  'None',
]
