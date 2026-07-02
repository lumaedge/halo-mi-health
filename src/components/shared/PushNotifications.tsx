import { useState, useEffect } from "react"
import { useAuth } from "@/App"
import { useI18n } from "@/lib/i18n/I18nProvider"
import { supabase } from "@/lib/supabase"
import { Card, CardContent } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Bell } from "lucide-react"
import { toast } from "sonner"

export function PushNotifications() {
  const { t } = useI18n()
  const { user } = useAuth()
  const [pushEnabled, setPushEnabled] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    supabase.from("profiles").select("push_enabled").eq("user_id", user.id).single().then(({ data }) => {
      if (data) setPushEnabled(data.push_enabled)
      setLoading(false)
    })
  }, [user])

  async function toggle(v: boolean) {
    if (!user) return
    setPushEnabled(v)
    await supabase.from("profiles").upsert({ user_id: user.id, push_enabled: v, updated_at: new Date().toISOString() })
    toast.success(v ? t("pushEnabled") : t("pushDisable"))
  }

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[12px] bg-[#fef0d9] flex items-center justify-center">
              <Bell className="w-5 h-5 text-[#ff9f0a]" />
            </div>
            <div>
              <p className="text-[15px] font-medium text-[#1d1d1f]">{t("notifications")}</p>
              <p className="text-[12px] text-[#6e6e73]">{t("pushEnabled")}</p>
            </div>
          </div>
          <Switch checked={pushEnabled} onCheckedChange={toggle} disabled={loading} />
        </div>
      </CardContent>
    </Card>
  )
}
