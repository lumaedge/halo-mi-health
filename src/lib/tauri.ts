import { invoke } from "@tauri-apps/api/core"

export interface UploadResult {
  success: boolean
  record_id?: string
  error?: string
}

export interface MedicalRecordData {
  id: string
  patient_id: string
  provider_id?: string
  record_type: string
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

export interface ProfileData {
  id: string
  user_id: string
  role: string
  full_name: string
  email: string
}

export async function tauriUpsertProfile(
  userId: string,
  email: string,
  fullName: string
): Promise<{ profile?: ProfileData; error?: string }> {
  return invoke("upsert_profile", { userId, email, fullName })
}

export async function tauriGetPatientRecords(
  userId: string
): Promise<{ records: MedicalRecordData[]; error?: string }> {
  return invoke("get_patient_records", { userId })
}

export async function tauriUploadHandwrittenNote(
  userId: string,
  userEmail: string,
  userFullName: string,
  fileData: number[],
  fileName: string,
  fileType: string,
  title: string,
  description: string,
  recordType: string
): Promise<UploadResult> {
  return invoke("upload_handwritten_note", {
    userId,
    userEmail,
    userFullName,
    fileData,
    fileName,
    fileType,
    title,
    description,
    recordType,
  })
}

export async function tauriGetRecordImage(
  path: string
): Promise<{ data?: string; mime_type?: string; error?: string }> {
  return invoke("get_record_image", { path })
}
