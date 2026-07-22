import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/App"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { AlertTriangle, Loader2, Plus, Pencil, Trash2, Stethoscope, Target, ChevronDown, ChevronUp } from "lucide-react"
import { toast } from "sonner"
import type { Condition, ConditionGoal } from "@/types"
import { CardListSkeletonFallback } from "@/components/skeletons"

export default function Conditions() {
  const { user, profile: authProfile } = useAuth()
  const [conditions, setConditions] = useState<Condition[]>([])
  const [loading, setLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [editing, setEditing] = useState<Condition | null>(null)
  const [name, setName] = useState("")
  const [isChronic, setIsChronic] = useState(false)
  const [diagnosisDate, setDiagnosisDate] = useState("")
  const [notes, setNotes] = useState("")
  const [saving, setSaving] = useState(false)
  const [goals, setGoals] = useState<ConditionGoal[]>([])
  const [showGoalDialog, setShowGoalDialog] = useState(false)
  const [goalConditionId, setGoalConditionId] = useState<string | null>(null)
  const [goalMetric, setGoalMetric] = useState("")
  const [goalTarget, setGoalTarget] = useState("")
  const [goalUnit, setGoalUnit] = useState("")
  const [goalComparison, setGoalComparison] = useState<"lt" | "lte" | "gt" | "gte" | "eq">("lte")
  const [goalTargetDate, setGoalTargetDate] = useState("")
  const [expandedGoals, setExpandedGoals] = useState<Set<string>>(new Set())
  const pid = authProfile?.id ?? user?.id

  useEffect(() => {
    if (!pid) { setLoading(false); return }
    const timer = setTimeout(() => { setLoading(false); toast.error("DB query timed out") }, 12000)
    load().finally(() => clearTimeout(timer))
  }, [pid])

  async function load() {
    try {
      const [condResult, goalsResult] = await Promise.all([
        supabase.from("conditions").select("*").eq("patient_id", pid).order("created_at", { ascending: false }),
        supabase.from("condition_goals").select("*").eq("patient_id", pid).order("created_at", { ascending: false }),
      ])
      if (condResult.error) { toast.error("Load failed: " + condResult.error.message); setConditions([]) }
      else { setConditions(condResult.data || []) }
      setGoals(goalsResult.data || [])
    } catch (e: any) {
      toast.error("Load error: " + (e?.message || e))
    } finally {
      setLoading(false)
    }
  }

  function openNew() {
    setEditing(null); setName(""); setIsChronic(false); setDiagnosisDate(""); setNotes(""); setShowDialog(true)
  }

  function openEdit(c: Condition) {
    setEditing(c); setName(c.name); setIsChronic(c.is_chronic); setDiagnosisDate(c.diagnosis_date || ""); setNotes(c.notes || ""); setShowDialog(true)
  }

  async function save() {
    if (!pid || !name) return
    setSaving(true)
    const payload = { patient_id: pid, name, is_chronic: isChronic, diagnosis_date: diagnosisDate || null, notes: notes || null }
    const { error } = editing
      ? await supabase.from("conditions").update(payload).eq("id", editing.id)
      : await supabase.from("conditions").insert(payload)
    if (error) {
      toast.error(error.message)
      setSaving(false)
      return
    }
    setSaving(false); setShowDialog(false); load()
  }

  async function deleteCondition(id: string) {
    const { error } = await supabase.from("conditions").delete().eq("id", id)
    if (!error) load()
  }

  function openGoalDialog(conditionId: string) {
    setGoalConditionId(conditionId); setGoalMetric(""); setGoalTarget(""); setGoalUnit(""); setGoalComparison("lte"); setGoalTargetDate(""); setShowGoalDialog(true)
  }

  async function saveGoal() {
    if (!pid || !goalConditionId || !goalMetric || !goalTarget) return
    setSaving(true)
    const { error } = await supabase.from("condition_goals").insert({
      condition_id: goalConditionId,
      patient_id: pid,
      metric: goalMetric,
      target_value: parseFloat(goalTarget),
      unit: goalUnit || null,
      comparison: goalComparison,
      target_date: goalTargetDate || null,
    })
    if (error) { toast.error("Failed to save goal: " + error.message); setSaving(false); return }
    setSaving(false); setShowGoalDialog(false); load()
  }

  async function deleteGoal(id: string) {
    const { error } = await supabase.from("condition_goals").delete().eq("id", id)
    if (!error) load()
  }

  function getGoalsForCondition(conditionId: string) {
    return goals.filter(g => g.condition_id === conditionId)
  }

  function toggleGoalExpanded(conditionId: string) {
    setExpandedGoals(prev => {
      const next = new Set(prev)
      if (next.has(conditionId)) next.delete(conditionId)
      else next.add(conditionId)
      return next
    })
  }

  if (loading) return <CardListSkeletonFallback count={4} />

  const chronic = conditions.filter(c => c.is_chronic)
  const acute = conditions.filter(c => !c.is_chronic)

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[32px] font-bold text-[#1d1d1f] tracking-tight">Conditions</h1>
          <p className="text-[16px] text-[#6e6e73] mt-1">Track your health conditions</p>
        </div>
        <Button onClick={openNew} className="gap-2"><Plus className="w-[18px] h-[18px]" />Add</Button>
      </div>

      {conditions.length === 0 ? (
        <Card className="apple-card">
          <CardContent className="flex flex-col items-center py-16">
            <div className="w-[56px] h-[56px] rounded-[16px] bg-[#f5f5f7] flex items-center justify-center mx-auto mb-4">
              <Stethoscope className="w-[28px] h-[28px] text-[#6e6e73]" />
            </div>
            <p className="text-[16px] font-medium text-[#1d1d1f]">No conditions tracked</p>
            <p className="text-[14px] text-[#6e6e73] mt-1">Add any medical conditions or diagnoses.</p>
            <Button onClick={openNew} className="mt-4 gap-2"><Plus className="w-[16px] h-[16px]" />Add Condition</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {chronic.length > 0 && (
            <>
              <p className="text-[13px] font-medium text-[#ff9f0a] uppercase tracking-wider flex items-center gap-1.5 mb-2">
                <AlertTriangle className="w-[14px] h-[14px]" /> Chronic
              </p>
              {chronic.map(c => <ConditionCard key={c.id} condition={c} onEdit={openEdit} onDelete={deleteCondition} goals={getGoalsForCondition(c.id)} onAddGoal={openGoalDialog} onDeleteGoal={deleteGoal} expanded={expandedGoals.has(c.id)} onToggleExpand={() => toggleGoalExpanded(c.id)} />)}
            </>
          )}
          {acute.length > 0 && (
            <>
              <p className="text-[13px] font-medium text-[#6e6e73] uppercase tracking-wider pt-4 pb-2">Acute / Past</p>
              {acute.map(c => <ConditionCard key={c.id} condition={c} onEdit={openEdit} onDelete={deleteCondition} goals={getGoalsForCondition(c.id)} onAddGoal={openGoalDialog} onDeleteGoal={deleteGoal} expanded={expandedGoals.has(c.id)} onToggleExpand={() => toggleGoalExpanded(c.id)} />)}
            </>
          )}
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="text-[20px]">{editing ? "Edit Condition" : "Add Condition"}</DialogTitle>
            <DialogDescription className="text-[14px] text-[#6e6e73]">Record a medical condition or diagnosis.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Condition name</Label>
              <Input id="name" placeholder="e.g. Type 2 Diabetes" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className="flex items-center gap-3">
              <button type="button" role="switch" aria-checked={isChronic} onClick={() => setIsChronic(!isChronic)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isChronic ? "bg-[#ff9f0a]" : "bg-[#e5e5ea]"}`}>
                <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${isChronic ? "translate-x-[22px]" : "translate-x-[2px]"}`} />
              </button>
              <Label className="text-[14px] cursor-pointer">Chronic condition</Label>
            </div>
            <div className="space-y-2">
              <Label htmlFor="diag">Diagnosis date (optional)</Label>
              <Input id="diag" type="date" value={diagnosisDate} onChange={e => setDiagnosisDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <textarea id="notes" rows={2} value={notes} onChange={e => setNotes(e.target.value)}
                className="w-full rounded-[14px] border border-[#e5e5ea] bg-white px-4 py-3 text-[15px] text-[#1d1d1f] placeholder:text-[#6e6e73] focus:outline-none focus:ring-2 focus:ring-[#007aff]/30 focus:border-[#007aff] transition-all duration-200 resize-none"
                placeholder="Any additional details..." />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
              <Button onClick={save} disabled={!name || saving} className="gap-2 min-w-[100px]">
                {saving ? <Loader2 className="w-[16px] h-[16px] animate-spin" /> : null}
                {editing ? "Save" : "Add"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showGoalDialog} onOpenChange={setShowGoalDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-[20px]">Add Therapeutic Goal</DialogTitle>
            <DialogDescription className="text-[14px] text-[#6e6e73]">Set a target to track progress for this condition.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="metric">Metric</Label>
              <select id="metric" value={goalMetric} onChange={e => setGoalMetric(e.target.value)}
                className="w-full rounded-[14px] border border-[#e5e5ea] bg-white px-4 py-2.5 text-[15px] text-[#1d1d1f] focus:outline-none focus:ring-2 focus:ring-[#007aff]/30">
                <option value="">Select a metric...</option>
                <option value="HbA1c">HbA1c</option>
                <option value="Blood Pressure (Systolic)">Blood Pressure (Systolic)</option>
                <option value="Blood Pressure (Diastolic)">Blood Pressure (Diastolic)</option>
                <option value="Blood Sugar (Fasting)">Blood Sugar (Fasting)</option>
                <option value="Blood Sugar (Post-meal)">Blood Sugar (Post-meal)</option>
                <option value="Cholesterol (LDL)">Cholesterol (LDL)</option>
                <option value="Cholesterol (HDL)">Cholesterol (HDL)</option>
                <option value="BMI">BMI</option>
                <option value="Peak Flow">Peak Flow</option>
                <option value="Weight">Weight</option>
                <option value="Custom">Custom...</option>
              </select>
            </div>
            {goalMetric === "Custom..." && (
              <div className="space-y-2">
                <Label htmlFor="custom-metric">Custom metric name</Label>
                <Input id="custom-metric" value={goalMetric === "Custom..." ? "" : goalMetric} onChange={e => setGoalMetric(e.target.value)} placeholder="e.g. CRP levels" />
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="goal-target">Target value</Label>
                <Input id="goal-target" type="number" step="0.1" value={goalTarget} onChange={e => setGoalTarget(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="goal-unit">Unit (optional)</Label>
                <Input id="goal-unit" value={goalUnit} onChange={e => setGoalUnit(e.target.value)} placeholder="e.g. mmol/L" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="goal-compare">Comparison</Label>
              <select id="goal-compare" value={goalComparison} onChange={e => setGoalComparison(e.target.value as any)}
                className="w-full rounded-[14px] border border-[#e5e5ea] bg-white px-4 py-2.5 text-[15px] text-[#1d1d1f] focus:outline-none focus:ring-2 focus:ring-[#007aff]/30">
                <option value="lte">Less than or equal to (≤)</option>
                <option value="lt">Less than (&lt;)</option>
                <option value="gte">Greater than or equal to (≥)</option>
                <option value="gt">Greater than (&gt;)</option>
                <option value="eq">Equal to (=)</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="goal-date">Target date (optional)</Label>
              <Input id="goal-date" type="date" value={goalTargetDate} onChange={e => setGoalTargetDate(e.target.value)} />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setShowGoalDialog(false)}>Cancel</Button>
              <Button onClick={saveGoal} disabled={!goalMetric || !goalTarget || saving} className="gap-2 min-w-[100px]">
                {saving ? <Loader2 className="w-[16px] h-[16px] animate-spin" /> : "Add Goal"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ConditionCard({ condition: c, onEdit, onDelete, goals, onAddGoal, onDeleteGoal, expanded, onToggleExpand }: {
  condition: Condition
  onEdit: (c: Condition) => void
  onDelete: (id: string) => void
  goals: ConditionGoal[]
  onAddGoal: (conditionId: string) => void
  onDeleteGoal: (id: string) => void
  expanded: boolean
  onToggleExpand: () => void
}) {
  const achievedCount = goals.filter(g => g.achieved).length
  return (
    <Card className="apple-card overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-[12px] flex items-center justify-center shrink-0 mt-0.5 ${c.is_chronic ? "bg-[#fef0d9] text-[#ff9f0a]" : "bg-[#f5f5f7] text-[#6e6e73]"}`}>
            <Stethoscope className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-[15px] font-semibold text-[#1d1d1f]">{c.name}</p>
              {c.is_chronic && <Badge variant="warning" className="text-[10px] px-1.5 py-0 h-4">Chronic</Badge>}
            </div>
            {c.diagnosis_date && (
              <p className="text-[13px] text-[#6e6e73] mt-0.5">Diagnosed {new Date(c.diagnosis_date).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })}</p>
            )}
            {c.notes && <p className="text-[12px] text-[#6e6e73] mt-1">{c.notes}</p>}
            {c.is_chronic && (
              <div className="mt-2 pt-2 border-t border-[#e5e5ea]/40">
                <button onClick={onToggleExpand} className="flex items-center gap-1 text-[12px] text-[#007aff] font-medium">
                  <Target className="w-[13px] h-[13px]" />
                  Goals {goals.length > 0 ? `(${achievedCount}/${goals.length})` : "(0)"}
                  {expanded ? <ChevronUp className="w-[13px] h-[13px]" /> : <ChevronDown className="w-[13px] h-[13px]" />}
                </button>
                {expanded && (
                  <div className="mt-2 space-y-1.5">
                    {goals.map(g => (
                      <div key={g.id} className="flex items-center justify-between text-[12px] bg-[#f5f5f7] rounded-[8px] px-2.5 py-1.5">
                        <div>
                          <span className="text-[#1d1d1f] font-medium">{g.metric}</span>
                          <span className="text-[#6e6e73]"> {g.comparison === "lte" ? "≤" : g.comparison === "lt" ? "<" : g.comparison === "gte" ? "≥" : g.comparison === "gt" ? ">" : "="}{g.target_value}{g.unit ? ` ${g.unit}` : ""}</span>
                          {g.achieved && <Badge variant="success" className="text-[9px] ml-1.5 px-1 h-3.5">Achieved</Badge>}
                        </div>
                        <button onClick={() => onDeleteGoal(g.id)} className="text-[#ff3b30] hover:text-[#ff3b30]/70 ml-2">
                          <Trash2 className="w-[12px] h-[12px]" />
                        </button>
                      </div>
                    ))}
                    <button onClick={() => onAddGoal(c.id)} className="flex items-center gap-1 text-[11px] text-[#007aff] font-medium px-2.5 py-1">
                      <Plus className="w-[12px] h-[12px]" /> Add goal
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button onClick={() => onEdit(c)} aria-label="Edit condition" className="p-2 rounded-full hover:bg-[#f5f5f7] transition-colors">
              <Pencil className="w-4 h-4 text-[#6e6e73]" aria-hidden="true" />
            </button>
            <button onClick={() => onDelete(c.id)} aria-label="Delete condition" className="p-2 rounded-full hover:bg-[#ff3b30]/10 transition-colors">
              <Trash2 className="w-4 h-4 text-[#ff3b30]" aria-hidden="true" />
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
