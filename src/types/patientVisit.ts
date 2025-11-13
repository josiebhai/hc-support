export type ChronicCondition = 'Diabetes' | 'Hypertension' | 'Asthma' | 'Tuberculosis' | 'None'

export type MedicineFrequency = 'Once daily' | 'Twice daily' | 'Three times daily' | 'Four times daily' | 'Every 4 hours' | 'Every 6 hours' | 'Every 8 hours' | 'Every 12 hours' | 'As needed' | 'Before bed'

export type MealTiming = 'Before food' | 'After food' | 'With food' | 'Empty stomach' | 'Not applicable'

export interface Medicine {
  id: string
  medicine_name: string
  dosage: string
  frequency: MedicineFrequency | string
  duration: string // e.g., "7 days", "2 weeks", "1 month"
  meal_timing: MealTiming | string
  notes?: string
}

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
  medicines?: Medicine[] // Structured prescription list
  
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
  medicines?: Medicine[]
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
  medicines?: Medicine[]
}

// Chronic condition options
export const CHRONIC_CONDITIONS: ChronicCondition[] = [
  'Diabetes',
  'Hypertension',
  'Asthma',
  'Tuberculosis',
  'None',
]

// Medicine frequency options
export const MEDICINE_FREQUENCIES: MedicineFrequency[] = [
  'Once daily',
  'Twice daily',
  'Three times daily',
  'Four times daily',
  'Every 4 hours',
  'Every 6 hours',
  'Every 8 hours',
  'Every 12 hours',
  'As needed',
  'Before bed',
]

// Meal timing options
export const MEAL_TIMINGS: MealTiming[] = [
  'Before food',
  'After food',
  'With food',
  'Empty stomach',
  'Not applicable',
]
