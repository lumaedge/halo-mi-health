import { supabase } from "./supabase"
import type { Profile } from "@/types"

export async function calculateAndSaveHealthScore(userId: string) {
  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("height_cm, weight_kg")
      .eq("user_id", userId)
      .single()

    const { data: syncData } = await supabase
      .from("health_sync_data")
      .select("*")
      .eq("user_id", userId)
      .order("recorded_at", { ascending: false })

    if (!profile && !syncData?.length) return

    let bmiScore = 50
    if (profile?.height_cm && profile?.weight_kg) {
      const bmi = profile.weight_kg / ((profile.height_cm / 100) ** 2)
      if (bmi >= 18.5 && bmi <= 24.9) bmiScore = 90
      else if (bmi >= 25 && bmi <= 29.9) bmiScore = 65
      else if (bmi >= 30) bmiScore = 35
      else bmiScore = 55
    }

    const latestData = syncData?.reduce((acc: any, item: any) => {
      acc[item.data_type] = item
      return acc
    }, {}) ?? {}

    // Activity score based on steps
    let activityScore = 50
    const steps = latestData.step_count?.value
    if (steps) {
      if (steps >= 10000) activityScore = 95
      else if (steps >= 7500) activityScore = 80
      else if (steps >= 5000) activityScore = 60
      else if (steps >= 2000) activityScore = 40
    }

    // Sleep score
    let sleepScore = 50
    const sleepHrs = latestData.sleep_hours?.value
    if (sleepHrs) {
      if (sleepHrs >= 7 && sleepHrs <= 9) sleepScore = 90
      else if (sleepHrs >= 6) sleepScore = 65
      else sleepScore = 35
    }

    // Heart rate score
    let heartRateScore = 50
    const hr = latestData.heart_rate?.value
    if (hr) {
      if (hr >= 60 && hr <= 80) heartRateScore = 90
      else if (hr >= 50 || hr <= 100) heartRateScore = 65
      else heartRateScore = 35
    }

    const totalScore = Math.round((bmiScore + activityScore + sleepScore + heartRateScore) / 4)

    await supabase.from("health_scores").insert({
      user_id: userId,
      score: totalScore,
      bmi_score: bmiScore,
      activity_score: activityScore,
      sleep_score: sleepScore,
      heart_rate_score: heartRateScore,
      factors: { bmi: profile?.weight_kg ? profile.weight_kg / ((profile.height_cm || 170) / 100) ** 2 : null },
      calculated_at: new Date().toISOString(),
    })

    return totalScore
  } catch {
    return null
  }
}
