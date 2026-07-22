import { useState, useRef, useEffect } from "react"
import { useAuth } from "@/App"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Sparkles, Mic, Camera, Upload, Send, Loader2, ChevronRight, X, Plus, FileText, Brain, Calendar, Phone, Stethoscope, AlertTriangle, MessageCircle, ChevronDown, Clock, History } from "lucide-react"
import { toast } from "sonner"
import { commonSymptomsList, getFollowUps, evaluateTriage, type TriageResult, type FollowUpQuestion, type FollowUpAnswer } from "@/lib/triage-engine"
import { supabase } from "@/lib/supabase"
import type { Consultation } from "@/types"

export default function NewConsultation() {
  const { user, profile: authProfile } = useAuth()
  const pid = authProfile?.id ?? user?.id
  const [symptoms, setSymptoms] = useState(commonSymptomsList.map(s => ({ ...s, selected: false })))
  const [customSymptom, setCustomSymptom] = useState("")
  const [description, setDescription] = useState("")
  const [duration, setDuration] = useState("")
  const [severity, setSeverity] = useState<"mild" | "moderate" | "severe" | null>(null)
  const [mediaFiles, setMediaFiles] = useState<string[]>([])
  const [mediaUploading, setMediaUploading] = useState(false)
  const [aiAdvice, setAiAdvice] = useState<TriageResult | null>(null)
  const [loadingAi, setLoadingAi] = useState(false)
  const [followUpQuestions, setFollowUpQuestions] = useState<FollowUpQuestion[]>([])
  const [followUpAnswers, setFollowUpAnswers] = useState<FollowUpAnswer[]>([])
  const [showFollowUp, setShowFollowUp] = useState(false)
  const [history, setHistory] = useState<Consultation[]>([])
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!pid) { setLoadingHistory(false); return }
    supabase.from("consultations").select("*").eq("patient_id", pid).order("created_at", { ascending: false }).limit(5).then(({ data }) => {
      setHistory(data || [])
      setLoadingHistory(false)
    })
  }, [pid])

  function toggleSymptom(id: string) {
    const next = symptoms.map(s => s.id === id ? { ...s, selected: !s.selected } : s)
    setSymptoms(next)
    const selectedIds = next.filter(s => s.selected).map(s => s.id)
    if (selectedIds.length > 0) {
      const qs = getFollowUps(selectedIds)
      setFollowUpQuestions(qs)
      setFollowUpAnswers(prev => prev.filter(a => qs.some(q => q.id === a.questionId)))
      if (!showFollowUp) setShowFollowUp(true)
    } else {
      setShowFollowUp(false)
      setFollowUpQuestions([])
      setFollowUpAnswers([])
    }
  }

  function addCustomSymptom() {
    if (!customSymptom.trim()) return
    const id = `custom-${Date.now()}`
    setSymptoms(prev => [...prev, { id, label: customSymptom.trim(), selected: true }])
    setCustomSymptom("")
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || !pid) return
    setMediaUploading(true)
    const uploaded: string[] = []
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const ext = file.name.split(".").pop() || "jpg"
      const path = `consultations/${pid}/${Date.now()}-${i}.${ext}`
      const { error } = await supabase.storage.from("medical-images").upload(path, file)
      if (error) { toast.error("Upload failed: " + error.message); continue }
      const { data: { publicUrl } } = supabase.storage.from("medical-images").getPublicUrl(path)
      uploaded.push(publicUrl)
    }
    setMediaFiles(prev => [...prev, ...uploaded])
    setMediaUploading(false)
    if (uploaded.length > 0) toast.success(`${uploaded.length} file(s) uploaded`)
  }

  function setFollowUpAnswer(questionId: string, answer: string) {
    setFollowUpAnswers(prev => {
      const existing = prev.findIndex(a => a.questionId === questionId)
      if (existing >= 0) {
        const next = [...prev]
        next[existing] = { questionId, answer }
        return next
      }
      return [...prev, { questionId, answer }]
    })
  }

  async function getAiAdvice() {
    const selectedSymptoms = symptoms.filter(s => s.selected)
    if (selectedSymptoms.length === 0 && !description.trim()) {
      toast.error("Please select or describe your symptoms first")
      return
    }
    if (!severity) {
      toast.error("Please select the severity of your symptoms")
      return
    }

    setLoadingAi(true)
    setAiAdvice(null)

    setTimeout(async () => {
      const result = evaluateTriage({
        symptomIds: selectedSymptoms.map(s => s.id).filter(id => !id.startsWith("custom-")),
        customSymptoms: selectedSymptoms.filter(s => s.id.startsWith("custom-")).map(s => s.label),
        description,
        duration,
        severity,
        followUpAnswers,
      })
      setAiAdvice(result)
      setLoadingAi(false)

      if (!pid) return
      setSaving(true)
      const { error } = await supabase.from("consultations").insert({
        patient_id: pid,
        symptoms: selectedSymptoms.map(s => s.label),
        severity,
        description: description || null,
        urgency: result.urgency,
        possible_conditions: result.possibleConditions,
        recommendation: result.recommendation,
        ai_summary: result.recommendation,
      })
      if (error) console.error("Failed to save consultation", error)
      setSaving(false)
    }, 1200)
  }

  const selectedCount = symptoms.filter(s => s.selected).length

  const urgencyColors: Record<string, { bg: string; text: string; label: string }> = {
    "self-care": { bg: "bg-[#e8f5e9]", text: "text-[#34c759]", label: "Self-care recommended" },
    "appointment": { bg: "bg-[#fef0d9]", text: "text-[#ff9f0a]", label: "Book an appointment" },
    "urgent": { bg: "bg-[#fce8e6]", text: "text-[#ff3b30]", label: "Urgent care needed" },
    "emergency": { bg: "bg-[#ff3b30]/10", text: "text-[#ff3b30]", label: "EMERGENCY — Call 10177" },
  }

  return (
    <div className="space-y-4 animate-fade-in pb-8">
      <div className="rounded-[24px] p-6 bg-gradient-to-br from-[#5856d6] to-[#007aff] text-white">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-[18px] h-[18px]" />
          <span className="text-[13px] font-semibold uppercase tracking-wider opacity-80">AI Consultation</span>
        </div>
        <h1 className="text-[28px] font-bold tracking-tight">Symptom Checker</h1>
        <p className="text-[14px] text-white/80 mt-1">Describe your symptoms for AI-powered advice</p>
      </div>

      <button onClick={() => setShowHistory(!showHistory)} className="w-full flex items-center justify-between p-4 rounded-[16px] bg-[#f5f5f7] text-[14px] text-[#1d1d1f] font-medium hover:bg-[#e5e5ea] transition-colors">
        <span className="flex items-center gap-2"><History className="w-[16px] h-[16px]" /> Previous consultations</span>
        <ChevronDown className={`w-[16px] h-[16px] transition-transform ${showHistory ? "rotate-180" : ""}`} />
      </button>

      {showHistory && (
        <div className="space-y-2">
          {loadingHistory ? (
            <div className="text-center py-4 text-[13px] text-[#6e6e73]">Loading...</div>
          ) : history.length === 0 ? (
            <div className="text-center py-4 text-[13px] text-[#6e6e73]">No previous consultations</div>
          ) : history.map(h => (
            <Card key={h.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setShowHistory(false)}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <Stethoscope className="w-[16px] h-[16px] text-[#6e6e73] shrink-0" />
                    <span className="text-[14px] font-medium text-[#1d1d1f] truncate">{h.symptoms.slice(0, 3).join(", ")}{h.symptoms.length > 3 ? "..." : ""}</span>
                  </div>
                  <Badge variant={h.urgency === "emergency" || h.urgency === "urgent" ? "destructive" : h.urgency === "appointment" ? "warning" : "success"} className="text-[10px] shrink-0 ml-2">
                    {h.urgency === "self-care" ? "Self-care" : h.urgency}
                  </Badge>
                </div>
                <p className="text-[12px] text-[#6e6e73] mt-1">{new Date(h.created_at).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-[28px] h-[28px] rounded-[8px] bg-[#007aff] flex items-center justify-center text-white text-[12px] font-bold">1</div>
            <h2 className="text-[17px] font-semibold text-[#1d1d1f]">What are you experiencing?</h2>
          </div>
          <p className="text-[13px] text-[#6e6e73]">Tap common symptoms or type your own</p>

          <div className="flex flex-wrap gap-2">
            {symptoms.map(s => (
              <Badge
                key={s.id}
                variant={s.selected ? "default" : "secondary"}
                className={`cursor-pointer text-[13px] px-3 py-1.5 transition-all ${
                  s.selected ? "bg-[#007aff] text-white" : "bg-[#f5f5f7] text-[#6e6e73] hover:bg-[#e5e5ea]"
                }`}
                onClick={() => toggleSymptom(s.id)}
              >
                {s.selected ? <X className="w-[12px] h-[12px] mr-1 inline" /> : <Plus className="w-[12px] h-[12px] mr-1 inline" />}
                {s.label}
              </Badge>
            ))}
          </div>

          <div className="flex gap-2">
            <Input
              value={customSymptom}
              onChange={e => setCustomSymptom(e.target.value)}
              placeholder="Type a symptom..."
              className="flex-1"
              onKeyDown={e => e.key === "Enter" && addCustomSymptom()}
            />
            <Button variant="outline" size="sm" onClick={addCustomSymptom} disabled={!customSymptom.trim()}>
              <Plus className="w-[14px] h-[14px]" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {followUpQuestions.length > 0 && (
        <Card>
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-[28px] h-[28px] rounded-[8px] bg-[#5856d6] flex items-center justify-center text-white text-[12px] font-bold">2</div>
              <h2 className="text-[17px] font-semibold text-[#1d1d1f]">Help us understand better</h2>
            </div>
            <div className="space-y-4">
              {followUpQuestions.map(q => (
                <div key={q.id} className="space-y-2">
                  <p className="text-[14px] font-medium text-[#1d1d1f]">{q.question}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {q.options.map(opt => {
                      const isSelected = followUpAnswers.some(a => a.questionId === q.id && a.answer === opt)
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setFollowUpAnswer(q.id, opt)}
                          className={`px-3 py-1.5 rounded-[10px] text-[13px] font-medium transition-all ${
                            isSelected
                              ? "bg-[#5856d6] text-white"
                              : "bg-[#f5f5f7] text-[#6e6e73] hover:bg-[#e5e5ea]"
                          }`}
                        >
                          {opt}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-[28px] h-[28px] rounded-[8px] bg-[#ff9f0a] flex items-center justify-center text-white text-[12px] font-bold">{followUpQuestions.length > 0 ? "3" : "2"}</div>
            <h2 className="text-[17px] font-semibold text-[#1d1d1f]">Details</h2>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[13px] text-[#6e6e73]">Describe your symptoms</Label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="When did it start? What makes it better or worse? Any other relevant information..."
              className="w-full rounded-[12px] border border-[#e5e5ea] bg-white px-3 py-2.5 text-[14px] text-[#1d1d1f] placeholder:text-[#c7c7cc] focus:outline-none focus:ring-1 focus:ring-[#007aff] min-h-[100px] resize-y"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[13px] text-[#6e6e73]">Duration</Label>
              <Input value={duration} onChange={e => setDuration(e.target.value)} placeholder="e.g. 2 days" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[13px] text-[#6e6e73]">Severity</Label>
              <div className="flex gap-1.5">
                {(["mild", "moderate", "severe"] as const).map(s => (
                  <Button
                    key={s}
                    size="sm"
                    variant={severity === s ? "default" : "outline"}
                    className={`flex-1 text-[12px] capitalize ${
                      severity === s && s === "severe" ? "bg-[#ff3b30]" :
                      severity === s && s === "moderate" ? "bg-[#ff9f0a]" :
                      severity === s ? "bg-[#34c759]" : ""
                    }`}
                    onClick={() => setSeverity(severity === s ? null : s)}
                  >
                    {s}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-[28px] h-[28px] rounded-[8px] bg-[#34c759] flex items-center justify-center text-white text-[12px] font-bold">{followUpQuestions.length > 0 ? "4" : "3"}</div>
            <h2 className="text-[17px] font-semibold text-[#1d1d1f]">Add Media</h2>
          </div>
          <p className="text-[13px] text-[#6e6e73]">Photos of visible symptoms (optional)</p>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileUpload}
          />

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1 gap-2" onClick={() => fileInputRef.current?.click()} disabled={mediaUploading}>
              {mediaUploading ? <Loader2 className="w-[16px] h-[16px] animate-spin" /> : <Camera className="w-[16px] h-[16px]" />}
              Camera
            </Button>
            <Button variant="outline" className="flex-1 gap-2" onClick={() => fileInputRef.current?.click()} disabled={mediaUploading}>
              {mediaUploading ? <Loader2 className="w-[16px] h-[16px] animate-spin" /> : <Upload className="w-[16px] h-[16px]" />}
              Upload
            </Button>
          </div>

          {mediaFiles.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {mediaFiles.map((file, i) => (
                <div key={i} className="relative w-[72px] h-[72px] rounded-[10px] overflow-hidden bg-[#f5f5f7]">
                  <img src={file} alt={`Upload ${i}`} className="w-full h-full object-cover" />
                  <button
                    className="absolute top-0.5 right-0.5 w-[18px] h-[18px] rounded-full bg-black/50 flex items-center justify-center"
                    onClick={() => setMediaFiles(prev => prev.filter((_, idx) => idx !== i))}
                  >
                    <X className="w-[10px] h-[10px] text-white" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Button
        className="w-full gap-2 h-[48px] rounded-[14px] text-[16px] font-semibold"
        onClick={getAiAdvice}
        disabled={loadingAi || (selectedCount === 0 && !description.trim())}
      >
        {loadingAi ? (
          <><Loader2 className="w-[18px] h-[18px] animate-spin" /> Analysing symptoms...</>
        ) : (
          <><Brain className="w-[18px] h-[18px]" /> Get AI Assessment</>
        )}
      </Button>

      {saving && (
        <div className="text-center text-[13px] text-[#6e6e73]"><Loader2 className="w-[14px] h-[14px] animate-spin inline mr-1" />Saving to your history...</div>
      )}

      {aiAdvice && (
        <Card className={`border-l-4 ${
          aiAdvice.urgency === "emergency" ? "border-l-[#ff3b30]" :
          aiAdvice.urgency === "urgent" ? "border-l-[#ff3b30]" :
          aiAdvice.urgency === "appointment" ? "border-l-[#ff9f0a]" :
          "border-l-[#34c759]"
        }`}>
          <CardContent className="p-5 space-y-4">
            <div className={`rounded-[12px] p-3 ${urgencyColors[aiAdvice.urgency].bg} flex items-center gap-2`}>
              {aiAdvice.urgency === "emergency" ? (
                <AlertTriangle className={`w-[18px] h-[18px] ${urgencyColors[aiAdvice.urgency].text}`} />
              ) : aiAdvice.urgency === "appointment" ? (
                <Calendar className={`w-[18px] h-[18px] ${urgencyColors[aiAdvice.urgency].text}`} />
              ) : (
                <Stethoscope className={`w-[18px] h-[18px] ${urgencyColors[aiAdvice.urgency].text}`} />
              )}
              <span className={`text-[14px] font-semibold ${urgencyColors[aiAdvice.urgency].text}`}>
                {urgencyColors[aiAdvice.urgency].label}
              </span>
            </div>

            <div>
              <h3 className="text-[15px] font-semibold text-[#1d1d1f] mb-2">Possible causes</h3>
              <ul className="space-y-1">
                {aiAdvice.possibleConditions.map((c, i) => (
                  <li key={i} className="flex items-start gap-2 text-[14px] text-[#6e6e73]">
                    <ChevronRight className="w-[14px] h-[14px] text-[#007aff] mt-0.5 flex-shrink-0" />
                    {c}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-[15px] font-semibold text-[#1d1d1f] mb-1">Recommendation</h3>
              <p className="text-[14px] text-[#6e6e73] leading-relaxed">{aiAdvice.recommendation}</p>
            </div>

            {aiAdvice.urgency === "self-care" && aiAdvice.selfCare && (
              <div className="rounded-[12px] bg-[#e8f5e9] p-3">
                <p className="text-[13px] text-[#34c759] font-medium mb-1">Self-care tips</p>
                <p className="text-[14px] text-[#1d1d1f]">{aiAdvice.selfCare}</p>
              </div>
            )}

            {aiAdvice.suggestedMedication && (
              <div className="rounded-[12px] bg-[#f5f5f7] p-3">
                <p className="text-[13px] text-[#6e6e73] font-medium">Suggested medication</p>
                <p className="text-[14px] text-[#1d1d1f]">{aiAdvice.suggestedMedication}</p>
              </div>
            )}

            <div>
              <h3 className="text-[15px] font-semibold text-[#1d1d1f] mb-1">When to worry</h3>
              <p className="text-[14px] text-[#6e6e73] leading-relaxed">{aiAdvice.whenToWorry}</p>
            </div>

            <div className="flex gap-2">
              {aiAdvice.urgency === "emergency" && (
                <Button className="flex-1 gap-2 bg-[#ff3b30] hover:bg-[#ff3b30]/90">
                  <Phone className="w-[16px] h-[16px]" />
                  Call 10177
                </Button>
              )}
              {aiAdvice.urgency === "appointment" && (
                <Button className="flex-1 gap-2">
                  <Calendar className="w-[16px] h-[16px]" />
                  Book Appointment
                </Button>
              )}
              <Button
                variant="outline"
                className="flex-1 gap-2"
                onClick={() => {
                  const text = `Halo Mi Health Assessment\n\nUrgency: ${urgencyColors[aiAdvice.urgency].label}\n\nPossible causes:\n- ${aiAdvice.possibleConditions.join("\n- ")}\n\nRecommendation:\n${aiAdvice.recommendation}`
                  navigator.clipboard.writeText(text)
                  toast.success("Assessment copied to clipboard")
                }}
              >
                <FileText className="w-[16px] h-[16px]" />
                Copy
              </Button>
            </div>

            <p className="text-[11px] text-[#6e6e73] italic">{aiAdvice.disclaimer}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
