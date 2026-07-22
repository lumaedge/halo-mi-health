const INTERACTIONS_KEY = "halo-reminder-interactions"

interface Interaction {
  reminderId: string
  reminderTitle: string
  action: "completed" | "snoozed" | "skipped"
  timestamp: string // ISO
  scheduledHour: number // the hour it was scheduled for
}

interface Pattern {
  reminderId: string
  reminderTitle: string
  totalInteractions: number
  completionTimes: number[] // hours (0-23)
  snoozeTimes: number[]
  avgCompletionHour: number | null
  stdDevCompletion: number | null
  optimalWindowStart: number | null
  optimalWindowEnd: number | null
  confidence: "high" | "medium" | "low" | "learning"
  adherenceRate: number // 0-1
  insight: string
}

export function logInteraction(
  reminderId: string,
  reminderTitle: string,
  action: "completed" | "snoozed" | "skipped",
  scheduledHour: number
) {
  const interactions = getInteractions()
  interactions.push({
    reminderId,
    reminderTitle,
    action,
    timestamp: new Date().toISOString(),
    scheduledHour,
  })
  // Keep last 100 per reminder
  const filtered = interactions
    .filter(i => i.reminderId === reminderId)
    .slice(-100)
  const others = interactions.filter(i => i.reminderId !== reminderId)
  localStorage.setItem(INTERACTIONS_KEY, JSON.stringify([...others, ...filtered]))
}

export function getPattern(reminderId: string): Pattern {
  const interactions = getInteractions().filter(i => i.reminderId === reminderId)
  const total = interactions.length

  const completions = interactions
    .filter(i => i.action === "completed")
    .map(i => new Date(i.timestamp).getHours())

  const snoozes = interactions
    .filter(i => i.action === "snoozed")
    .map(i => new Date(i.timestamp).getHours())

  const completionsCount = completions.length
  const snoozesCount = snoozes.length
  const skippedCount = interactions.filter(i => i.action === "skipped").length

  // Adherence: completed / (completed + skipped)
  const adherenceRate = completionsCount + skippedCount > 0
    ? completionsCount / (completionsCount + skippedCount)
    : 1

  // Average completion hour
  let avgCompletionHour: number | null = null
  let stdDev: number | null = null
  if (completions.length > 0) {
    avgCompletionHour = completions.reduce((a, b) => a + b, 0) / completions.length
    const variance = completions.reduce((sum, h) => sum + (h - avgCompletionHour!) ** 2, 0) / completions.length
    stdDev = Math.sqrt(variance)
  }

  // Optimal window = avg ± stdDev
  let optimalWindowStart: number | null = null
  let optimalWindowEnd: number | null = null
  if (avgCompletionHour !== null && stdDev !== null) {
    optimalWindowStart = Math.max(0, Math.round((avgCompletionHour - stdDev) * 2) / 2)
    optimalWindowEnd = Math.min(23, Math.round((avgCompletionHour + stdDev) * 2) / 2)
  }

  // Confidence
  let confidence: Pattern["confidence"] = "learning"
  if (completions.length >= 7 && stdDev !== null) {
    if (stdDev <= 1) confidence = "high"
    else if (stdDev <= 2) confidence = "medium"
    else confidence = "low"
  } else if (completions.length >= 3) {
    confidence = "medium"
  }

  // Generate insight
  let insight = ""
  if (completions.length === 0) {
    insight = "Complete this reminder a few times to see your pattern"
  } else if (completions.length < 3) {
    insight = `Collected ${completions.length} data points — keep going!`
  } else if (confidence === "high") {
    const h = Math.round(avgCompletionHour!)
    const period = h >= 12 ? "PM" : "AM"
    const hour12 = h > 12 ? h - 12 : h === 0 ? 12 : h
    const startH = Math.round(optimalWindowStart!)
    const endH = Math.round(optimalWindowEnd!)
    insight = `You consistently complete this around ${hour12}${period} (${startH}:00–${endH}:00). Adherence: ${Math.round(adherenceRate * 100)}%`
  } else if (confidence === "medium") {
    const h = Math.round(avgCompletionHour!)
    const period = h >= 12 ? "PM" : "AM"
    const hour12 = h > 12 ? h - 12 : h === 0 ? 12 : h
    insight = `You tend to complete around ${hour12}${period}. ${10 - completions.length} more data points for high confidence.`
  } else {
    insight = `Low consistency so far. Try completing at a regular time.`
  }

  return {
    reminderId,
    reminderTitle: interactions[0]?.reminderTitle ?? "",
    totalInteractions: total,
    completionTimes: completions,
    snoozeTimes: snoozes,
    avgCompletionHour,
    stdDevCompletion: stdDev,
    optimalWindowStart,
    optimalWindowEnd,
    confidence,
    adherenceRate,
    insight,
  }
}

export function getAllPatterns(): Pattern[] {
  const interactions = getInteractions()
  const ids = [...new Set(interactions.map(i => i.reminderId))]
  return ids.map(getPattern)
}

export function getSuggestedHour(reminderId: string): number | null {
  const pattern = getPattern(reminderId)
  if (pattern.avgCompletionHour !== null && pattern.confidence !== "low") {
    return Math.round(pattern.avgCompletionHour)
  }
  return null
}

function getInteractions(): Interaction[] {
  try {
    const raw = localStorage.getItem(INTERACTIONS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}
