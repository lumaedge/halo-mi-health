import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/App"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Bell, BellOff, Loader2, Plus, Pill, CalendarCheck, AlertCircle, CheckCircle2, Clock, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Reminder, ReminderType, ReminderFrequency } from "@/types"

const reminderIcons: Record<ReminderType, typeof Bell> = {
  prescription_refill: Pill,
  health_check: CalendarCheck,
  appointment: Clock,
  custom: Bell,
}

const reminderColors: Record<ReminderType, string> = {
  prescription_refill: "#007aff",
  health_check: "#34c759",
  appointment: "#ff9f0a",
  custom: "#6e6e73",
}

const reminderLabels: Record<ReminderType, string> = {
  prescription_refill: "Prescription Refill",
  health_check: "Health Check",
  appointment: "Appointment",
  custom: "Custom",
}

export default function Reminders() {
  const { user } = useAuth()
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  const [type, setType] = useState<ReminderType>("custom")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [frequency, setFrequency] = useState<ReminderFrequency>("monthly")
  const [nextDue, setNextDue] = useState("")
  const [saving, setSaving] = useState(false)
  const [profileId, setProfileId] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    load()
  }, [user])

  async function load() {
    const { data: prof } = await supabase.from("profiles").select("id").eq("user_id", user!.id).single()
    if (prof) setProfileId(prof.id)
    const { data } = await supabase.from("reminders").select("*").eq("user_id", user!.id).order("next_due_date", { ascending: true })
    setReminders(data || [])
    setLoading(false)
  }

  async function createReminder() {
    if (!user || !title) return
    setSaving(true)
    await supabase.from("reminders").insert({
      user_id: user.id,
      type,
      title,
      description: description || null,
      frequency,
      frequency_months: frequency === "bi_annual" ? [5, 6] : [],
      next_due_date: nextDue || null,
      enabled: true,
    })
    setSaving(false)
    setShowNew(false)
    setTitle("")
    setDescription("")
    setNextDue("")
    setType("custom")
    setFrequency("monthly")
    load()
  }

  async function toggleReminder(id: string, enabled: boolean) {
    await supabase.from("reminders").update({ enabled }).eq("id", id)
    setReminders(prev => prev.map(r => r.id === id ? { ...r, enabled } : r))
  }

  async function completeReminder(id: string) {
    const now = new Date().toISOString()
    const due = new Date()
    if (frequency === "annual") due.setFullYear(due.getFullYear() + 1)
    else if (frequency === "bi_annual") due.setMonth(due.getMonth() + 6)
    else if (frequency === "monthly") due.setMonth(due.getMonth() + 1)
    else if (frequency === "weekly") due.setDate(due.getDate() + 7)
    else if (frequency === "daily") due.setDate(due.getDate() + 1)
    else { await supabase.from("reminders").update({ enabled: false, last_completed: now }).eq("id", id); return load() }
    await supabase.from("reminders").update({ last_completed: now, next_due_date: due.toISOString().split("T")[0] }).eq("id", id)
    load()
  }

  async function deleteReminder(id: string) {
    await supabase.from("reminders").delete().eq("id", id)
    setReminders(prev => prev.filter(r => r.id !== id))
  }

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-white/60" /></div>

  const now = new Date()
  const dueReminders = reminders.filter(r => r.enabled && r.next_due_date && new Date(r.next_due_date) <= now)
  const upcomingReminders = reminders.filter(r => r.enabled && (!r.next_due_date || new Date(r.next_due_date) > now))
  const disabledReminders = reminders.filter(r => !r.enabled)

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[32px] font-bold text-white tracking-tight">Reminders</h1>
          <p className="text-[16px] text-white/60 mt-1">Stay on top of your health</p>
        </div>
        <Button onClick={() => setShowNew(true)} className="gap-2"><Plus className="w-[18px] h-[18px]" />Add</Button>
      </div>

      {dueReminders.length > 0 && (
        <section>
          <h2 className="text-[18px] font-semibold text-[#ff3b30] mb-3 flex items-center gap-2">
            <AlertCircle className="w-[18px] h-[18px]" /> Due
          </h2>
          <div className="space-y-3">
            {dueReminders.map(r => <ReminderCard key={r.id} reminder={r} onToggle={toggleReminder} onComplete={completeReminder} onDelete={deleteReminder} />)}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-[18px] font-semibold text-white mb-3">
          {dueReminders.length > 0 ? "Upcoming" : "All Reminders"}
        </h2>
        {reminders.length === 0 ? (
          <Card className="apple-card">
            <CardContent className="flex flex-col items-center py-16">
              <div className="w-[56px] h-[56px] rounded-[16px] bg-[#f5f5f7] flex items-center justify-center mb-4">
                <Bell className="w-[28px] h-[28px] text-white/60" />
              </div>
              <p className="text-[16px] font-medium text-white">No reminders yet</p>
              <p className="text-[14px] text-white/60 mt-1">Add reminders for prescriptions, health checks, and more.</p>
              <Button onClick={() => setShowNew(true)} className="mt-4 gap-2"><Plus className="w-[16px] h-[16px]" />Add Reminder</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {upcomingReminders.map(r => <ReminderCard key={r.id} reminder={r} onToggle={toggleReminder} onComplete={completeReminder} onDelete={deleteReminder} />)}
            {disabledReminders.length > 0 && (
              <>
                <p className="text-[13px] font-medium text-white/60 uppercase tracking-wider pt-4 pb-2">Disabled</p>
                {disabledReminders.map(r => <ReminderCard key={r.id} reminder={r} onToggle={toggleReminder} onComplete={completeReminder} onDelete={deleteReminder} />)}
              </>
            )}
          </div>
        )}
      </section>

      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="text-[20px]">New Reminder</DialogTitle>
            <DialogDescription className="text-[14px] text-white/60">Set a health reminder for yourself.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <div className="flex flex-wrap gap-2">
                {(Object.entries(reminderLabels) as [ReminderType, string][]).map(([key, label]) => (
                  <button key={key} type="button" onClick={() => setType(key)}
                    className={cn("px-3 py-1.5 rounded-[8px] text-[13px] font-medium transition-all duration-200",
                      type === key ? "bg-[#007aff] text-white" : "bg-[#f5f5f7] text-white/60 hover:bg-[#e5e5ea]")}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" placeholder="e.g. Refill blood pressure medication" value={title} onChange={e => setTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="desc">Description (optional)</Label>
              <textarea id="desc" rows={2} value={description} onChange={e => setDescription(e.target.value)}
                className="w-full rounded-[14px] border border-white/10 bg-white/10 px-4 py-3 text-[15px] text-white placeholder:text-white/40 backdrop-blur-xl focus:outline-none focus:ring-2 focus:ring-[#007aff]/50 focus:border-[#007aff] transition-all duration-200 resize-none"
                placeholder="Any additional details..." />
            </div>
            <div className="space-y-2">
              <Label>Frequency</Label>
              <div className="flex flex-wrap gap-2">
                {(["once", "daily", "weekly", "monthly", "annual", "bi_annual"] as ReminderFrequency[]).map(f => (
                  <button key={f} type="button" onClick={() => setFrequency(f)}
                    className={cn("px-3 py-1.5 rounded-[8px] text-[13px] font-medium capitalize transition-all duration-200",
                      frequency === f ? "bg-[#007aff] text-white" : "bg-[#f5f5f7] text-white/60 hover:bg-[#e5e5ea]")}>
                    {f === "bi_annual" ? "Every 6 months" : f}
                  </button>
                ))}
              </div>
              {frequency === "bi_annual" && <p className="text-[12px] text-white/60">Reminds you at months 5 and 6 of each cycle.</p>}
            </div>
            {frequency !== "once" && (
              <div className="space-y-2">
                <Label htmlFor="due">Next due date</Label>
                <Input id="due" type="date" value={nextDue} onChange={e => setNextDue(e.target.value)} />
              </div>
            )}
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setShowNew(false)}>Cancel</Button>
              <Button onClick={createReminder} disabled={!title || saving} className="gap-2 min-w-[100px]">
                {saving ? <Loader2 className="w-[16px] h-[16px] animate-spin" /> : null}
                Create
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ReminderCard({ reminder: r, onToggle, onComplete, onDelete }: {
  reminder: Reminder
  onToggle: (id: string, enabled: boolean) => void
  onComplete: (id: string) => void
  onDelete: (id: string) => void
}) {
  const Icon = reminderIcons[r.type]
  const color = reminderColors[r.type]
  const isDue = r.enabled && r.next_due_date && new Date(r.next_due_date) <= new Date()

  return (
    <Card className={cn("apple-card overflow-hidden transition-all duration-200", !r.enabled && "opacity-50")}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-[12px] flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: `${color}15` }}>
            <Icon className="w-5 h-5" style={{ color }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-[15px] font-semibold text-white truncate">{r.title}</p>
              {isDue && <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-4">Due</Badge>}
            </div>
            {r.description && <p className="text-[13px] text-white/60 mt-0.5 line-clamp-2">{r.description}</p>}
            <div className="flex items-center gap-3 mt-2">
              <Badge variant="secondary" className="text-[11px] px-2 py-0 h-5 font-normal">{reminderLabels[r.type]}</Badge>
              <Badge variant="outline" className="text-[11px] px-2 py-0 h-5 font-normal capitalize">
                {r.frequency === "bi_annual" ? "Every 6 months" : r.frequency}
              </Badge>
              {r.next_due_date && (
                <span className="text-[12px] text-white/60">
                  {isDue ? "Overdue" : `Due ${new Date(r.next_due_date).toLocaleDateString("en-ZA", { day: "numeric", month: "short" })}`}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button onClick={() => onToggle(r.id, !r.enabled)} className="p-2 rounded-full hover:bg-[#f5f5f7] transition-colors" title={r.enabled ? "Disable" : "Enable"}>
              {r.enabled ? <Bell className="w-4 h-4 text-[#007aff]" /> : <BellOff className="w-4 h-4 text-white/60" />}
            </button>
            {r.enabled && r.frequency !== "once" && (
              <button onClick={() => onComplete(r.id)} className="p-2 rounded-full hover:bg-[#f5f5f7] transition-colors" title="Mark completed">
                <CheckCircle2 className="w-4 h-4 text-[#34c759]" />
              </button>
            )}
            <button onClick={() => onDelete(r.id)} className="p-2 rounded-full hover:bg-[#ff3b30]/10 transition-colors" title="Delete">
              <svg className="w-4 h-4 text-[#ff3b30]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
              </svg>
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
