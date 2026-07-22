import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Heart, Droplets, Plus, Loader2, TrendingUp, ChevronDown, ChevronUp, Activity } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import type { VitalSign, VitalSignType } from "@/types"

const vitalConfigs: Record<VitalSignType, { label: string; unit: string; icon: any; color: string; min?: number; max?: number }> = {
  blood_pressure_systolic: { label: "Systolic (top)", unit: "mmHg", icon: Activity, color: "#ff3b30", min: 70, max: 220 },
  blood_pressure_diastolic: { label: "Diastolic (bottom)", unit: "mmHg", icon: Heart, color: "#ff9f0a", min: 40, max: 140 },
  blood_sugar: { label: "Blood Sugar", unit: "mmol/L", icon: Droplets, color: "#007aff", min: 2, max: 30 },
  heart_rate: { label: "Heart Rate", unit: "bpm", icon: Heart, color: "#ff3b30", min: 30, max: 250 },
  oxygen_saturation: { label: "Oxygen Saturation", unit: "%", icon: Activity, color: "#34c759", min: 50, max: 100 },
  temperature: { label: "Temperature", unit: "°C", icon: Activity, color: "#ff9f0a", min: 34, max: 42 },
  respiratory_rate: { label: "Respiratory Rate", unit: "breaths/min", icon: Activity, color: "#5856d6", min: 5, max: 60 },
}

const quickPresets: Partial<Record<VitalSignType, number[]>> = {
  blood_pressure_systolic: [90, 100, 110, 120, 130, 140, 150, 160, 170, 180],
  blood_pressure_diastolic: [60, 65, 70, 75, 80, 85, 90, 95, 100, 110],
  blood_sugar: [3.5, 4.5, 5.5, 6.5, 7.5, 8.5, 10, 12, 15],
}

interface VitalsTrackerProps {
  patientId: string
  compact?: boolean
}

export function VitalsTracker({ patientId, compact }: VitalsTrackerProps) {
  const [readings, setReadings] = useState<VitalSign[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState<VitalSignType | null>(null)
  const [newValue, setNewValue] = useState("")
  const [saving, setSaving] = useState(false)
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    if (!patientId) return
    supabase.from("vital_signs").select("*").eq("patient_id", patientId).order("recorded_at", { ascending: false }).limit(compact ? 20 : 50).then(({ data }) => {
      setReadings(data || [])
      setLoading(false)
    })
  }, [patientId, compact])

  async function saveReading(type: VitalSignType) {
    if (!newValue) return
    setSaving(true)
    const value = parseFloat(newValue)
    const config = vitalConfigs[type]
    if (config.min !== undefined && value < config.min) { toast.error(`Value too low (min ${config.min})`); setSaving(false); return }
    if (config.max !== undefined && value > config.max) { toast.error(`Value too high (max ${config.max})`); setSaving(false); return }
    const { error } = await supabase.from("vital_signs").insert({
      patient_id: patientId,
      type,
      value,
      unit: config.unit,
    })
    if (error) { toast.error("Failed to save: " + error.message); setSaving(false); return }
    toast.success(`${config.label} saved`)
    setNewValue("")
    setShowAdd(null)
    setSaving(false)
    const { data } = await supabase.from("vital_signs").select("*").eq("patient_id", patientId).order("recorded_at", { ascending: false }).limit(compact ? 20 : 50)
    if (data) setReadings(data)
  }

  function getLatest(type: VitalSignType): VitalSign | undefined {
    return readings.filter(r => r.type === type).sort((a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime())[0]
  }

  function getTrend(type: VitalSignType): "up" | "down" | "stable" {
    const filtered = readings.filter(r => r.type === type).sort((a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime())
    if (filtered.length < 2) return "stable"
    return filtered[0].value > filtered[1].value ? "up" : filtered[0].value < filtered[1].value ? "down" : "stable"
  }

  const typesToShow: VitalSignType[] = compact ? ["blood_pressure_systolic", "blood_sugar"] : ["blood_pressure_systolic", "blood_pressure_diastolic", "blood_sugar"]

  return (
    <Card>
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-[17px] font-semibold text-[#1d1d1f]">Vitals</h3>
          <button onClick={() => setShowAll(!showAll)} className="text-[13px] text-[#007aff] font-medium">
            {showAll ? "Show less" : "View all"}
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-[#6e6e73]" /></div>
        ) : (
          <div className="space-y-3">
            {(showAll ? Object.keys(vitalConfigs) : typesToShow).map(type => {
              const config = vitalConfigs[type as VitalSignType]
              const latest = getLatest(type as VitalSignType)
              const trend = getTrend(type as VitalSignType)
              const Icon = config.icon
              return (
                <div key={type}>
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2">
                      <div className="w-[32px] h-[32px] rounded-[8px] flex items-center justify-center" style={{ backgroundColor: config.color + "15" }}>
                        <Icon className="w-[16px] h-[16px]" style={{ color: config.color }} />
                      </div>
                      <div>
                        <p className="text-[13px] font-medium text-[#1d1d1f]">{config.label}</p>
                        {latest ? (
                          <p className="text-[11px] text-[#6e6e73]">
                            Latest: {latest.value} {config.unit}
                            <span className="ml-1">{trend === "up" ? <ChevronUp className="w-[11px] h-[11px] inline text-[#ff3b30]" /> : trend === "down" ? <ChevronDown className="w-[11px] h-[11px] inline text-[#34c759]" /> : ""}</span>
                          </p>
                        ) : <p className="text-[11px] text-[#6e6e73]">No readings</p>}
                      </div>
                    </div>
                    <button onClick={() => { setShowAdd(showAdd === type ? null : type as VitalSignType); setNewValue("") }}
                      className="w-[28px] h-[28px] rounded-full bg-[#f5f5f7] flex items-center justify-center hover:bg-[#e5e5ea] transition-colors">
                      <Plus className="w-[14px] h-[14px] text-[#6e6e73]" />
                    </button>
                  </div>

                  {showAdd === type && (
                    <div className="ml-[40px] space-y-2 pb-2">
                      <div className="flex flex-wrap gap-1.5">
                        {(quickPresets[type as VitalSignType] || []).map(v => (
                          <button key={v} onClick={() => setNewValue(String(v))}
                            className={`px-2.5 py-1 rounded-[8px] text-[12px] font-medium transition-colors ${newValue === String(v) ? "bg-[#007aff] text-white" : "bg-[#f5f5f7] text-[#6e6e73] hover:bg-[#e5e5ea]"}`}>
                            {v}
                          </button>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Input type="number" step="0.1" value={newValue} onChange={e => setNewValue(e.target.value)} placeholder={config.unit} className="h-[32px] text-[13px]" />
                        <Button size="sm" onClick={() => saveReading(type as VitalSignType)} disabled={!newValue || saving} className="h-[32px]">
                          {saving ? <Loader2 className="w-[14px] h-[14px] animate-spin" /> : "Save"}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {!showAll && !compact && readings.length > 0 && (
          <div className="pt-2 border-t border-[#e5e5ea]/40">
            <p className="text-[11px] text-[#6e6e73] font-medium uppercase tracking-wider mb-2">Recent readings</p>
            <div className="space-y-1">
              {readings.slice(0, 5).map(r => (
                <div key={r.id} className="flex items-center justify-between text-[12px]">
                  <span className="text-[#6e6e73]">{vitalConfigs[r.type as VitalSignType]?.label || r.type}: <strong className="text-[#1d1d1f]">{r.value} {r.unit}</strong></span>
                  <span className="text-[#6e6e73]">{new Date(r.recorded_at).toLocaleDateString("en-ZA", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
