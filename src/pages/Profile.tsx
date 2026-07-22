import { useState, useEffect } from "react"
import { useAuth } from "@/App"
import { supabase } from "@/lib/supabase"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { User, Mail, Heart, Ruler, Weight, Droplets, Scale, Pencil, Save, X, Activity, Smartphone, MapPin, Phone, Calendar } from "lucide-react"
import { toast } from "sonner"
import { DataExport } from "@/components/shared/DataExport"
import { BiometricAuth } from "@/components/shared/BiometricAuth"
import { PushNotifications } from "@/components/shared/PushNotifications"
import { HealthSync } from "@/components/shared/HealthSync"
import { OcrCapture } from "@/components/shared/OcrCapture"
import { useI18n } from "@/lib/i18n/I18nProvider"
import type { Profile as ProfileType } from "@/types"
import { ProfileSkeleton } from "@/components/skeletons"

export default function Profile() {
  const { user, profile: authProfile } = useAuth()
  const [profile, setProfile] = useState<ProfileType | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<Partial<ProfileType>>({})

  useEffect(() => {
    if (!user) { setLoading(false); return }
    const timer = setTimeout(() => { setLoading(false); toast.error("DB query timed out") }, 12000)
    ;(async () => {
      try {
        const { data } = await supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle()
        setProfile(data ?? (authProfile as ProfileType | null))
        setForm((data ?? authProfile ?? {}) as Partial<ProfileType>)
      } catch (e: any) {
        toast.error("Load error: " + (e?.message || e))
      } finally {
        clearTimeout(timer); setLoading(false)
      }
    })()
  }, [user, authProfile])

  function update(field: keyof ProfileType, value: any) {
    setForm(prev => ({ ...prev, [field]: value || undefined }))
  }

  async function saveProfile() {
    if (!user) return
    setSaving(true)
    const { error } = await supabase.from("profiles").upsert(
      { user_id: user.id, ...form, updated_at: new Date().toISOString() },
      { onConflict: "user_id" }
    )
    if (error) {
      toast.error("Failed to save: " + error.message)
    } else {
      setProfile(form as ProfileType)
      setEditing(false)
      toast.success("Profile updated")
    }
    setSaving(false)
  }

  const bmi = form.height_cm && form.weight_kg
    ? form.weight_kg / ((form.height_cm / 100) ** 2)
    : null

  const bmiCategory = bmi
    ? bmi < 18.5 ? "Underweight"
      : bmi < 25 ? "Normal"
      : bmi < 30 ? "Overweight"
      : "Obese"
    : null

  const bmiColor = bmiCategory === "Normal" ? "text-[#34c759]" : "text-[#ff9f0a]"

  if (loading) return <ProfileSkeleton />

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="rounded-[24px] p-6 lg:p-8 bg-gradient-to-br from-[#007aff] to-[#5856d6] text-white">
        <div className="flex items-center gap-4">
          <div className="w-[56px] h-[56px] rounded-full bg-white/20 flex items-center justify-center">
            <User className="w-[28px] h-[28px]" />
          </div>
          <div>
            <h1 className="text-[24px] font-bold tracking-tight">{profile?.full_name ?? "Your Profile"}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <Mail className="w-[14px] h-[14px] text-white/70" />
              <span className="text-[14px] text-white/80">{profile?.email}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-4">
          <Badge className="bg-white/20 text-white border-0 capitalize">{profile?.role}</Badge>
          {profile?.blood_type && <Badge className="bg-white/20 text-white border-0">{profile.blood_type}</Badge>}
        </div>
      </div>

      {bmi && !editing && (
        <Card className="bg-gradient-to-br from-[#34c759]/10 to-[#34c759]/5 border-[#34c759]/20">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-[40px] h-[40px] rounded-[12px] bg-[#34c759]/15 flex items-center justify-center">
                  <Activity className="w-[20px] h-[20px] text-[#34c759]" />
                </div>
                <div>
                  <p className="text-[13px] text-[#6e6e73] font-medium">Your BMI</p>
                  <p className="text-[22px] font-bold text-[#1d1d1f]">{bmi.toFixed(1)}</p>
                </div>
              </div>
              <Badge className={`${bmiColor} border-0 text-[13px] font-semibold`}>
                {bmiCategory}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {editing ? (
        <div className="space-y-4">
          <Card>
            <CardContent className="p-5 space-y-4">
              <h2 className="text-[17px] font-semibold text-[#1d1d1f]">Personal Details</h2>
              <div className="space-y-1.5">
                <Label htmlFor="profile-full_name" className="text-[13px] text-[#6e6e73]">Full Name</Label>
                <Input id="profile-full_name" value={form.full_name || ""} onChange={e => update("full_name", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="profile-email" className="text-[13px] text-[#6e6e73]">Email</Label>
                <Input id="profile-email" value={form.email || ""} onChange={e => update("email", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="profile-phone" className="text-[13px] text-[#6e6e73]">Phone</Label>
                <Input id="profile-phone" value={form.phone || ""} onChange={e => update("phone", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="profile-date_of_birth" className="text-[13px] text-[#6e6e73]">Date of Birth</Label>
                <Input id="profile-date_of_birth" type="month" value={form.date_of_birth?.slice(0, 7) || ""} onChange={e => update("date_of_birth", e.target.value + "-01")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="profile-location" className="text-[13px] text-[#6e6e73]">Location</Label>
                <Input id="profile-location" value={form.location || ""} onChange={e => update("location", e.target.value)} placeholder="City / Region" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5 space-y-4">
              <h2 className="text-[17px] font-semibold text-[#1d1d1f]">Biometrics</h2>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="profile-height_cm" className="text-[13px] text-[#6e6e73]">Height (cm)</Label>
                  <Input id="profile-height_cm" type="number" step="0.1" value={form.height_cm || ""} onChange={e => update("height_cm", e.target.value ? Number(e.target.value) : undefined)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="profile-weight_kg" className="text-[13px] text-[#6e6e73]">Weight (kg)</Label>
                  <Input id="profile-weight_kg" type="number" step="0.1" value={form.weight_kg || ""} onChange={e => update("weight_kg", e.target.value ? Number(e.target.value) : undefined)} />
                </div>
              </div>
              {bmi && (
                <div className="rounded-[12px] bg-[#f5f5f7] p-3">
                  <p className="text-[13px] text-[#6e6e73]">BMI: <span className="font-semibold text-[#1d1d1f]">{bmi.toFixed(1)}</span> ({bmiCategory})</p>
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="profile-waist_hip_ratio" className="text-[13px] text-[#6e6e73]">Waist-Hip Ratio</Label>
                <Input id="profile-waist_hip_ratio" type="number" step="0.01" value={form.waist_hip_ratio || ""} onChange={e => update("waist_hip_ratio", e.target.value ? Number(e.target.value) : undefined)} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5 space-y-4">
              <h2 className="text-[17px] font-semibold text-[#1d1d1f]">Medical Details</h2>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="profile-blood_type" className="text-[13px] text-[#6e6e73]">Blood Type</Label>
                  <Input id="profile-blood_type" value={form.blood_type || ""} onChange={e => update("blood_type", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="profile-id_number" className="text-[13px] text-[#6e6e73]">ID / Passport No.</Label>
                  <Input id="profile-id_number" value={form.id_number || ""} onChange={e => update("id_number", e.target.value)} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5 space-y-4">
              <h2 className="text-[17px] font-semibold text-[#1d1d1f]">Medical Aid / Insurance</h2>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="profile-medical_scheme" className="text-[13px] text-[#6e6e73]">Scheme</Label>
                  <Input id="profile-medical_scheme" value={form.medical_scheme || ""} onChange={e => update("medical_scheme", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="profile-membership_number" className="text-[13px] text-[#6e6e73]">Membership No.</Label>
                  <Input id="profile-membership_number" value={form.membership_number || ""} onChange={e => update("membership_number", e.target.value)} />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3 pb-4">
            <Button className="flex-1 gap-1.5" onClick={saveProfile} disabled={saving}>
              <Save className="w-[16px] h-[16px]" />
              {saving ? "Saving..." : "Save"}
            </Button>
            <Button variant="outline" className="gap-1.5" onClick={() => { setForm({ ...profile } as Partial<ProfileType>); setEditing(false) }}>
              <X className="w-[16px] h-[16px]" />
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {!editing && (
            <Button
              variant="outline"
              className="w-full gap-1.5"
              onClick={() => setEditing(true)}
            >
              <Pencil className="w-[16px] h-[16px]" />
              Edit Profile
            </Button>
          )}

          <Card>
            <CardContent className="p-5">
              <h2 className="text-[15px] font-semibold text-[#1d1d1f] mb-3">Personal Details</h2>
              <div className="space-y-3">
                <ProfileRow icon={User} label="Full Name" value={profile?.full_name} />
                <ProfileRow icon={Mail} label="Email" value={profile?.email} />
                <ProfileRow icon={Phone} label="Phone" value={profile?.phone} />
                <ProfileRow icon={Calendar} label="Date of Birth" value={profile?.date_of_birth ? new Date(profile.date_of_birth).toLocaleDateString("en-ZA", { month: "long", year: "numeric" }) : undefined} />
                <ProfileRow icon={MapPin} label="Location" value={profile?.location} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <h2 className="text-[15px] font-semibold text-[#1d1d1f] mb-3">Biometrics</h2>
              <div className="space-y-3">
                <ProfileRow icon={Ruler} label="Height" value={profile?.height_cm ? `${profile.height_cm} cm` : undefined} />
                <ProfileRow icon={Weight} label="Weight" value={profile?.weight_kg ? `${profile.weight_kg} kg` : undefined} />
                {bmi && <ProfileRow icon={Activity} label="BMI" value={`${bmi.toFixed(1)} (${bmiCategory})`} />}
                <ProfileRow icon={Droplets} label="Waist-Hip Ratio" value={profile?.waist_hip_ratio?.toFixed(2)} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <h2 className="text-[15px] font-semibold text-[#1d1d1f] mb-3">Medical</h2>
              <div className="space-y-3">
                <ProfileRow icon={Heart} label="Blood Type" value={profile?.blood_type} />
                <ProfileRow icon={Scale} label="ID / Passport" value={profile?.id_number} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <h2 className="text-[15px] font-semibold text-[#1d1d1f] mb-3">Medical Aid</h2>
              <div className="space-y-3">
                <ProfileRow icon={ShieldIcon} label="Scheme" value={profile?.medical_scheme} />
                <ProfileRow icon={Smartphone} label="Membership No." value={profile?.membership_number} />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {!editing && (
        <div className="space-y-4 pt-2">
          <h2 className="text-[17px] font-semibold text-[#1d1d1f]">Features</h2>
          <BiometricAuth />
          <PushNotifications />
          <DataExport />
          <HealthSync />
          <OcrCapture onTextExtracted={(text) => {
            navigator.clipboard?.writeText(text)
            toast.success("Text copied to clipboard")
          }} />
        </div>
      )}
    </div>
  )
}

function ShieldIcon({ className }: { className?: string }) {
  return <Heart className={className} />
}

function ProfileRow({ icon: Icon, label, value }: { icon: any; label: string; value?: string | null }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-[32px] h-[32px] rounded-[8px] bg-[#f5f5f7] flex items-center justify-center flex-shrink-0">
        <Icon className="w-[15px] h-[15px] text-[#6e6e73]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[12px] text-[#6e6e73] uppercase tracking-wide font-medium">{label}</p>
        <p className="text-[15px] font-medium text-[#1d1d1f] truncate">{value ?? "Not set"}</p>
      </div>
    </div>
  )
}

// Re-export Shield icon for the import
export { Shield as ShieldIcon } from "lucide-react"
