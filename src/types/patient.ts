export interface Patient {
  id: string
  patient_id: string // Display ID like "P001", "P002"
  full_name: string
  gender: 'male' | 'female' | 'other'
  date_of_birth: string // ISO date format
  language_preference: string
  marital_status: 'single' | 'married' | 'divorced' | 'widowed' | ''
  aadhar_id: string // Indian Aadhar identification number
  mobile_number: string
  village: string
  state: string
  created_at: string
  updated_at: string
  created_by?: string
}

export interface CreatePatientData {
  full_name: string
  gender: 'male' | 'female' | 'other'
  date_of_birth: string
  language_preference: string
  marital_status: 'single' | 'married' | 'divorced' | 'widowed' | ''
  aadhar_id: string
  mobile_number: string
  village: string
  state: string
}

// Indian states for dropdown
export const INDIAN_STATES = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  'Andaman and Nicobar Islands',
  'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi',
  'Jammu and Kashmir',
  'Ladakh',
  'Lakshadweep',
  'Puducherry',
]

// Common languages in India
export const LANGUAGES = [
  'Hindi',
  'English',
  'Bengali',
  'Telugu',
  'Marathi',
  'Tamil',
  'Gujarati',
  'Urdu',
  'Kannada',
  'Odia',
  'Malayalam',
  'Punjabi',
  'Assamese',
  'Maithili',
  'Sanskrit',
  'Other',
]
