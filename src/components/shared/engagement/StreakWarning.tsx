import { useState, useEffect, type ReactNode } from "react"
import { getStreak, hoursUntilStreakExpires, streakEmoji } from "@/lib/streaks"
import { Flame } from "lucide-react"
import { toast } from "sonner"

export function StreakWarning(): null {
  const [lastNotified, setLastNotified] = useState(() => localStorage.getItem("halo-streak-warning"))

  useEffect(() => {
    const check = setInterval(() => {
      const hours = hoursUntilStreakExpires()
      const streak = getStreak()

      if (streak.currentStreak >= 3 && hours <= 2 && hours > 0 && lastNotified !== today()) {
        toast(
          <div className="flex items-center gap-2.5">
            <Flame className="w-5 h-5 text-[#ff9f0a]" />
            <div>
              <p className="font-semibold text-[15px]">Your {streak.currentStreak}-day streak is expiring!</p>
              <p className="text-[13px] text-[#6e6e73]">{streakEmoji(streak.currentStreak)} Log in to keep it alive</p>
            </div>
          </div>,
          { duration: 8000 }
        )
        localStorage.setItem("halo-streak-warning", today())
        setLastNotified(today())
      }
    }, 60_000)

    return () => clearInterval(check)
  }, [lastNotified])

  return null
}

function today() {
  return new Date().toISOString().slice(0, 10)
}
