import { useState, useEffect } from "react"
import { useAuth } from "@/App"
import { useI18n } from "@/lib/i18n/I18nProvider"
import { supabase } from "@/lib/supabase"
import { Card, CardContent } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Fingerprint, Smartphone } from "lucide-react"
import { toast } from "sonner"

export function BiometricAuth() {
  const { t } = useI18n()
  const { user } = useAuth()
  const [biometricEnabled, setBiometricEnabled] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isCapacitor, setIsCapacitor] = useState(false)

  useEffect(() => {
    setIsCapacitor(typeof (window as any).Capacitor !== "undefined")
    if (!user) return
    supabase.from("profiles").select("biometric_enabled").eq("user_id", user.id).single().then(({ data }) => {
      if (data) setBiometricEnabled(data.biometric_enabled)
      setLoading(false)
    })
  }, [user])

  async function toggle(v: boolean) {
    if (!user) return
    setBiometricEnabled(v)
    await supabase.from("profiles").upsert({ user_id: user.id, biometric_enabled: v, updated_at: new Date().toISOString() })
    toast.success(v ? t("biometricEnabled") : t("biometricSetup"))
  }

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[12px] bg-[#f0e8ff] flex items-center justify-center">
              <Fingerprint className="w-5 h-5 text-[#5856d6]" />
            </div>
            <div>
              <p className="text-[15px] font-medium text-[#1d1d1f]">{t("biometricSetup")}</p>
              <p className="text-[12px] text-[#6e6e73]">
                {isCapacitor ? t("biometricEnable") : "Available on mobile app"}
              </p>
            </div>
          </div>
          <Switch checked={biometricEnabled} onCheckedChange={toggle} disabled={!isCapacitor || loading} />
        </div>
      </CardContent>
    </Card>
  )
}
