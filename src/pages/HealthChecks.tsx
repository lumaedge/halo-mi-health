import { useState, useEffect } from "react"
import { useAuth } from "@/App"
import { supabase } from "@/lib/supabase"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Heart, Activity, Syringe, Calendar, ArrowRight, Check, AlertCircle, ChevronRight, Stethoscope, Sparkles, Pill, ClipboardList } from "lucide-react"
import { Link } from "react-router-dom"
import type { Condition } from "@/types"

type AgeGroup = "child" | "teen" | "adult" | "adult_40" | "senior"

interface HealthCheckItem {
  id: string
  label: string
  category: "immunization" | "vaccine" | "screening" | "cancer" | "genetic" | "annual"
  dueAge?: string
  description?: string
  completed?: boolean
}

const healthChecksByAge: Record<AgeGroup, { label: string; range: string; icon: any; checks: HealthCheckItem[] }> = {
  child: {
    label: "Children",
    range: "0–12 years",
    icon: Heart,
    checks: [
      { id: "hep-b-birth", label: "Hepatitis B (Birth dose)", category: "immunization", dueAge: "Birth" },
      { id: "bcg", label: "BCG (Tuberculosis)", category: "immunization", dueAge: "Birth" },
      { id: "polio-1", label: "Polio (OPV/IPV) - Dose 1", category: "immunization", dueAge: "6 weeks" },
      { id: "dtaP-1", label: "DTaP (Diphtheria, Tetanus, Pertussis) - Dose 1", category: "immunization", dueAge: "6 weeks" },
      { id: "hib-1", label: "Hib (Haemophilus influenzae type b)", category: "immunization", dueAge: "6 weeks" },
      { id: "pcv-1", label: "PCV (Pneumococcal) - Dose 1", category: "immunization", dueAge: "6 weeks" },
      { id: "rota-1", label: "Rotavirus - Dose 1", category: "immunization", dueAge: "6 weeks" },
      { id: "mmr-1", label: "MMR (Measles, Mumps, Rubella) - Dose 1", category: "vaccine", dueAge: "12 months" },
      { id: "varicella", label: "Varicella (Chickenpox)", category: "vaccine", dueAge: "12 months" },
      { id: "hep-a", label: "Hepatitis A", category: "vaccine", dueAge: "12 months" },
      { id: "growth-check", label: "Growth monitoring (height, weight, BMI)", category: "annual", dueAge: "Annual" },
      { id: "vision-hearing", label: "Vision & hearing screening", category: "screening", dueAge: "School entry" },
    ],
  },
  teen: {
    label: "Teens",
    range: "13–17 years",
    icon: Activity,
    checks: [
      { id: "hpv", label: "HPV Vaccine (2 doses)", category: "vaccine", dueAge: "9–14 years" },
      { id: "tdap-booster", label: "Tdap Booster (Tetanus, Diphtheria, Pertussis)", category: "vaccine", dueAge: "11–12 years" },
      { id: "meningococcal", label: "Meningococcal Vaccine", category: "vaccine", dueAge: "11–12 years" },
      { id: "depression-screen", label: "Depression & mental health screening", category: "screening" },
      { id: "substance-use", label: "Substance use screening", category: "screening" },
      { id: "sexual-health", label: "Sexual health education & STI screening", category: "screening" },
      { id: "dental-check", label: "Annual dental check-up", category: "annual", dueAge: "Annual" },
    ],
  },
  adult: {
    label: "Adults",
    range: "18–39 years",
    icon: Stethoscope,
    checks: [
      { id: "bp-screen", label: "Blood pressure screening", category: "screening", dueAge: "Every 2 years" },
      { id: "cholesterol", label: "Cholesterol screening", category: "screening", dueAge: "Every 5 years" },
      { id: "bmi-check", label: "BMI & weight assessment", category: "annual", dueAge: "Annual" },
      { id: "cervical-screen", label: "Cervical cancer screening (Pap smear)", category: "cancer", dueAge: "Every 3 years (21–65)" },
      { id: "sti-screen", label: "STI screening (chlamydia, gonorrhea)", category: "screening", dueAge: "Annual if sexually active" },
      { id: "depression-screen", label: "Depression screening", category: "screening" },
      { id: "hiv-test", label: "HIV test", category: "screening", dueAge: "At least once" },
      { id: "dental-check", label: "Annual dental check-up", category: "annual", dueAge: "Annual" },
    ],
  },
  adult_40: {
    label: "Adults 40+",
    range: "40–64 years",
    icon: ClipboardList,
    checks: [
      { id: "bp-screen-40", label: "Blood pressure screening", category: "screening", dueAge: "Annual" },
      { id: "cholesterol-40", label: "Cholesterol & lipid panel", category: "screening", dueAge: "Annual" },
      { id: "diabetes-screen", label: "Type 2 diabetes screening (HbA1c)", category: "screening", dueAge: "Every 3 years" },
      { id: "mammogram", label: "Breast cancer screening (Mammogram)", category: "cancer", dueAge: "Every 2 years (40–74)" },
      { id: "colonoscopy", label: "Colorectal cancer screening (Colonoscopy)", category: "cancer", dueAge: "Every 10 years (45+)" },
      { id: "eye-exam", label: "Comprehensive eye exam", category: "screening", dueAge: "Every 2 years" },
      { id: "bone-density", label: "Bone density screening (DEXA)", category: "screening", dueAge: "65+ or risk factors" },
      { id: "lung-cancer", label: "Lung cancer screening (Low-dose CT)", category: "cancer", dueAge: "Annual (smoking history)" },
      { id: "dental-check-40", label: "Annual dental check-up", category: "annual", dueAge: "Annual" },
    ],
  },
  senior: {
    label: "Seniors",
    range: "65+ years",
    icon: Heart,
    checks: [
      { id: "bp-screen-65", label: "Blood pressure screening", category: "screening", dueAge: "Annual" },
      { id: "diabetes-screen-65", label: "Diabetes screening", category: "screening", dueAge: "Annual" },
      { id: "bone-density-65", label: "Bone density screening (Osteoporosis)", category: "screening", dueAge: "At least once" },
      { id: "hearing-test", label: "Hearing test", category: "screening", dueAge: "Annual" },
      { id: "vision-test-65", label: "Vision screening (Glaucoma, Cataracts)", category: "screening", dueAge: "Annual" },
      { id: "cognitive-screen", label: "Cognitive impairment screening", category: "screening" },
      { id: "falls-risk", label: "Fall risk assessment", category: "screening" },
      { id: "medication-review", label: "Medication review & deprescribing", category: "annual", dueAge: "Annual" },
      { id: "pneumococcal-65", label: "Pneumococcal vaccine (PCV13 & PPSV23)", category: "vaccine", dueAge: "65+" },
      { id: "flu-vaccine", label: "Influenza vaccine (annual)", category: "vaccine", dueAge: "Annual" },
      { id: "shingles-vaccine", label: "Shingles vaccine (RZV)", category: "vaccine", dueAge: "50+" },
      { id: "dental-check-65", label: "Annual dental check-up", category: "annual", dueAge: "Annual" },
    ],
  },
}

