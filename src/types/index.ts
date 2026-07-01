export type UserRole = "patient" | "provider" | "admin" | "caregiver"

export interface Profile {
  id: string
  user_id: string
  role: UserRole
  full_name: string
  email: string
  phone?: string
  avatar_url?: string
  date_of_birth?: string
  blood_type?: string
  location?: string
  height_cm?: number
  weight_kg?: number
  waist_hip_ratio?: number
  next_of_kin_name?: string
  next_of_kin_phone?: string
  next_of_kin_relationship?: string
  ambulance_service?: string
  ambulance_number?: string
  medical_scheme?: string
  membership_number?: string
  allergies?: string
  emergency_contact_name?: string
  emergency_contact_phone?: string
  id_number?: string
  created_at: string
  updated_at: string
}

export type RecordType =
  | "consultation"
  | "prescription"
  | "lab_result"
  | "imaging"
  | "referral"
  | "vaccination"
  | "procedure"
  | "medical_certificate"
  | "note"

export interface MedicalRecord {
  id: string
  patient_id: string
  provider_id?: string
  record_type: RecordType
  title: string
  description?: string
  date: string
  is_approved: boolean
  is_handwritten: boolean
  original_image_url?: string
  enhanced_image_url?: string
  ocr_text?: string
  ai_summary?: string
  tags?: string[]
  created_at: string
  updated_at: string
}

export interface TimelineEvent {
  id: string
  patient_id: string
  record_id?: string
  event_type: RecordType
  title: string
  description?: string
  date: string
  provider_name?: string
  metadata?: Record<string, unknown>
}

export interface Medication {
  id: string
  patient_id: string
  provider_id: string
  name: string
  dosage: string
  frequency: string
  route?: string
  start_date: string
  end_date?: string
  is_active: boolean
  instructions?: string
  prescribed_by: string
  created_at: string
}

export interface Allergy {
  id: string
  patient_id: string
  allergen: string
  severity: "mild" | "moderate" | "severe"
  reaction?: string
  notes?: string
}

export interface Condition {
  id: string
  patient_id: string
  name: string
  diagnosis_date?: string
  is_chronic: boolean
  notes?: string
}

export interface ShareLink {
  id: string
  patient_id: string
  record_ids: string[]
  token: string
  expires_at: string
  is_active: boolean
  access_count: number
  created_at: string
}

export interface Appointment {
  id: string
  patient_id: string
  provider_id: string
  title: string
  date: string
  status: "scheduled" | "completed" | "cancelled" | "no_show"
  type?: string
  notes?: string
  created_at: string
}

export interface AuditLog {
  id: string
  user_id: string
  action: string
  resource: string
  resource_id?: string
  details?: Record<string, unknown>
  ip_address?: string
  created_at: string
}
