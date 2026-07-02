import { useState, useEffect } from "react"
import { useAuth } from "@/App"
import { useI18n } from "@/lib/i18n/I18nProvider"
import { supabase } from "@/lib/supabase"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Activity, Heart, Moon, Ruler } from "lucide-react"
import type { HealthScore } from "@/types"

export function HealthScoreCard() {
  const { t } = useI18n()
  const { user } = useAuth()
  const [score, setScore] = useState<HealthScore | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    async function load() {
      const { data } = await supabase
        .from("health_scores")
        .select("*")
        .eq("user_id", user.id)
        .order("calculated_at", { ascending: false })
        .limit(1)
        .single()
      if (data) setScore(data)
      setLoading(false)
    }
    load()
  }, [user])

  if (loading || !score) return null

  const scoreColor = score.score >= 80 ? "text-[#34c759]" : score.score >= 60 ? "text-[#ff9f0a]" : "text-[#ff3b30]"
  const scoreLabel = score.score >= 80 ? t("scoreExcellent") : score.score >= 60 ? t("scoreGood") : score.score >= 40 ? t("scoreFair") : t("scoreNeedsAttention")

  const factors = [
    { label: t("scoreBMI"), value: score.bmi_score, icon: Ruler, color: "#007aff" },
    { label: t("scoreActivity"), value: score.activity_score, icon: Activity, color: "#34c759" },
    { label: t("scoreSleep"), value: score.sleep_score, icon: Moon, color: "#5856d6" },
    { label: t("scoreHeartRate"), value: score.heart_rate_score, icon: Heart, color: "#ff3b30" },
  ]

  return (
    <Card className="bg-gradient-to-br from-[#007aff]/5 to-[#5856d6]/5 border-[#007aff]/10">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-1">
          <p className="text-[13px] font-medium text-[#6e6e73] uppercase tracking-wider">{t("healthScore")}</p>
          <span className={`text-[12px] font-semibold ${scoreColor}`}>{scoreLabel}</span>
        </div>
        <div className="flex items-baseline gap-1 mb-4">
          <span className={`text-[42px] font-bold ${scoreColor}`}>{score.score}</span>
          <span className="text-[16px] text-[#6e6e73] font-medium">/ 100</span>
        </div>
        <Progress value={score.score} className="h-[6px] mb-5" />
        <div className="space-y-3">
          <p className="text-[13px] text-[#6e6e73] font-medium">{t("scoreFactors")}</p>
          <div className="grid grid-cols-2 gap-3">
            {factors.map(f => (
              <div key={f.label} className="flex items-center gap-2.5 bg-white/60 rounded-[12px] p-2.5">
                <div className="w-[30px] h-[30px] rounded-[8px] flex items-center justify-center" style={{ backgroundColor: f.color + "15" }}>
                  <f.icon className="w-[14px] h-[14px]" style={{ color: f.color }} />
                </div>
                <div>
                  <p className="text-[11px] text-[#6e6e73]">{f.label}</p>
                  <p className="text-[15px] font-semibold text-[#1d1d1f]">{f.value ?? "—"}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
