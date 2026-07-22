import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/App"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Pill, Loader2, Plus, Pencil, Trash2, ChevronRight, CheckCircle2, XCircle, TrendingUp } from "lucide-react"
import { toast } from "sonner"
import type { Medication, MedicationDose } from "@/types"
import { CardListSkeletonFallback } from "@/components/skeletons"

export default function Medications() {
  const { user, profile: authProfile } = useAuth()
  const [meds, setMeds] = useState<Medication[]>([])
  const [loading, setLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [editing, setEditing] = useState<Medication | null>(null)
  const [name, setName] = useState("")
  const [dosage, setDosage] = useState("")
  const [frequency, setFrequency] = useState("")
  const [route, setRoute] = useState("")
  const [instructions, setInstructions] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [saving, setSaving] = useState(false)
  const [doses, setDoses] = useState<MedicationDose[]>([])
  const [loggingDose, setLoggingDose] = useState<string | null>(null)
  const pid = authProfile?.id ?? user?.id

  useEffect(() => {
    if (!pid) { setLoading(false); return }
    const timer = setTimeout(() => { setLoading(false); toast.error("DB query timed out") }, 12000)
    load().finally(() => clearTimeout(timer))
  }, [pid])

  async function load() {
    try {
      const [medsResult, dosesResult] = await Promise.all([
        supabase.from("medications").select("*").eq("patient_id", pid).order("created_at", { ascending: false }),
        supabase.from("medication_doses").select("*").eq("patient_id", pid).gte("scheduled_time", new Date(Date.now() - 7 * 86400000).toISOString()).order("scheduled_time", { ascending: false }),
      ])
      if (medsResult.error) { toast.error("Load failed: " + medsResult.error.message); setMeds([]) }
      else { setMeds(medsResult.data || []) }
      setDoses(dosesResult.data || [])
    } catch (e: any) {
      toast.error("Load error: " + (e?.message || e))
    } finally {
      setLoading(false)
    }
  }

  function openNew() {
    setEditing(null)
    setName(""); setDosage(""); setFrequency(""); setRoute(""); setInstructions(""); setStartDate(""); setEndDate("")
    setShowDialog(true)
  }

  function openEdit(med: Medication) {
    setEditing(med)
    setName(med.name); setDosage(med.dosage); setFrequency(med.frequency)
    setRoute(med.route || ""); setInstructions(med.instructions || "")
    setStartDate(med.start_date); setEndDate(med.end_date || "")
    setShowDialog(true)
  }

  async function save() {
    if (!pid || !name || !dosage || !frequency) return
    setSaving(true)
    const payload = { patient_id: pid, name, dosage, frequency, route: route || null, instructions: instructions || null, start_date: startDate || new Date().toISOString().split("T")[0], end_date: endDate || null }
    const { error } = editing
      ? await supabase.from("medications").update(payload).eq("id", editing.id)
      : await supabase.from("medications").insert({ ...payload, is_active: true, prescribed_by: "", provider_id: pid })
    if (error) { toast.error(error.message); setSaving(false); return }
    setSaving(false); setShowDialog(false); load()
  }

  async function toggleActive(med: Medication) {
    const { error } = await supabase.from("medications").update({ is_active: !med.is_active }).eq("id", med.id)
    if (!error) load()
  }

  async function deleteMed(id: string) {
    const { error } = await supabase.from("medications").delete().eq("id", id)
    if (!error) load()
  }

  async function logDose(medicationId: string, status: "taken" | "skipped") {
    if (!pid) return
    setLoggingDose(medicationId)
    const { error } = await supabase.from("medication_doses").insert({
      medication_id: medicationId,
      patient_id: pid,
      scheduled_time: new Date().toISOString(),
      taken_at: status === "taken" ? new Date().toISOString() : null,
      status,
    })
    if (error) { toast.error("Failed to log dose: " + error.message); setLoggingDose(null); return }
    setLoggingDose(null)
    load()
  }

  async function undoDose(medicationId: string) {
    const latest = doses.filter(d => d.medication_id === medicationId).sort((a, b) => new Date(b.scheduled_time).getTime() - new Date(a.scheduled_time).getTime())[0]
    if (!latest) return
    const { error } = await supabase.from("medication_doses").delete().eq("id", latest.id)
    if (!error) load()
  }

  function getTodayDose(medicationId: string): MedicationDose | undefined {
    const today = new Date().toDateString()
    return doses.find(d => d.medication_id === medicationId && new Date(d.scheduled_time).toDateString() === today)
  }

  function getAdherenceRate(medicationId: string): number {
    const medDoses = doses.filter(d => d.medication_id === medicationId)
    if (medDoses.length === 0) return -1
    const taken = medDoses.filter(d => d.status === "taken").length
    return Math.round((taken / medDoses.length) * 100)
  }

  function getStreak(medicationId: string): number {
    const medDoses = doses.filter(d => d.medication_id === medicationId).sort((a, b) => new Date(b.scheduled_time).getTime() - new Date(a.scheduled_time).getTime())
    let streak = 0
    for (const d of medDoses) {
      if (d.status === "taken") streak++
      else break
    }
    return streak
  }

  if (loading) return <CardListSkeletonFallback count={4} />

  const activeMeds = meds.filter(m => m.is_active)
  const inactiveMeds = meds.filter(m => !m.is_active)

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[32px] font-bold text-[#1d1d1f] tracking-tight">Medications</h1>
          <p className="text-[16px] text-[#6e6e73] mt-1">Track your medications and dosages</p>
        </div>
        <Button onClick={openNew} className="gap-2"><Plus className="w-[18px] h-[18px]" />Add</Button>
      </div>

      {meds.length === 0 ? (
        <Card className="apple-card">
          <CardContent className="flex flex-col items-center py-16">
            <div className="w-[56px] h-[56px] rounded-[16px] bg-[#f5f5f7] flex items-center justify-center mx-auto mb-4">
              <Pill className="w-[28px] h-[28px] text-[#6e6e73]" />
            </div>
            <p className="text-[16px] font-medium text-[#1d1d1f]">No medications tracked</p>
            <p className="text-[14px] text-[#6e6e73] mt-1">Add your first medication.</p>
            <Button onClick={openNew} className="mt-4 gap-2"><Plus className="w-[16px] h-[16px]" />Add Medication</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {activeMeds.map(med => (
            <MedCard key={med.id} med={med} onEdit={openEdit} onToggle={toggleActive} onDelete={deleteMed}
              todayDose={getTodayDose(med.id)} adherence={getAdherenceRate(med.id)} streak={getStreak(med.id)}
              onLogDose={logDose} onUndoDose={undoDose} logging={loggingDose === med.id} />
          ))}
          {inactiveMeds.length > 0 && (
            <>
              <p className="text-[13px] font-medium text-[#6e6e73] uppercase tracking-wider pt-4 pb-2">Inactive</p>
              {inactiveMeds.map(med => (
                <MedCard key={med.id} med={med} onEdit={openEdit} onToggle={toggleActive} onDelete={deleteMed}
                  todayDose={undefined} adherence={-1} streak={0}
                  onLogDose={logDose} onUndoDose={undoDose} logging={false} />
              ))}
            </>
          )}
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-[480px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[20px]">{editing ? "Edit Medication" : "Add Medication"}</DialogTitle>
            <DialogDescription className="text-[14px] text-[#6e6e73]">Enter the details of your medication.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Medication name</Label>
              <Input id="name" placeholder="e.g. Amoxicillin" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="dosage">Dosage</Label>
                <Input id="dosage" placeholder="e.g. 500mg" value={dosage} onChange={e => setDosage(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="frequency">Frequency</Label>
                <Input id="frequency" placeholder="e.g. 3x daily" value={frequency} onChange={e => setFrequency(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="route">Route (optional)</Label>
              <Input id="route" placeholder="e.g. Oral, Topical, IV" value={route} onChange={e => setRoute(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="start">Start date</Label>
                <Input id="start" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end">End date (optional)</Label>
                <Input id="end" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="instructions">Instructions (optional)</Label>
              <textarea id="instructions" rows={2} value={instructions} onChange={e => setInstructions(e.target.value)}
                className="w-full rounded-[14px] border border-[#e5e5ea] bg-white px-4 py-3 text-[15px] text-[#1d1d1f] placeholder:text-[#6e6e73] focus:outline-none focus:ring-2 focus:ring-[#007aff]/30 focus:border-[#007aff] transition-all duration-200 resize-none"
                placeholder="e.g. Take with food" />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
              <Button onClick={save} disabled={!name || !dosage || !frequency || saving} className="gap-2 min-w-[100px]">
                {saving ? <Loader2 className="w-[16px] h-[16px] animate-spin" /> : null}
                {editing ? "Save" : "Add"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function MedCard({ med, onEdit, onToggle, onDelete, todayDose, adherence, streak, onLogDose, onUndoDose, logging }: {
  med: Medication
  onEdit: (m: Medication) => void
  onToggle: (m: Medication) => void
  onDelete: (id: string) => void
  todayDose?: { status: string } | null
  adherence: number
  streak: number
  onLogDose: (id: string, status: "taken" | "skipped") => void
  onUndoDose: (id: string) => void
  logging: boolean
}) {
  return (
    <Card className="apple-card overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-[12px] bg-[#e8f5e9] flex items-center justify-center shrink-0 mt-0.5">
            <Pill className="w-5 h-5 text-[#34c759]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-[15px] font-semibold text-[#1d1d1f]">{med.name}</p>
              <Badge variant={med.is_active ? "success" : "secondary"} className="text-[10px] px-1.5 py-0 h-4">{med.is_active ? "Active" : "Inactive"}</Badge>
            </div>
            <p className="text-[13px] text-[#6e6e73] mt-0.5">{med.dosage} · {med.frequency}{med.route ? ` · ${med.route}` : ""}</p>
            {med.instructions && <p className="text-[12px] text-[#6e6e73] mt-1 italic">{med.instructions}</p>}
            <div className="flex items-center gap-3 mt-2 text-[12px] text-[#6e6e73]">
              <span>Started {new Date(med.start_date).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })}</span>
              {med.end_date && <span>· Until {new Date(med.end_date).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })}</span>}
            </div>

            {med.is_active && (
              <div className="flex items-center gap-3 mt-3 pt-3 border-t border-[#e5e5ea]/40">
                {todayDose ? (
                  <div className="flex items-center gap-2">
                    {todayDose.status === "taken" ? (
                      <span className="flex items-center gap-1 text-[12px] text-[#34c759] font-medium"><CheckCircle2 className="w-[14px] h-[14px]" />Taken today</span>
                    ) : (
                      <span className="flex items-center gap-1 text-[12px] text-[#ff3b30] font-medium"><XCircle className="w-[14px] h-[14px]" />Skipped</span>
                    )}
                    <button onClick={() => onUndoDose(med.id)} className="text-[11px] text-[#6e6e73] underline hover:text-[#007aff]">Undo</button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => onLogDose(med.id, "taken")} disabled={logging}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-[8px] bg-[#34c759]/10 text-[#34c759] text-[11px] font-medium hover:bg-[#34c759]/20 transition-colors disabled:opacity-50">
                      {logging ? <Loader2 className="w-[12px] h-[12px] animate-spin" /> : <CheckCircle2 className="w-[13px] h-[13px]" />}
                      Taken
                    </button>
                    <button onClick={() => onLogDose(med.id, "skipped")} disabled={logging}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-[8px] bg-[#ff3b30]/10 text-[#ff3b30] text-[11px] font-medium hover:bg-[#ff3b30]/20 transition-colors disabled:opacity-50">
                      <XCircle className="w-[13px] h-[13px]" />
                      Skip
                    </button>
                  </div>
                )}
                {adherence >= 0 && (
                  <span className="ml-auto text-[11px] text-[#6e6e73] flex items-center gap-1">
                    <TrendingUp className="w-[11px] h-[11px]" />
                    {adherence}% · {streak}d streak
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button onClick={() => onEdit(med)} aria-label="Edit medication" className="p-2 rounded-full hover:bg-[#f5f5f7] transition-colors">
              <Pencil className="w-4 h-4 text-[#6e6e73]" aria-hidden="true" />
            </button>
            <button onClick={() => onToggle(med)} aria-label={med.is_active ? "Mark inactive" : "Mark active"} className="p-2 rounded-full hover:bg-[#f5f5f7] transition-colors">
              <div className={`w-4 h-4 rounded-sm border-2 ${med.is_active ? "bg-[#34c759] border-[#34c759]" : "border-[#6e6e73]"}`} aria-hidden="true" />
            </button>
            <button onClick={() => onDelete(med.id)} aria-label="Delete medication" className="p-2 rounded-full hover:bg-[#ff3b30]/10 transition-colors">
              <Trash2 className="w-4 h-4 text-[#ff3b30]" aria-hidden="true" />
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