function getAgeGroup(dob: string): AgeGroup {
  const age = Math.floor((Date.now() - new Date(dob).getTime()) / 31557600000)
  if (age < 13) return "child"
  if (age < 18) return "teen"
  if (age < 40) return "adult"
  if (age < 65) return "adult_40"
  return "senior"
}

const categoryColors: Record<string, string> = {
  immunization: "bg-[#e8f0fe] text-[#007aff]",
  vaccine: "bg-[#e8f5e9] text-[#34c759]",
  screening: "bg-[#fef0d9] text-[#ff9f0a]",
  cancer: "bg-[#fce8e6] text-[#ff3b30]",
  genetic: "bg-[#f0e6ff] text-[#5856d6]",
  annual: "bg-[#f5f5f7] text-[#6e6e73]",
}

const categoryLabels: Record<string, string> = {
  immunization: "Immunization",
  vaccine: "Vaccine",
  screening: "Screening",
  cancer: "Cancer Screening",
  genetic: "Genetic",
  annual: "Annual",
}

export default function HealthChecks() {
  const { user } = useAuth()
  const [conditions, setConditions] = useState<Condition[]>([])
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [ageGroup, setAgeGroup] = useState<AgeGroup>("adult")
  const [completedChecks, setCompletedChecks] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!user) return
    async function load() {
      const { data: prof } = await supabase.from("profiles").select("*").eq("user_id", user.id).single()
      if (prof) {
        setProfile(prof)
        if (prof.date_of_birth) setAgeGroup(getAgeGroup(prof.date_of_birth))
        const { data: conds } = await supabase.from("conditions").select("*").eq("patient_id", prof.id)
        setConditions(conds || [])
        const saved = localStorage.getItem(`health-checks-${prof.id}`)
        if (saved) setCompletedChecks(new Set(JSON.parse(saved)))
      }
      setLoading(false)
    }
    load()
  }, [user])

  function toggleCheck(id: string) {
    setCompletedChecks(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      if (profile) localStorage.setItem(`health-checks-${profile.id}`, JSON.stringify([...next]))
      return next
    })
  }

  const hasChronic = conditions.some(c => c.is_chronic)
  const group = healthChecksByAge[ageGroup]
  const totalChecks = group.checks.length
  const doneChecks = group.checks.filter(c => completedChecks.has(c.id)).length

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-[#007aff] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-[32px] font-bold text-[#1d1d1f] tracking-tight">Health Checks</h1>
        <p className="text-[16px] text-[#6e6e73] mt-1">Age-appropriate screenings & immunisations</p>
      </div>

      {hasChronic ? (
        <Card className="border-[#ff9f0a]/30 bg-gradient-to-br from-[#ff9f0a]/5 to-transparent">
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <div className="w-[40px] h-[40px] rounded-[12px] bg-[#fef0d9] flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-[20px] h-[20px] text-[#ff9f0a]" />
              </div>
              <div>
                <h2 className="text-[17px] font-semibold text-[#1d1d1f]">Chronic Conditions Detected</h2>
                <p className="text-[14px] text-[#6e6e73] mt-1">
                  You have {conditions.filter(c => c.is_chronic).length} chronic condition(s) registered.
                </p>
                <div className="mt-3 space-y-1.5">
                  {conditions.filter(c => c.is_chronic).map(c => (
                    <div key={c.id} className="flex items-center gap-2 text-[14px]">
                      <Badge variant="warning" className="h-[20px] px-1.5 text-[11px]">Chronic</Badge>
                      <span className="text-[#1d1d1f]">{c.name}</span>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2 mt-4">
                  <Link to="/medications">
                    <Button size="sm" className="gap-1.5">
                      <Pill className="w-[14px] h-[14px]" />
                      View Prescriptions
                    </Button>
                  </Link>
                  <Link to="/timeline">
                    <Button size="sm" variant="outline" className="gap-1.5">
                      <Calendar className="w-[14px] h-[14px]" />
                      Manage Conditions
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-[#34c759]/30 bg-gradient-to-br from-[#34c759]/5 to-transparent">
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <div className="w-[40px] h-[40px] rounded-[12px] bg-[#e8f5e9] flex items-center justify-center flex-shrink-0">
                <Check className="w-[20px] h-[20px] text-[#34c759]" />
              </div>
              <div>
                <h2 className="text-[17px] font-semibold text-[#1d1d1f]">No Chronic Conditions</h2>
                <p className="text-[14px] text-[#6e6e73] mt-1">
                  Great news! No chronic conditions recorded. Keep up with your annual health checks below.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center gap-3 rounded-[16px] bg-white p-4 border border-[#e5e5ea]/40">
        <div className="w-[44px] h-[44px] rounded-[12px] bg-[#e8f0fe] flex items-center justify-center">
          <group.icon className="w-[22px] h-[22px] text-[#007aff]" />
        </div>
        <div className="flex-1">
          <p className="text-[15px] font-semibold text-[#1d1d1f]">{group.label}</p>
          <p className="text-[13px] text-[#6e6e73]">{group.range}</p>
        </div>
        <div className="text-right">
          <p className="text-[22px] font-bold text-[#007aff]">{doneChecks}/{totalChecks}</p>
          <p className="text-[11px] text-[#6e6e73]">completed</p>
        </div>
      </div>

      <Progress value={totalChecks > 0 ? (doneChecks / totalChecks) * 100 : 0} className="h-1.5" />

      <div className="space-y-2">
        {group.checks.map(check => {
          const done = completedChecks.has(check.id)
          return (
            <button
              key={check.id}
              onClick={() => toggleCheck(check.id)}
              className="w-full text-left"
            >
              <Card className={`transition-all duration-200 ${done ? 'opacity-60' : 'hover:shadow-sm'}`}>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={`w-[20px] h-[20px] rounded-[6px] border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                    done ? 'bg-[#34c759] border-[#34c759]' : 'border-[#c7c7cc]'
                  }`}>
                    {done && <Check className="w-[12px] h-[12px] text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-[14px] font-medium ${done ? 'text-[#6e6e73] line-through' : 'text-[#1d1d1f]'}`}>
                      {check.label}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge className={`text-[10px] px-1.5 py-0 h-[18px] ${categoryColors[check.category]}`}>
                        {categoryLabels[check.category]}
                      </Badge>
                      {check.dueAge && (
                        <span className="text-[11px] text-[#6e6e73]">Due: {check.dueAge}</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </button>
          )
        })}
      </div>

      <Link to="/new-consultation">
        <Card className="bg-gradient-to-br from-[#007aff] to-[#5856d6] text-white hover:shadow-lg transition-all duration-300">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-[40px] h-[40px] rounded-[12px] bg-white/20 flex items-center justify-center">
                  <Sparkles className="w-[20px] h-[20px]" />
                </div>
                <div>
                  <p className="text-[17px] font-semibold">New Illness or Concern?</p>
                  <p className="text-[13px] text-white/80">Describe symptoms for AI advice & action plan</p>
                </div>
              </div>
              <ChevronRight className="w-[20px] h-[20px] text-white/60" />
            </div>
          </CardContent>
        </Card>
      </Link>
    </div>
  )
}
