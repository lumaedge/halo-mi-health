import { useState, useRef } from "react"
import { useAuth } from "@/App"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Sparkles, Mic, Camera, Upload, Send, Loader2, ChevronRight, X, Plus, FileText, Brain, Calendar, Phone, Stethoscope, AlertTriangle } from "lucide-react"
import { toast } from "sonner"

interface Symptom {
  id: string
  label: string
  selected: boolean
}

const commonSymptoms: Symptom[] = [
  { id: "headache", label: "Headache", selected: false },
  { id: "fever", label: "Fever", selected: false },
  { id: "cough", label: "Cough", selected: false },
  { id: "fatigue", label: "Fatigue", selected: false },
  { id: "sore-throat", label: "Sore throat", selected: false },
  { id: "body-ache", label: "Body ache", selected: false },
  { id: "nausea", label: "Nausea", selected: false },
  { id: "dizziness", label: "Dizziness", selected: false },
  { id: "chest-pain", label: "Chest pain", selected: false },
  { id: "shortness-breath", label: "Shortness of breath", selected: false },
  { id: "abdominal-pain", label: "Abdominal pain", selected: false },
  { id: "rash", label: "Skin rash", selected: false },
  { id: "ear-pain", label: "Ear pain", selected: false },
  { id: "eye-irritation", label: "Eye irritation", selected: false },
  { id: "back-pain", label: "Back pain", selected: false },
  { id: "joint-pain", label: "Joint pain", selected: false },
]

interface AiAdvice {
  possibleConditions: string[]
  recommendation: string
  urgency: "self-care" | "appointment" | "urgent" | "emergency"
  suggestedMedication?: string
  disclaimer: string
}

