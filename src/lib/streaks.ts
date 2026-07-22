const STORAGE_KEY = "halo-streak"

interface StreakData {
  currentStreak: number
  longestStreak: number
  lastVisitDate: string
  streakDates: string[] // last N dates for the streak
}

export function getStreak(): StreakData {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    const initial: StreakData = {
      currentStreak: 1,
      longestStreak: 1,
      lastVisitDate: today(),
      streakDates: [today()],
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initial))
    return initial
  }
  return JSON.parse(raw)
}

export function recordVisit(): StreakData {
  const data = getStreak()
  const todayStr = today()
  const yesterdayStr = yesterday()

  if (data.lastVisitDate === todayStr) {
    return data // already recorded today
  }

  if (data.lastVisitDate === yesterdayStr) {
    data.currentStreak += 1
  } else {
    data.currentStreak = 1
  }

  if (data.currentStreak > data.longestStreak) {
    data.longestStreak = data.currentStreak
  }

  data.lastVisitDate = todayStr
  data.streakDates = [...data.streakDates.slice(-60), todayStr]
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  return data
}

export function hoursUntilStreakExpires(): number {
  const data = getStreak()
  if (data.lastVisitDate === today()) return 24
  const last = new Date(data.lastVisitDate)
  const nextDeadline = new Date(last)
  nextDeadline.setDate(nextDeadline.getDate() + 1)
  nextDeadline.setHours(23, 59, 59, 999)
  const diffMs = nextDeadline.getTime() - Date.now()
  return Math.max(0, Math.round(diffMs / 1000 / 60 / 60))
}

export function streakEmoji(streak: number): string {
  if (streak >= 100) return "🔥"
  if (streak >= 60) return "💪"
  if (streak >= 30) return "⚡"
  if (streak >= 14) return "🌟"
  if (streak >= 7) return "✨"
  if (streak >= 3) return "⭐"
  return "🌱"
}

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

function yesterday(): string {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return d.toISOString().slice(0, 10)
}
