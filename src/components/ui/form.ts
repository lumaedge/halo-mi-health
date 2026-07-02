import React from "react"
import { useState, useEffect, useCallback } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { CalendarIcon, Clock, Shield, Heart, Activity, Weight, Ruler, Droplets, Pill, AlertTriangle, User, ActivitySquare, Plus, Minus, X, Check, ChevronRight, Sparkles, Upload, Camera, HeartPulse, PillBottle, Bell, RotateCw, RotateCwOff, Users, Phone, MapPin, FileText, CreditCard, Archive, ArchiveRestore, AlertCircle, Activity as LucideIconsType
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/App"

// Type definitions
interface ProfileType {
  id: string
  user_id: string
  full_name: string
  email: string
  role: "patient" | "provider" | "admin" | "caregiver"
  date_of_birth?: string
  phone?: string
  location?: string
  height_cm?: number
  weight_kg?: number
  blood_type?: string
  waist_hip_ratio?: number
  medical_scheme?: string
  membership_number?: string
  biometric_data?: any
  emergency_contacts?: any
  insurance_info?: any
  next_of_kin?: any
  ambulance_details?: any
  profile_image_url?: string
  created_at: string
  updated_at: string
}

interface Medication {
  id: string
  patient_id: string
  name: string
  dosage: string
  frequency: string
  route: string
  instructions: string
  is_active: boolean
  start_date?: string
  end_date?: string
  prescribed_by?: string
  last_refill_date?: string
  next_refill_date?: string
  refills_remaining?: number
  status?: string
  created_at: string
  updated_at: string
}

interface Condition {
  id: string
  patient_id: string
  name: string
  diagnosis_date?: string
  is_chronic: boolean
  notes?: string
  severity?: string
  doctor?: string
  clinic?: string
  status: string
  created_at: string
  updated_at: string
}

interface Reminder {
  id: string
  patient_id: string
  title: string
  description?: string
  type: ReminderType
  frequency: ReminderFrequency
  due_date: string
  due_time?: string
  is_enabled: boolean
  completed_dates?: string[]
  next_due_date?: string
  snooze_until?: string
  custom_repeat?: boolean
  custom_repeat_days?: number
  custom_repeat_end_date?: string
  created_at: string
  updated_at: string
}

interface EmergencyInfo {
  id: string
  patient_id: string
  date_of_birth?: string
  location?: string
  biometric_data?: {
    blood_type?: string
    height?: string
    weight?: string
    allergies?: string
    medications?: string
    chronic_conditions?: string
  }
  next_of_kin?: {
    name: string
    relationship: string
    phone: string
    address?: string
  }
  ambulance?: {
    blood_type?: string
    ambulance_number?: string
    hospital?: string
  }
  insurance?: {
    provider: string
    policy_number: string
    group_number?: string
  }
  emergency_contacts?: any
  created_at: string
  updated_at: string
}

interface TimelineEvent {
  id: string
  patient_id: string
  title: string
  description?: string
  event_type: "consultation" | "lab" | "medication" | "condition" | "note" | "reminder" | "upload"
  date: string
  file_name?: string
  notes?: string
  created_at: string
}

interface MedicalRecord {
  id: string
  patient_id: string
  provider_id?: string
  title: string
  description?: string
  file_path?: string
  file_name: string
  file_type: string
  file_size?: number
  file_url?: string
  notes?: string
  status: "draft" | "pending_review" | "approved" | "rejected"
  reviewed_by?: string
  reviewed_at?: string
  review_notes?: string
  created_at: string
  updated_at: string
  patient?: {
    full_name: string
    email: string
  }
}

interface HealthCheck {
  id: string
  patient_id: string
  year: number
  age_group: string
  completed_items: string[]
  status: "not-started" | "in-progress" | "completed"
  created_at: string
  updated_at: string
}

// Enums for types
export type ReminderType = "prescription_refill" | "health_check" | "appointment" | "custom" | "exercise" | "meditation" | "water_intake" | "sleep"
export type ReminderFrequency = "daily" | "weekly" | "monthly" | "yearly" | "custom"

// Form components
interface SimpleFormFieldProps {
  label: string
  value: string | number
  onChange: (value: any) => void
  placeholder?: string
  type?: string
  options?: { value: string; label: string }[]
  className?: string
}

function SimpleFormField({ label, value, onChange, placeholder, type = "text", options, className }: SimpleFormFieldProps) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[13px] text-[#6e6e73]">{label}</Label>
      {type === "textarea" ? (
        <Textarea
          value={value as string}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={className}
        />
      ) : type === "select" ? (
        <Select value={value as string} onValueChange={onChange}>
          <SelectTrigger className="w-full rounded-[14px] border border-[#e5e5ea] bg-white px-4 py-2.5 text-[14px] text-[#1d1d1f] focus:outline-none focus:ring-1 focus:ring-[#007aff] transition-all duration-200">
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent className="bg-white border border-[#e5e5ea] shadow-lg rounded-[12px]">
            {options?.map((option) => (
              <SelectItem key={option.value} value={option.value} className="hover:bg-[#f5f5f7] cursor-pointer px-4 py-2.5 text-[14px]">
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <Input
          type={type}
          value={value as string}
          onChange={(e) => onChange(type === "number" ? Number(e.target.value) : e.target.value)}
          placeholder={placeholder}
          className={className}
        />
      )}
    </div>
  )
}

// Component exports
export { SimpleFormField }