export default function NewConsultation() {
  const { user } = useAuth()
  const [symptoms, setSymptoms] = useState<Symptom[]>(commonSymptoms)
  const [customSymptom, setCustomSymptom] = useState("")
  const [description, setDescription] = useState("")
  const [duration, setDuration] = useState("")
  const [severity, setSeverity] = useState<"mild" | "moderate" | "severe" | null>(null)
  const [mediaFiles, setMediaFiles] = useState<string[]>([])
  const [aiAdvice, setAiAdvice] = useState<AiAdvice | null>(null)
  const [loadingAi, setLoadingAi] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function toggleSymptom(id: string) {
    setSymptoms(prev => prev.map(s => s.id === id ? { ...s, selected: !s.selected } : s))
  }

  function addCustomSymptom() {
    if (!customSymptom.trim()) return
    const id = `custom-${Date.now()}`
    setSymptoms(prev => [...prev, { id, label: customSymptom.trim(), selected: true }])
    setCustomSymptom("")
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files) return
    for (let i = 0; i < files.length; i++) {
      const reader = new FileReader()
      reader.onload = (ev) => {
        if (ev.target?.result) setMediaFiles(prev => [...prev, ev.target!.result as string])
      }
      reader.readAsDataURL(files[i])
    }
    toast.success(`${files.length} file(s) added`)
  }

  function getAiAdvice() {
    const selectedSymptoms = symptoms.filter(s => s.selected).map(s => s.label)
    if (selectedSymptoms.length === 0 && !description.trim()) {
      toast.error("Please select or describe your symptoms first")
      return
    }
    setLoadingAi(true)

    const allSymptoms = [...selectedSymptoms, description].filter(Boolean).join(", ")

    setTimeout(() => {
      const hasFever = allSymptoms.toLowerCase().includes("fever")
      const hasChestPain = allSymptoms.toLowerCase().includes("chest")
      const hasBreath = allSymptoms.toLowerCase().includes("breath")
      const hasHeadache = allSymptoms.toLowerCase().includes("headache")
      const hasPain = allSymptoms.toLowerCase().includes("pain")
      const hasRash = allSymptoms.toLowerCase().includes("rash")
      const hasCough = allSymptoms.toLowerCase().includes("cough")
      const hasNausea = allSymptoms.toLowerCase().includes("nausea")

      let urgency: AiAdvice["urgency"] = "self-care"
      let possibleConditions: string[] = ["Common cold (viral upper respiratory infection)"]
      let recommendation = "Rest, stay hydrated, and monitor your symptoms. Over-the-counter pain relief may help."

      if (hasChestPain || hasBreath) {
        urgency = "emergency"
        possibleConditions = ["Possible cardiac event", "Pulmonary embolism", "Severe asthma attack"]
        recommendation = "This could be a medical emergency. Please call emergency services (10177) or go to the nearest emergency room immediately."
      } else if (hasFever && severity === "severe") {
        urgency = "urgent"
        possibleConditions = ["Severe bacterial infection", "Influenza", "COVID-19"]
        recommendation = "Please consult a healthcare provider within 24 hours. You may need diagnostic tests."
      } else if (hasPain && severity === "severe") {
        urgency = "appointment"
        possibleConditions = ["Musculoskeletal injury", "Migraine", "Inflammatory condition"]
        recommendation = "Schedule an appointment with your primary care provider within 2-3 days."
      } else if (hasRash) {
        urgency = "appointment"
        possibleConditions = ["Allergic reaction", "Contact dermatitis", "Eczema flare-up"]
        recommendation = "Apply cool compresses and avoid irritants. Schedule an appointment if it persists."
      } else if (hasCough && hasFever) {
        urgency = "appointment"
        possibleConditions = ["Bronchitis", "Influenza", "COVID-19", "Pneumonia"]
        recommendation = "Monitor your temperature. Book an appointment for evaluation if symptoms persist beyond 3 days."
      } else {
        urgency = "self-care"
        possibleConditions = ["Viral infection (common cold)", "Tension headache", "Mild allergy", "Stress-related symptoms"]
        recommendation = "Rest, stay hydrated, and monitor your symptoms. Over-the-counter pain relief may help. If symptoms persist for more than 7 days, consult a provider."
      }

      setAiAdvice({
        possibleConditions,
        recommendation,
        urgency,
        suggestedMedication: urgency === "self-care" ? "Paracetamol or Ibuprofen (follow package instructions)" : undefined,
        disclaimer: "This is an AI-generated assessment for informational purposes only. It does not constitute a medical diagnosis. Always consult a qualified healthcare professional for medical advice.",
      })
      setLoadingAi(false)
    }, 1500)
  }

  const selectedCount = symptoms.filter(s => s.selected).length

  const urgencyColors = {
    "self-care": { bg: "bg-[#e8f5e9]", text: "text-[#34c759]", label: "Self-care recommended" },
    "appointment": { bg: "bg-[#fef0d9]", text: "text-[#ff9f0a]", label: "Book an appointment" },
    "urgent": { bg: "bg-[#fce8e6]", text: "text-[#ff3b30]", label: "Urgent care needed" },
    "emergency": { bg: "bg-[#ff3b30]/10", text: "text-[#ff3b30]", label: "EMERGENCY - Call 10177" },
  }

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      <div className="rounded-[24px] p-6 bg-gradient-to-br from-[#5856d6] to-[#007aff] text-white">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-[18px] h-[18px]" />
          <span className="text-[13px] font-semibold uppercase tracking-wider opacity-80">AI Consultation</span>
        </div>
        <h1 className="text-[28px] font-bold tracking-tight">New Illness or Concern</h1>
        <p className="text-[14px] text-white/80 mt-1">Describe your symptoms for AI-powered advice</p>
      </div>

      <Card>
        <CardContent className="p-5 space-y-4">
          <h2 className="text-[17px] font-semibold text-white">What are you experiencing?</h2>
          <p className="text-[13px] text-white/60">Tap common symptoms or type your own</p>

          <div className="flex flex-wrap gap-2">
            {symptoms.map(s => (
              <Badge
                key={s.id}
                variant={s.selected ? "default" : "secondary"}
                className={`cursor-pointer text-[13px] px-3 py-1.5 transition-all ${
                  s.selected ? "bg-[#007aff] text-white" : "bg-[#f5f5f7] text-white/60 hover:bg-[#e5e5ea]"
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

      <Card>
        <CardContent className="p-5 space-y-4">
          <h2 className="text-[17px] font-semibold text-white">Details</h2>

          <div className="space-y-1.5">
            <Label className="text-[13px] text-white/60">Describe your symptoms</Label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="When did it start? What makes it better or worse? Any other relevant information..."
                className="w-full rounded-[12px] border border-white/10 bg-white/10 px-3 py-2.5 text-[14px] text-white placeholder:text-white/40 backdrop-blur-xl focus:outline-none focus:ring-1 focus:ring-[#007aff] min-h-[100px] resize-y"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[13px] text-white/60">Duration</Label>
              <Input value={duration} onChange={e => setDuration(e.target.value)} placeholder="e.g. 2 days" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[13px] text-white/60">Severity</Label>
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
          <h2 className="text-[17px] font-semibold text-white">Add Media</h2>
          <p className="text-[13px] text-white/60">Photos or videos of visible symptoms</p>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            className="hidden"
            onChange={handleFileUpload}
          />

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1 gap-2" onClick={() => fileInputRef.current?.click()}>
              <Camera className="w-[16px] h-[16px]" />
              Camera
            </Button>
            <Button variant="outline" className="flex-1 gap-2" onClick={() => fileInputRef.current?.click()}>
              <Upload className="w-[16px] h-[16px]" />
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
              <h3 className="text-[15px] font-semibold text-white mb-2">Possible causes</h3>
              <ul className="space-y-1">
                {aiAdvice.possibleConditions.map((c, i) => (
                  <li key={i} className="flex items-start gap-2 text-[14px] text-white/60">
                    <ChevronRight className="w-[14px] h-[14px] text-[#007aff] mt-0.5 flex-shrink-0" />
                    {c}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-[15px] font-semibold text-white mb-1">Recommendation</h3>
              <p className="text-[14px] text-white/60 leading-relaxed">{aiAdvice.recommendation}</p>
            </div>

            {aiAdvice.suggestedMedication && (
              <div className="rounded-[12px] bg-[#f5f5f7] p-3">
                <p className="text-[13px] text-white/60 font-medium">Suggested medication</p>
                <p className="text-[14px] text-white">{aiAdvice.suggestedMedication}</p>
              </div>
            )}

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
            </div>

            <p className="text-[11px] text-white/60 italic">{aiAdvice.disclaimer}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
