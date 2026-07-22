import * as tf from "@tensorflow/tfjs"

interface PredictionResult {
  predictedNextScore: number
  trend: "up" | "down" | "stable"
  trendPercent: number
  nextScores: number[]
  confidence: "high" | "medium" | "low"
  insight: string
}

let model: tf.Sequential | null = null

async function getModel(): Promise<tf.Sequential> {
  if (model) return model
  model = tf.sequential({
    layers: [
      tf.layers.dense({ units: 8, activation: "relu", inputShape: [1] }),
      tf.layers.dense({ units: 1 }),
    ],
  })
  model.compile({ optimizer: "adam", loss: "meanSquaredError" })
  return model
}

export async function predictTrend(scores: number[]): Promise<PredictionResult> {
  if (scores.length < 3) {
    return {
      predictedNextScore: scores[scores.length - 1] ?? 50,
      trend: "stable",
      trendPercent: 0,
      nextScores: scores,
      confidence: "low",
      insight: "Need at least 3 data points to predict trends",
    }
  }

  // Take last 10 scores max
  const recent = scores.slice(-10)
  const indices = recent.map((_, i) => i)

  try {
    const m = await getModel()
    const xs = tf.tensor2d(indices, [indices.length, 1])
    const ys = tf.tensor2d(recent, [recent.length, 1])

    // Train on the data
    await m.fit(xs, ys, {
      epochs: 50,
      batchSize: Math.min(recent.length, 8),
      shuffle: true,
      callbacks: { onEpochEnd: (_epoch: number, log?: tf.Logs) => {} },
    })

    // Predict next 3 points
    const futureIndices = tf.tensor2d(
      [indices.length, indices.length + 1, indices.length + 2],
      [3, 1]
    )
    const prediction = m.predict(futureIndices) as tf.Tensor
    const predictedValues = await prediction.data()
    xs.dispose()
    ys.dispose()
    futureIndices.dispose()
    prediction.dispose()

    const lastScore = recent[recent.length - 1]
    const nextScore = Math.round(Math.max(0, Math.min(100, predictedValues[0])))
    const trendPercent = Math.round(((nextScore - lastScore) / (lastScore || 1)) * 100)

    let trend: PredictionResult["trend"] = "stable"
    if (trendPercent > 3) trend = "up"
    else if (trendPercent < -3) trend = "down"

    // Calculate confidence based on variance
    const mean = recent.reduce((a, b) => a + b, 0) / recent.length
    const variance = recent.reduce((sum, v) => sum + (v - mean) ** 2, 0) / recent.length
    const stdDev = Math.sqrt(variance)
    const confidence: PredictionResult["confidence"] =
      stdDev < 8 ? "high" : stdDev < 15 ? "medium" : "low"

    const arrow = trend === "up" ? "↑" : trend === "down" ? "↓" : "→"
    const insight =
      confidence === "high"
        ? `Strong trend ${arrow} ${Math.abs(trendPercent)}% over next period`
        : confidence === "medium"
        ? `Moderate trend ${arrow} ${Math.abs(trendPercent)}%`
        : `High variability — trend unclear`

    return {
      predictedNextScore: nextScore,
      trend,
      trendPercent,
      nextScores: [
        Math.round(Math.max(0, Math.min(100, predictedValues[0]))),
        Math.round(Math.max(0, Math.min(100, predictedValues[1]))),
        Math.round(Math.max(0, Math.min(100, predictedValues[2]))),
      ],
      confidence,
      insight,
    }
  } catch {
    return {
      predictedNextScore: scores[scores.length - 1],
      trend: "stable",
      trendPercent: 0,
      nextScores: [scores[scores.length - 1]],
      confidence: "low",
      insight: "Prediction unavailable",
    }
  }
}
