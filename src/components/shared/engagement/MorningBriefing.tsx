import { useState, useEffect } from "react"
import { useAuth } from "@/App"
import { useI18n } from "@/lib/i18n/I18nProvider"
import { supabase } from "@/lib/supabase"
import { getStreak, streakEmoji } from "@/lib/streaks"
import { useNavigate } from "react-router-dom"
import { Heart, Bell, Activity, ChevronRight, Moon, Sun, Cloud, ArrowRight, Sparkles } from "lucide-react"

export function MorningBriefing() {
  const { t } = useI18n()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [show, setShow] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [tomorrowReminders, setTomorrowReminders] = useState(0)
  const [weather, setWeather] = useState<string | null>(null)
  const [data, setData] = useState({
    score: 0,
    scoreLabel: "",
    reminders: 0,
    steps: 0,
    sleep: 0,
    streak: 0,
    streakEmoji: "🌱",
  })

  const hour = new Date().getHours()
  const isEvening = hour >= 18 && hour <= 22
  const isMorning = hour >= 6 && hour <= 11

  useEffect(() => {
    const key = "halo-briefing-dismissed"
    const dismissedDate = localStorage.getItem(key)
    if (dismissedDate === new Date().toISOString().slice(0, 10)) {
      setDismissed(true)
      return
    }

    if (!isMorning && !isEvening) return
    if (!user) return

    async function load() {
      const streak = getStreak()

      const [scoreRes, remindersRes, tomorrowRes, syncRes] = await Promise.all([
        supabase.from("health_scores").select("score").eq("user_id", user.id).order("calculated_at", { ascending: false }).limit(1),
        supabase.from("reminders").select("id").eq("user_id", user.id).eq("enabled", true).eq("next_due_date", new Date().toISOString().slice(0, 10)),
        supabase.from("reminders").select("id").eq("user_id", user.id).eq("enabled", true).eq("next_due_date", new Date(Date.now() + 86400000).toISOString().slice(0, 10)),
        supabase.from("health_sync_data").select("data_type, value").eq("user_id", user.id).order("recorded_at", { ascending: false }).limit(10),
      ])

      const score = scoreRes.data?.[0]?.score ?? 0
      const scoreLabel = score >= 80 ? t("scoreExcellent") : score >= 60 ? t("scoreGood") : t("scoreFair")
      const reminders = remindersRes.data?.length ?? 0

      const latest: Record<string, number> = {}
      for (const item of syncRes.data ?? []) {
        if (!(item.data_type in latest)) latest[item.data_type] = item.value
      }

      setData({
        score,
        scoreLabel,
        reminders,
        steps: Math.round(latest.step_count ?? 0),
        sleep: latest.sleep_hours ?? 0,
        streak: streak.currentStreak,
        streakEmoji: streakEmoji(streak.currentStreak),
      })
      setTomorrowReminders(tomorrowRes.data?.length ?? 0)

      // Simple weather via geolocation + free API
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 3000 })
        )
        const resp = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${pos.coords.latitude}&longitude=${pos.coords.longitude}&current_weather=true&timezone=auto`
        )
        const w = await resp.json()
        const temp = Math.round(w.current_weather?.temperature ?? 0)
        const code = w.current_weather?.weathercode ?? 0
        const condition = code === 0 ? "Clear" : code < 3 ? "Cloudy" : code < 50 ? "Rain" : "Storm"
        setWeather(`${temp}°C ${condition}`)
      } catch {
        setWeather(null)
      }

      setShow(true)
    }
    load()
  }, [user, t, isMorning, isEvening])

  if (!show || dismissed) return null

  function dismiss() {
    localStorage.setItem("halo-briefing-dismissed", new Date().toISOString().slice(0, 10))
    setDismissed(true)
  }

  const firstName = user?.user_metadata?.full_name?.split(" ")[0] ?? "there"
  const greeting = isMorning ? t("goodMorning") : "Good evening"

  return (
    <div className={`rounded-[24px] p-6 text-white relative overflow-hidden animate-slide-up ${
      isMorning
        ? "bg-gradient-to-br from-[#007aff] to-[#5856d6]"
        : "bg-gradient-to-br from-[#1d1d1f] to-[#2d2d2f]"
    }`}>
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

      <button onClick={dismiss} className="absolute top-3 right-3 text-white/50 hover:text-white/80 text-[20px] leading-none">&times;</button>

      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-[20px] font-bold tracking-tight">
            {greeting}, {firstName}.
          </h2>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-white/70 text-[14px]">
              {data.streakEmoji} Day {data.streak}
            </span>
            {weather && (
              <span className="text-white/50 text-[13px] flex items-center gap-1">
                <Cloud className="w-3 h-3" /> {weather}
              </span>
            )}
          </div>
        </div>
        <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center backdrop-blur-sm">
          {isMorning ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </div>
      </div>

      {isMorning ? (
        <div className="grid grid-cols-3 gap-3 mt-5">
          <button onClick={() => navigate("/health-checks")} className="bg-white/15 rounded-[16px] p-3 text-center backdrop-blur-sm hover:bg-white/25 transition-colors">
            <Activity className="w-5 h-5 mx-auto text-white/80" />
            <p className="text-[22px] font-bold mt-1">{data.score}</p>
            <p className="text-[11px] text-white/70">{data.scoreLabel}</p>
          </button>
          <button onClick={() => navigate("/reminders")} className="bg-white/15 rounded-[16px] p-3 text-center backdrop-blur-sm hover:bg-white/25 transition-colors">
            <Bell className="w-5 h-5 mx-auto text-white/80" />
            <p className="text-[22px] font-bold mt-1">{data.reminders}</p>
            <p className="text-[11px] text-white/70">due today</p>
          </button>
          <button onClick={() => navigate("/medications")} className="bg-white/15 rounded-[16px] p-3 text-center backdrop-blur-sm hover:bg-white/25 transition-colors">
            <Heart className="w-5 h-5 mx-auto text-white/80" />
            <p className="text-[22px] font-bold mt-1">{data.steps > 0 ? (data.steps / 1000).toFixed(1) + "k" : "—"}</p>
            <p className="text-[11px] text-white/70">steps</p>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 mt-5">
          <button onClick={() => navigate("/reminders")} className="bg-white/15 rounded-[16px] p-3 text-center backdrop-blur-sm hover:bg-white/25 transition-colors">
            <Bell className="w-5 h-5 mx-auto text-white/80" />
            <p className="text-[22px] font-bold mt-1">{tomorrowReminders}</p>
            <p className="text-[11px] text-white/70">tomorrow's reminders</p>
          </button>
          <button onClick={() => navigate("/new-consultation")} className="bg-white/15 rounded-[16px] p-3 text-center backdrop-blur-sm hover:bg-white/25 transition-colors">
            <Sparkles className="w-5 h-5 mx-auto text-white/80" />
            <p className="text-[13px] font-semibold mt-1">Check symptoms</p>
            <p className="text-[10px] text-white/70">if you're not feeling well</p>
          </button>
        </div>
      )}

      <button onClick={dismiss} className="flex items-center gap-1 text-white/50 hover:text-white/80 text-[12px] mt-4 transition-colors">
        Dismiss <ArrowRight className="w-3 h-3" />
      </button>
    </div>
  )
}
