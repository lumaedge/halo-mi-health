import { useState, useEffect } from "react"
import { getStreak, recordVisit, streakEmoji, hoursUntilStreakExpires } from "@/lib/streaks"
import { Flame } from "lucide-react"

export function StreakDisplay({ className }: { className?: string }) {
  const [streak, setStreak] = useState(0)
  const [longest, setLongest] = useState(0)
  const [emoji, setEmoji] = useState("🌱")
  const [hoursLeft, setHoursLeft] = useState(24)

  useEffect(() => {
    const data = recordVisit()
    setStreak(data.currentStreak)
    setLongest(data.longestStreak)
    setEmoji(streakEmoji(data.currentStreak))
    setHoursLeft(hoursUntilStreakExpires())

    const interval = setInterval(() => {
      setHoursLeft(hoursUntilStreakExpires())
    }, 60_000)

    return () => clearInterval(interval)
  }, [])

  if (streak === 0) return null

  const color = streak >= 30 ? "text-[#ff9f0a]" : streak >= 7 ? "text-[#34c759]" : "text-[#6e6e73]"

  return (
    <div className={`flex items-center gap-1.5 ${className || ""}`}>
      <Flame className={`w-[14px] h-[14px] ${color}`} fill={streak >= 7 ? "#ff9f0a" : "none"} />
      <span className={`text-[13px] font-semibold ${color}`}>{streak}</span>
      {streak >= 3 && (
        <span className="text-[11px] text-[#6e6e73]">· {emoji} {hoursLeft}h left</span>
      )}
      {streak >= 7 && longest > streak && (
        <span className="text-[11px] text-[#6e6e73]">· best: {longest}</span>
      )}
    </div>
  )
}
