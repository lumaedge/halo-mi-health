import { useState, useEffect } from "react"
import { useAuth } from "@/App"
import { supabase } from "@/lib/supabase"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertTriangle, Heart, Phone, User, MapPin, Calendar, Ruler, Weight, Droplets, Ambulance as AmbulanceIcon, Shield, Pencil, Save, X, ChevronRight, UserPlus } from "lucide-react"
import { toast } from "sonner"

interface EmergencyProfile {
  id: string
  full_name: string
  date_of_birth?: string
  location?: string
  blood_type?: string
  height_cm?: number
  weight_kg?: number
  bmi?: number
  waist_hip_ratio?: number
  next_of_kin_name?: string
  next_of_kin_phone?: string
  next_of_kin_relationship?: string
  ambulance_service?: string
  ambulance_number?: string
  medical_scheme?: string
  membership_number?: string
  emergency_contact_name?: string
  emergency_contact_phone?: string
  allergies?: string
}

export default function Emergency() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<EmergencyProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<EmergencyProfile>({} as EmergencyProfile)

  useEffect(() => {
    if (!user) return
    async function load() {
      const { data: prof } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single()
      if (prof) {
        setProfile(prof)
        setForm(prof)
      }
      setLoading(false)
    }
    load()
  }, [user])

  function update(field: keyof EmergencyProfile, value: string | number | undefined) {
    setForm(prev => ({ ...prev, [field]: value || undefined }))
  }

  async function saveProfile() {
    if (!user || !profile) return
    setSaving(true)
    const { error } = await supabase
      .from("profiles")
      .upsert({
        user_id: user.id,
        ...form,
        updated_at: new Date().toISOString(),
      })
    if (error) {
      toast.error("Failed to save: " + error.message)
    } else {
      setProfile(form)
      setEditing(false)
      toast.success("Emergency info updated")
    }
    setSaving(false)
  }

  function cancelEdit() {
    setForm({ ...profile } as EmergencyProfile)
    setEditing(false)
  }

  const age = profile?.date_of_birth
    ? Math.floor((Date.now() - new Date(profile.date_of_birth).getTime()) / 31557600000)
    : null

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-[#007aff] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="rounded-[24px] p-6 bg-gradient-to-br from-[#ff3b30] to-[#ff6b6b] text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="w-[18px] h-[18px]" />
          <span className="text-[13px] font-semibold uppercase tracking-wider opacity-80">Emergency Information</span>
        </div>
        <h1 className="text-[28px] font-bold tracking-tight">Medical ID</h1>
        <p className="text-[14px] text-white/80 mt-1">For first responders & emergency personnel</p>
        {!editing && (
          <Button
            size="sm"
            variant="secondary"
            className="mt-4 bg-white/20 text-white hover:bg-white/30 border-0 gap-1.5"
            onClick={() => setEditing(true)}
          >
            <Pencil className="w-[14px] h-[14px]" />
            Edit
          </Button>
        )}
      </div>

      {editing ? (
        <div className="space-y-4">
          <Card>
            <CardContent className="p-5 space-y-4">
              <h2 className="text-[17px] font-semibold text-[#1d1d1f]">Personal Information</h2>
              <div className="space-y-1.5">
                <Label className="text-[13px] text-[#6e6e73]">Full Name</Label>
                <Input value={form.full_name || ""} onChange={e => update("full_name", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[13px] text-[#6e6e73]">Month & Year of Birth</Label>
                <Input type="month" value={form.date_of_birth?.slice(0, 7) || ""} onChange={e => update("date_of_birth", e.target.value + "-01")} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[13px] text-[#6e6e73]">Location (City / Region)</Label>
                <Input value={form.location || ""} onChange={e => update("location", e.target.value)} placeholder="e.g. Durban, KwaZulu-Natal" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5 space-y-4">
              <h2 className="text-[17px] font-semibold text-[#1d1d1f]">Personal Biometrics</h2>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[13px] text-[#6e6e73]">Height (cm)</Label>
                  <Input type="number" value={form.height_cm || ""} onChange={e => update("height_cm", e.target.value ? Number(e.target.value) : undefined)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[13px] text-[#6e6e73]">Weight (kg)</Label>
                  <Input type="number" value={form.weight_kg || ""} onChange={e => update("weight_kg", e.target.value ? Number(e.target.value) : undefined)} />
                </div>
              </div>
              {form.height_cm && form.weight_kg && (
                <p className="text-[13px] text-[#007aff] font-medium">
                  BMI: {(form.weight_kg / ((form.height_cm / 100) ** 2)).toFixed(1)}
                </p>
              )}
              <div className="space-y-1.5">
                <Label className="text-[13px] text-[#6e6e73]">Waist-Hip Ratio</Label>
                <Input type="number" step="0.01" value={form.waist_hip_ratio || ""} onChange={e => update("waist_hip_ratio", e.target.value ? Number(e.target.value) : undefined)} placeholder="e.g. 0.85" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5 space-y-4">
              <h2 className="text-[17px] font-semibold text-[#1d1d1f]">Medical Details</h2>
              <div className="space-y-1.5">
                <Label className="text-[13px] text-[#6e6e73]">Blood Type</Label>
                <Input value={form.blood_type || ""} onChange={e => update("blood_type", e.target.value)} placeholder="e.g. A+" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[13px] text-[#6e6e73]">Allergies</Label>
                <Input value={form.allergies || ""} onChange={e => update("allergies", e.target.value)} placeholder="e.g. Penicillin, Peanuts" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5 space-y-4">
              <h2 className="text-[17px] font-semibold text-[#1d1d1f]">Next of Kin</h2>
              <div className="space-y-1.5">
                <Label className="text-[13px] text-[#6e6e73]">Full Name</Label>
                <Input value={form.next_of_kin_name || ""} onChange={e => update("next_of_kin_name", e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[13px] text-[#6e6e73]">Phone</Label>
                  <Input value={form.next_of_kin_phone || ""} onChange={e => update("next_of_kin_phone", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[13px] text-[#6e6e73]">Relationship</Label>
                  <Input value={form.next_of_kin_relationship || ""} onChange={e => update("next_of_kin_relationship", e.target.value)} placeholder="e.g. Spouse" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5 space-y-4">
              <h2 className="text-[17px] font-semibold text-[#1d1d1f]">Emergency Contacts</h2>
              <div className="space-y-1.5">
                <Label className="text-[13px] text-[#6e6e73]">Contact Name</Label>
                <Input value={form.emergency_contact_name || ""} onChange={e => update("emergency_contact_name", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[13px] text-[#6e6e73]">Contact Phone</Label>
                <Input value={form.emergency_contact_phone || ""} onChange={e => update("emergency_contact_phone", e.target.value)} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5 space-y-4">
              <h2 className="text-[17px] font-semibold text-[#1d1d1f]">Ambulance Service</h2>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[13px] text-[#6e6e73]">Service Name</Label>
                  <Input value={form.ambulance_service || ""} onChange={e => update("ambulance_service", e.target.value)} placeholder="e.g. Netcare 911" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[13px] text-[#6e6e73]">Number</Label>
                  <Input value={form.ambulance_number || ""} onChange={e => update("ambulance_number", e.target.value)} placeholder="e.g. 082 911" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5 space-y-4">
              <h2 className="text-[17px] font-semibold text-[#1d1d1f]">Health Insurance / Medical Aid</h2>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[13px] text-[#6e6e73]">Scheme</Label>
                  <Input value={form.medical_scheme || ""} onChange={e => update("medical_scheme", e.target.value)} placeholder="e.g. Discovery Health" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[13px] text-[#6e6e73]">Membership No.</Label>
                  <Input value={form.membership_number || ""} onChange={e => update("membership_number", e.target.value)} />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3 pb-4">
            <Button className="flex-1 gap-1.5" onClick={saveProfile} disabled={saving}>
              <Save className="w-[16px] h-[16px]" />
              {saving ? "Saving..." : "Save All"}
            </Button>
            <Button variant="outline" className="gap-1.5" onClick={cancelEdit}>
              <X className="w-[16px] h-[16px]" />
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-[15px] font-semibold text-[#1d1d1f]">Personal Information</h2>
                <User className="w-[18px] h-[18px] text-[#6e6e73]" />
              </div>
              <div className="space-y-3">
                <Row icon={User} label="Full Name" value={profile?.full_name} />
                <Row icon={Calendar} label="Date of Birth" value={profile?.date_of_birth ? new Date(profile.date_of_birth).toLocaleDateString("en-ZA", { month: "long", year: "numeric" }) : null} />
                <Row icon={MapPin} label="Location" value={profile?.location} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-[15px] font-semibold text-[#1d1d1f]">Biometrics</h2>
                <Heart className="w-[18px] h-[18px] text-[#ff3b30]" />
              </div>
              <div className="space-y-3">
                <Row icon={Ruler} label="Height" value={profile?.height_cm ? `${profile.height_cm} cm` : null} />
                <Row icon={Weight} label="Weight" value={profile?.weight_kg ? `${profile.weight_kg} kg` : null} />
                {profile?.height_cm && profile?.weight_kg && (
                  <Row icon={Heart} label="BMI" value={(profile.weight_kg / ((profile.height_cm / 100) ** 2)).toFixed(1)} />
                )}
                <Row icon={Droplets} label="Waist-Hip Ratio" value={profile?.waist_hip_ratio?.toFixed(2)} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-[15px] font-semibold text-[#1d1d1f]">Medical</h2>
                <Heart className="w-[18px] h-[18px] text-[#ff3b30]" />
              </div>
              <div className="space-y-3">
                <Row icon={Droplets} label="Blood Type" value={profile?.blood_type} />
                <Row icon={AlertTriangle} label="Allergies" value={profile?.allergies} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-[15px] font-semibold text-[#1d1d1f]">Next of Kin</h2>
                <UserPlus className="w-[18px] h-[18px] text-[#6e6e73]" />
              </div>
              <div className="space-y-3">
                <Row icon={User} label="Name" value={profile?.next_of_kin_name} />
                <Row icon={Phone} label="Phone" value={profile?.next_of_kin_phone} />
                <Row icon={ChevronRight} label="Relationship" value={profile?.next_of_kin_relationship} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-[15px] font-semibold text-[#1d1d1f]">Emergency Contact</h2>
                <Phone className="w-[18px] h-[18px] text-[#ff3b30]" />
              </div>
              <div className="space-y-3">
                <Row icon={User} label="Name" value={profile?.emergency_contact_name} />
                <Row icon={Phone} label="Phone" value={profile?.emergency_contact_phone} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-[15px] font-semibold text-[#1d1d1f]">Ambulance Service</h2>
                <AmbulanceIcon className="w-[18px] h-[18px] text-[#ff3b30]" />
              </div>
              <div className="space-y-3">
                <Row icon={AmbulanceIcon} label="Service" value={profile?.ambulance_service} />
                <Row icon={Phone} label="Number" value={profile?.ambulance_number} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-[15px] font-semibold text-[#1d1d1f]">Health Insurance</h2>
                <Shield className="w-[18px] h-[18px] text-[#34c759]" />
              </div>
              <div className="space-y-3">
                <Row icon={Shield} label="Scheme" value={profile?.medical_scheme} />
                <Row icon={Shield} label="Membership No." value={profile?.membership_number} />
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

function Row({ icon: Icon, label, value }: { icon: any; label: string; value: string | number | null | undefined }) {
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
