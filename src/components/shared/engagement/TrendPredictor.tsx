import { useState, useEffect } from "react"
import { useAuth } from "@/App"
import { supabase } from "@/lib/supabase"
import { predictTrend } from "@/lib/tfHealthPredictor"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, TrendingUp, TrendingDown, Minus, Brain } from "lucide-react"

export function TrendPredictor() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [prediction, setPrediction] = useState<{
    current: number
    next: number
    trend: string
    percent: number
    insight: string
    confidence: string
  } | null>(null)

  useEffect(() => {
    if (!user) return
    async function load() {
      const { data } = await supabase
        .from("health_scores")
        .select("score")
        .eq("user_id", user.id)
        .order("calculated_at", { ascending: true })
        .limit(20)

      if (data && data.length >= 3) {
        const scores = data.map(d => d.score)
        const result = await predictTrend(scores)
        setPrediction({
          current: scores[scores.length - 1],
          next: result.predictedNextScore,
          trend: result.trend,
          percent: result.trendPercent,
          insight: result.insight,
          confidence: result.confidence,
        })
      }
      setLoading(false)
    }
    load()
  }, [user])

  if (loading) return null
  if (!prediction) return null

  const TrendIcon = prediction.trend === "up" ? TrendingUp : prediction.trend === "down" ? TrendingDown : Minus
  const color = prediction.trend === "up" ? "text-[#34c759]" : prediction.trend === "down" ? "text-[#ff3b30]" : "text-[#6e6e73]"
  const bgColor = prediction.trend === "up" ? "bg-[#e8f5e9]" : prediction.trend === "down" ? "bg-[#fce8e6]" : "bg-[#f5f5f7]"

  return (
    <Card className="bg-gradient-to-br from-[#f5f5f7] to-white border-[#e5e5ea]/50">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-[12px] ${bgColor} flex items-center justify-center`}>
              <TrendIcon className={`w-5 h-5 ${color}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-[14px] font-semibold text-[#1d1d1f]">ML Trend Prediction</p>
                <Badge variant={prediction.confidence === "high" ? "success" : prediction.confidence === "medium" ? "warning" : "outline"} className="text-[9px] px-1.5 py-0 h-4">
                  {prediction.confidence}
                </Badge>
              </div>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-[28px] font-bold text-[#1d1d1f]">{prediction.current}</span>
                <TrendIcon className={`w-4 h-4 ${color}`} />
                <span className={`text-[22px] font-bold ${color}`}>{prediction.next}</span>
                <span className={`text-[13px] font-medium ${color}`}>
                  ({prediction.percent > 0 ? "+" : ""}{prediction.percent}%)
                </span>
              </div>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-[#6e6e73]">
            <Brain className="w-3 h-3" />
            TF.js on-device
          </div>
        </div>
        <p className="text-[12px] text-[#6e6e73] mt-2 pl-[52px] italic border-l-2 border-[#e5e5ea]">
          {prediction.insight}
        </p>
      </CardContent>
    </Card>
  )
}
