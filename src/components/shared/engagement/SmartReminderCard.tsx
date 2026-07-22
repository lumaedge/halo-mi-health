import { useState, useEffect } from "react"
import { useI18n } from "@/lib/i18n/I18nProvider"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getPattern, logInteraction, getSuggestedHour } from "@/lib/smartReminders"
import { Brain, Clock, Check, Zap, AlertTriangle, TrendingUp, Calendar, CheckCheck } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface Props {
  reminderId: string
  reminderTitle: string
  scheduledHour: number
  onComplete?: () => void
  onAcceptTime?: (reminderId: string, newHour: number) => void
}

const confidenceConfig = {
  high: { label: "High confidence", color: "bg-[#e8f5e9] text-[#34c759]", icon: Zap },
  medium: { label: "Learning pattern", color: "bg-[#fef0d9] text-[#ff9f0a]", icon: TrendingUp },
  low: { label: "Inconsistent", color: "bg-[#fce8e6] text-[#ff3b30]", icon: AlertTriangle },
  learning: { label: "Gathering data", color: "bg-[#e8f0fe] text-[#007aff]", icon: Brain },
}

export function SmartReminderCard({ reminderId, reminderTitle, scheduledHour, onComplete, onAcceptTime }: Props) {
  const { t } = useI18n()
  const [pattern, setPattern] = useState(() => getPattern(reminderId))
  const [suggested, setSuggested] = useState<number | null>(null)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    setSuggested(getSuggestedHour(reminderId))
  }, [reminderId])

  function refresh() {
    setPattern(getPattern(reminderId))
    setSuggested(getSuggestedHour(reminderId))
  }

  function handleComplete() {
    logInteraction(reminderId, reminderTitle, "completed", scheduledHour)
    refresh()
    toast.success("Logged! " + getPattern(reminderId).insight)
    onComplete?.()
  }

  function handleSnooze() {
    logInteraction(reminderId, reminderTitle, "snoozed", scheduledHour)
    refresh()
    toast("Snoozed — adjusting pattern", { icon: "⏰" })
  }

  function handleAcceptTime() {
    if (suggested !== null && onAcceptTime) {
      onAcceptTime(reminderId, suggested)
      toast.success(`Time updated to ${suggested > 12 ? suggested - 12 : suggested === 0 ? 12 : suggested}${suggested >= 12 ? "PM" : "AM"}`)
    }
  }

  const cfg = confidenceConfig[pattern.confidence]
  const Icon = cfg.icon

  if (pattern.totalInteractions === 0) return null

  const schedPeriod = scheduledHour >= 12 ? "PM" : "AM"
  const sched12 = scheduledHour > 12 ? scheduledHour - 12 : scheduledHour === 0 ? 12 : scheduledHour

  // Mini heatmap: last 7 days
  const heatmapDays = [...Array(7)].map((_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    const dateStr = d.toISOString().slice(0, 10)
    const completedToday = pattern.completionTimes.length > 0 &&
      pattern.completionTimes.some(h => {
        const interactedDate = new Date()
        interactedDate.setHours(h, 0, 0, 0)
        return interactedDate.toISOString().slice(0, 10) === dateStr
      })
    return {
      label: d.toLocaleDateString("en-ZA", { weekday: "short" }).slice(0, 2),
      completed: completedToday,
      date: dateStr,
    }
  })

  const snoozeRate = pattern.totalInteractions > 0
    ? Math.round((pattern.snoozeTimes.length / pattern.totalInteractions) * 100)
    : 0

  return (
    <Card className="border-l-4 border-l-[#007aff] bg-gradient-to-r from-[#007aff]/[0.02] to-white">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className={`w-8 h-8 rounded-[10px] flex items-center justify-center shrink-0 ${cfg.color.split(" ")[0]}`}>
              <Icon className={`w-4 h-4 ${cfg.color.split(" ")[1]}`} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-[14px] font-semibold text-[#1d1d1f]">{reminderTitle}</p>
                <Badge className={`${cfg.color} border-0 text-[10px] px-2 py-0.5`}>
                  {cfg.label}
                </Badge>
              </div>

              <div className="flex items-center gap-3 mt-1.5 text-[12px] text-[#6e6e73] flex-wrap">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Scheduled: {sched12}{schedPeriod}
                </span>
                {suggested !== null && suggested !== scheduledHour && (
                  <span className="flex items-center gap-1 text-[#007aff] font-medium cursor-pointer hover:underline" onClick={handleAcceptTime} title="Accept suggested time">
                    <Brain className="w-3 h-3" />
                    Best at: {suggested > 12 ? suggested - 12 : suggested === 0 ? 12 : suggested}{suggested >= 12 ? "PM" : "AM"} — tap to accept
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <CheckCheck className="w-3 h-3" />
                  {Math.round(pattern.adherenceRate * 100)}% adherence
                </span>
                {snoozeRate > 20 && (
                  <span className="flex items-center gap-1 text-[#ff9f0a]">
                    Snoozed {snoozeRate}% of the time
                  </span>
                )}
              </div>

              <p className="text-[12px] text-[#6e6e73] mt-1.5 italic border-l-2 border-[#e5e5ea] pl-2">
                {pattern.insight}
              </p>

              {/* Mini heatmap */}
              {pattern.totalInteractions >= 3 && (
                <button onClick={() => setExpanded(!expanded)} className="flex items-center gap-2 mt-2 text-[11px] text-[#6e6e73] hover:text-[#007aff] transition-colors">
                  <Calendar className="w-3 h-3" />
                  {expanded ? "Hide" : "Show"} completion heatmap
                </button>
              )}

              {expanded && (
                <div className="mt-2 p-3 bg-[#f5f5f7] rounded-[12px]">
                  <div className="flex items-center justify-between gap-1.5">
                    {heatmapDays.map(day => (
                      <div key={day.date} className="flex flex-col items-center gap-1">
                        <span className="text-[9px] text-[#6e6e73] uppercase">{day.label}</span>
                        <div className={cn(
                          "w-7 h-7 rounded-[6px] flex items-center justify-center text-[11px] font-medium transition-colors",
                          day.completed
                            ? "bg-[#34c759] text-white"
                            : "bg-[#e5e5ea] text-[#6e6e73]"
                        )}>
                          {day.completed ? "✓" : "·"}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-[10px] text-[#6e6e73]">
                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-[#34c759]" /> Completed</span>
                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-[#e5e5ea]" /> No data</span>
                    <span>{pattern.totalInteractions} total interactions</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-1.5 shrink-0">
            <Button size="sm" variant="ghost" className="h-[32px] px-2.5 text-[12px]" onClick={handleSnooze}>
              Snooze
            </Button>
            <Button size="sm" className="h-[32px] px-2.5 text-[12px] gap-1" onClick={handleComplete}>
              <Check className="w-3 h-3" /> Done
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
