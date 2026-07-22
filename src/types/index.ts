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

export type ReminderType = "prescription_refill" | "health_check" | "appointment" | "custom"
export type ReminderFrequency = "once" | "daily" | "weekly" | "monthly" | "annual" | "bi_annual"

export interface Reminder {
  id: string
  user_id: string
  type: ReminderType
  title: string
  description?: string
  frequency: ReminderFrequency
  frequency_months: number[]
  next_due_date?: string
  last_notified?: string
  enabled: boolean
  linked_type?: string
  linked_id?: string
  last_completed?: string
  created_at: string
  updated_at: string
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

export interface HealthScore {
  id: string
  user_id: string
  score: number
  bmi_score?: number
  activity_score?: number
  sleep_score?: number
  heart_rate_score?: number
  factors?: Record<string, unknown>
  calculated_at: string
  created_at: string
}

export interface Message {
  id: string
  sender_id: string
  receiver_id: string
  content: string
  is_read: boolean
  created_at: string
}

export interface HealthSyncData {
  id: string
  user_id: string
  source: "apple_health" | "google_fit" | "manual"
  data_type: string
  value: number
  unit: string
  recorded_at: string
  created_at: string
}

export interface MedicationDose {
  id: string
  medication_id: string
  patient_id: string
  scheduled_time: string
  taken_at?: string
  status: "taken" | "skipped" | "snoozed"
  notes?: string
  created_at: string
}

export type VitalSignType = "blood_pressure_systolic" | "blood_pressure_diastolic" | "blood_sugar" | "heart_rate" | "oxygen_saturation" | "temperature" | "respiratory_rate"

export interface VitalSign {
  id: string
  patient_id: string
  type: VitalSignType
  value: number
  unit: string
  recorded_at: string
  notes?: string
  source: "manual" | "apple_health" | "google_fit" | "device"
  created_at: string
}

export interface ConditionGoal {
  id: string
  condition_id: string
  patient_id: string
  metric: string
  target_value: number
  current_value?: number
  unit?: string
  comparison: "lt" | "lte" | "gt" | "gte" | "eq"
  achieved: boolean
  started_at: string
  target_date?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface Consultation {
  id: string
  patient_id: string
  symptoms: string[]
  severity: "mild" | "moderate" | "severe"
  description?: string
  urgency: "self-care" | "appointment" | "urgent" | "emergency"
  possible_conditions?: string[]
  recommendation?: string
  ai_summary?: string
  created_at: string
}

export interface ConsultationImage {
  id: string
  consultation_id?: string
  patient_id: string
  storage_path: string
  image_type: "symptom_photo" | "rash" | "wound" | "other"
  ai_analysis?: string
  created_at: string
}
