import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/App"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { AlertTriangle, Loader2, Plus, Pencil, Trash2, Stethoscope } from "lucide-react"
import type { Condition } from "@/types"

export default function Conditions() {
  const { user } = useAuth()
  const [conditions, setConditions] = useState<Condition[]>([])
  const [loading, setLoading] = useState(true)
  const [profileId, setProfileId] = useState<string | null>(null)
  const [showDialog, setShowDialog] = useState(false)
  const [editing, setEditing] = useState<Condition | null>(null)
  const [name, setName] = useState("")
  const [isChronic, setIsChronic] = useState(false)
  const [diagnosisDate, setDiagnosisDate] = useState("")
  const [notes, setNotes] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!user) return
    load()
  }, [user])

  async function load() {
    const { data: prof } = await supabase.from("profiles").select("id").eq("user_id", user!.id).single()
    if (!prof) { setLoading(false); return }
    setProfileId(prof.id)
    const { data } = await supabase.from("conditions").select("*").eq("patient_id", prof.id).order("created_at", { ascending: false })
    setConditions(data || [])
    setLoading(false)
  }

  function openNew() {
    setEditing(null); setName(""); setIsChronic(false); setDiagnosisDate(""); setNotes(""); setShowDialog(true)
  }

  function openEdit(c: Condition) {
    setEditing(c); setName(c.name); setIsChronic(c.is_chronic); setDiagnosisDate(c.diagnosis_date || ""); setNotes(c.notes || ""); setShowDialog(true)
  }

  async function save() {
    if (!profileId || !name) return
    setSaving(true)
    const payload = { patient_id: profileId, name, is_chronic: isChronic, diagnosis_date: diagnosisDate || null, notes: notes || null }
    if (editing) {
      await supabase.from("conditions").update(payload).eq("id", editing.id)
    } else {
      await supabase.from("conditions").insert(payload)
    }
    setSaving(false); setShowDialog(false); load()
  }

  async function deleteCondition(id: string) {
    await supabase.from("conditions").delete().eq("id", id)
    load()
  }

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-[#6e6e73]" /></div>

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
              {chronic.map(c => <ConditionCard key={c.id} condition={c} onEdit={openEdit} onDelete={deleteCondition} />)}
            </>
          )}
          {acute.length > 0 && (
            <>
              <p className="text-[13px] font-medium text-[#6e6e73] uppercase tracking-wider pt-4 pb-2">Acute / Past</p>
              {acute.map(c => <ConditionCard key={c.id} condition={c} onEdit={openEdit} onDelete={deleteCondition} />)}
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
    </div>
  )
}

function ConditionCard({ condition: c, onEdit, onDelete }: { condition: Condition; onEdit: (c: Condition) => void; onDelete: (id: string) => void }) {
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
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button onClick={() => onEdit(c)} className="p-2 rounded-full hover:bg-[#f5f5f7] transition-colors" title="Edit">
              <Pencil className="w-4 h-4 text-[#6e6e73]" />
            </button>
            <button onClick={() => onDelete(c.id)} className="p-2 rounded-full hover:bg-[#ff3b30]/10 transition-colors" title="Delete">
              <Trash2 className="w-4 h-4 text-[#ff3b30]" />
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
