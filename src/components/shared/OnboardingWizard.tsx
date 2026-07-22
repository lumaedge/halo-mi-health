import { useState } from "react"
import { useAuth } from "@/App"
import { useI18n } from "@/lib/i18n/I18nProvider"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Heart, User, Phone, Bell, Shield, ChevronRight, ChevronLeft, Check } from "lucide-react"

interface Props {
  onComplete: () => void
}

export function OnboardingWizard({ onComplete }: Props) {
  const { t, language, setLanguage } = useI18n()
  const { user } = useAuth()
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    dateOfBirth: "",
    bloodType: "",
    allergies: "",
    emergencyContact: "",
    emergencyPhone: "",
    language: "en",
    pushEnabled: true,
  })

  const steps = [
    {
      title: t("onboardingStep1"),
      icon: User,
      content: (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-[13px] text-[#6e6e73]">{t("fullName")}</Label>
            <Input value={form.fullName} onChange={e => setForm(p => ({ ...p, fullName: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[13px] text-[#6e6e73]">{t("phone")}</Label>
            <Input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} type="tel" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[13px] text-[#6e6e73]">{t("dateOfBirth")}</Label>
            <Input type="month" value={form.dateOfBirth} onChange={e => setForm(p => ({ ...p, dateOfBirth: e.target.value + "-01" }))} />
          </div>
        </div>
      ),
    },
    {
      title: t("onboardingStep2"),
      icon: Heart,
      content: (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-[13px] text-[#6e6e73]">{t("bloodType")}</Label>
            <Input value={form.bloodType} onChange={e => setForm(p => ({ ...p, bloodType: e.target.value }))} placeholder="A+, B-, O+..." />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[13px] text-[#6e6e73]">{t("allergies")}</Label>
            <Input value={form.allergies} onChange={e => setForm(p => ({ ...p, allergies: e.target.value }))} placeholder="Penicillin, peanuts..." />
          </div>
        </div>
      ),
    },
    {
      title: t("onboardingStep3"),
      icon: Phone,
      content: (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-[13px] text-[#6e6e73]">{t("emergencyContact")}</Label>
            <Input value={form.emergencyContact} onChange={e => setForm(p => ({ ...p, emergencyContact: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[13px] text-[#6e6e73]">{t("phone")}</Label>
            <Input value={form.emergencyPhone} onChange={e => setForm(p => ({ ...p, emergencyPhone: e.target.value }))} type="tel" />
          </div>
        </div>
      ),
    },
    {
      title: t("onboardingStep4"),
      icon: Bell,
      content: (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-[13px] text-[#6e6e73]">{t("language")}</Label>
            <div className="flex gap-2">
              {["en", "zu", "xh", "af"].map(code => (
                <button
                  key={code}
                  onClick={() => { setForm(p => ({ ...p, language: code })); setLanguage(code as any) }}
                  className={`flex-1 py-2.5 px-3 rounded-[12px] text-[14px] font-medium transition-all ${
                    form.language === code ? "bg-[#007aff] text-white" : "bg-[#f5f5f7] text-[#1d1d1f] hover:bg-[#e5e5ea]"
                  }`}
                >
                  {code === "en" ? "English" : code === "zu" ? "isiZulu" : code === "xh" ? "isiXhosa" : "Afrikaans"}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between rounded-[14px] bg-[#f5f5f7] p-4">
            <div>
              <p className="text-[15px] font-medium text-[#1d1d1f]">{t("notifications")}</p>
              <p className="text-[13px] text-[#6e6e73]">{t("pushEnabled")}</p>
            </div>
            <Switch checked={form.pushEnabled} onCheckedChange={v => setForm(p => ({ ...p, pushEnabled: v }))} />
          </div>
        </div>
      ),
    },
  ]

  async function finish() {
    if (!user) return
    setSaving(true)
    try {
      await supabase.from("profiles").upsert({
        user_id: user.id,
        full_name: form.fullName || undefined,
        phone: form.phone || undefined,
        date_of_birth: form.dateOfBirth || undefined,
        blood_type: form.bloodType || undefined,
        allergies: form.allergies || undefined,
        emergency_contact_name: form.emergencyContact || undefined,
        emergency_contact_phone: form.emergencyPhone || undefined,
        language: form.language,
        push_enabled: form.pushEnabled,
        onboarding_completed: true,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" })
    } catch (e) {
      console.error("Onboarding save error", e)
    }
    setSaving(false)
    onComplete()
  }

  const isLast = step === steps.length - 1
  const CurrentIcon = steps[step].icon

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#f5f5f7]">
      <div className="w-full max-w-md mx-auto px-6 py-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#007aff] to-[#5856d6] flex items-center justify-center mx-auto mb-4">
            <Heart className="w-8 h-8 text-white" fill="white" />
          </div>
          <h1 className="text-[28px] font-bold text-[#1d1d1f] tracking-tight">{t("onboardingWelcome")}</h1>
          <p className="text-[15px] text-[#6e6e73] mt-1">{t("onboardingSub")}</p>
        </div>

        <div className="flex items-center justify-center gap-2 mb-8">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === step ? "w-8 bg-[#007aff]" : i < step ? "w-6 bg-[#34c759]" : "w-6 bg-[#e5e5ea]"
              }`}
            />
          ))}
        </div>

        <div className="bg-white rounded-[24px] p-6 shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-[12px] bg-[#e8f0fe] flex items-center justify-center">
              <CurrentIcon className="w-5 h-5 text-[#007aff]" />
            </div>
            <div>
              <p className="text-[13px] text-[#6e6e73] font-medium">
                {t("onboardingStep1")} {step + 1}/{steps.length}
              </p>
              <p className="text-[17px] font-semibold text-[#1d1d1f]">{steps[step].title}</p>
            </div>
          </div>
          {steps[step].content}
        </div>

        <div className="flex gap-3 mt-6">
          {step > 0 && (
            <Button variant="outline" className="flex-1 gap-1.5" onClick={() => setStep(s => s - 1)}>
              <ChevronLeft className="w-4 h-4" />
              {t("onboardingPrev")}
            </Button>
          )}
          {step > 0 && step < steps.length - 1 && (
            <Button className="flex-1" onClick={() => setStep(s => s + 1)}>
              {t("onboardingNext")} <ChevronRight className="w-4 h-4" />
            </Button>
          )}
          {step === 0 && (
            <div className="flex gap-3 w-full">
              <Button variant="outline" className="flex-1" onClick={onComplete}>
                {t("onboardingSkip")}
              </Button>
              <Button className="flex-1" onClick={() => setStep(s => s + 1)}>
                {t("onboardingNext")} <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
          {isLast && (
            <Button className="flex-1 gap-1.5" onClick={finish} disabled={saving}>
              <Check className="w-4 h-4" />
              {saving ? t("saving") : t("onboardingFinish")}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
