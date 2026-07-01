import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, Shield, Pill, AlertTriangle, Heart, ArrowRight, Plus, Upload } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/App"

export default function PatientDashboard() {
  const { profile } = useAuth()
  const [recordsCount, setRecordsCount] = useState(0)
  const [medsCount, setMedsCount] = useState(0)
  const [conditionsCount, setConditionsCount] = useState(0)
  const [appointments, setAppointments] = useState<any[]>([])
  const [recentEvents, setRecentEvents] = useState<any[]>([])
  const [activeMeds, setActiveMeds] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile) return
    async function load() {
      const [{ count: rc }, { count: mc }, { count: cc }] = await Promise.all([
        supabase.from("medical_records").select("*", { count: "exact", head: true }).eq("patient_id", profile.id),
        supabase.from("medications").select("*", { count: "exact", head: true }).eq("patient_id", profile.id).eq("is_active", true),
        supabase.from("conditions").select("*", { count: "exact", head: true }).eq("patient_id", profile.id),
      ])
      setRecordsCount(rc ?? 0)
      setMedsCount(mc ?? 0)
      setConditionsCount(cc ?? 0)

      const { data: apts } = await supabase
        .from("appointments")
        .select("id, title, date")
        .eq("patient_id", profile.id)
        .eq("status", "scheduled")
        .gte("date", new Date().toISOString())
        .order("date", { ascending: true })
        .limit(2)
      setAppointments(apts ?? [])

      const { data: events } = await supabase
        .from("timeline_events")
        .select("title, date, event_type")
        .eq("patient_id", profile.id)
        .order("date", { ascending: false })
        .limit(3)
      setRecentEvents(events ?? [])

      const { data: meds } = await supabase
        .from("medications")
        .select("name, dosage, frequency")
        .eq("patient_id", profile.id)
        .eq("is_active", true)
        .limit(3)
      setActiveMeds(meds ?? [])

      setLoading(false)
    }
    load()
  }, [profile])

  const firstName = profile?.full_name?.split(" ")[0] ?? "there"
  const hasRecords = recordsCount > 0
  const hasMeds = medsCount > 0
  const hasAppointments = appointments.length > 0
  const hasEvents = recentEvents.length > 0

  const hour = new Date().getHours()
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening"

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-[#007aff] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="rounded-[24px] p-6 lg:p-8 hero-gradient-subtle border border-[#e5e5ea]/30">
        <h1 className="text-[32px] lg:text-[36px] font-bold text-[#1d1d1f] tracking-tight leading-tight">
          {greeting}, {firstName}.
        </h1>
        <p className="text-[16px] text-[#6e6e73] mt-1.5 max-w-lg">
          Your health records are secure and available whenever you need them.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4 animate-stagger">
        <Card className="hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 transition-all duration-300">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="w-[40px] h-[40px] rounded-[12px] bg-[#e8f0fe] flex items-center justify-center">
                <Shield className="w-[20px] h-[20px] text-[#007aff]" />
              </div>
              <Badge variant="secondary" className="text-[12px]">{recordsCount} total</Badge>
            </div>
            <h3 className="text-[17px] font-semibold text-[#1d1d1f] mt-3">Medical Records</h3>
            {hasRecords ? (
              <p className="text-[14px] text-[#6e6e73] mt-1">Your records are organised and up to date.</p>
            ) : (
              <div>
                <p className="text-[14px] text-[#6e6e73] mt-1">No records uploaded yet.</p>
                <Link to="/vault">
                  <Button size="sm" className="gap-1.5 mt-3">
                    <Plus className="w-[14px] h-[14px]" />
                    Add Record
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 transition-all duration-300">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="w-[40px] h-[40px] rounded-[12px] bg-[#e8f5e9] flex items-center justify-center">
                <Pill className="w-[20px] h-[20px] text-[#34c759]" />
              </div>
              <Badge variant="secondary" className="text-[12px]">{hasMeds ? "Active" : "Inactive"}</Badge>
            </div>
            <h3 className="text-[17px] font-semibold text-[#1d1d1f] mt-3">Medications</h3>
            {hasMeds ? (
              <div className="mt-2 space-y-1.5">
                {activeMeds.slice(0, 2).map((med: any) => (
                  <div key={med.name} className="flex items-center justify-between text-[14px]">
                    <span className="text-[#1d1d1f]">{med.name}</span>
                    <span className="text-[#6e6e73]">{med.dosage}</span>
                  </div>
                ))}
                <Link to="/medications" className="block text-[14px] text-[#007aff] font-medium mt-2">
                  View all medications →
                </Link>
              </div>
            ) : (
              <div>
                <p className="text-[14px] text-[#6e6e73] mt-1">Nothing active.</p>
                <Link to="/medications">
                  <Button size="sm" variant="outline" className="gap-1.5 mt-3">
                    <Plus className="w-[14px] h-[14px]" />
                    Add Medication
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 transition-all duration-300">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="w-[40px] h-[40px] rounded-[12px] bg-[#fef0d9] flex items-center justify-center">
                <Clock className="w-[20px] h-[20px] text-[#ff9f0a]" />
              </div>
              <Badge variant="secondary" className="text-[12px]">{appointments.length} upcoming</Badge>
            </div>
            <h3 className="text-[17px] font-semibold text-[#1d1d1f] mt-3">Appointments</h3>
            {hasAppointments ? (
              <div className="mt-2 space-y-2">
                {appointments.map((apt: any) => (
                  <div key={apt.id} className="flex items-center gap-3 text-[14px]">
                    <div className="w-2 h-2 rounded-full bg-[#007aff]" />
                    <span className="text-[#1d1d1f]">{apt.title}</span>
                    <span className="text-[#6e6e73] ml-auto text-[13px]">
                      {new Date(apt.date).toLocaleDateString("en-ZA", { day: "numeric", month: "short" })}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div>
                <p className="text-[14px] text-[#6e6e73] mt-1">No upcoming visits.</p>
                <Link to="/schedule">
                  <Button size="sm" variant="outline" className="gap-1.5 mt-3">
                    <Plus className="w-[14px] h-[14px]" />
                    Schedule Appointment
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 transition-all duration-300">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="w-[40px] h-[40px] rounded-[12px] bg-[#fce8e6] flex items-center justify-center">
                <Heart className="w-[20px] h-[20px] text-[#ff3b30]" />
              </div>
              <Badge variant="secondary" className="text-[12px]">{conditionsCount} tracked</Badge>
            </div>
            <h3 className="text-[17px] font-semibold text-[#1d1d1f] mt-3">Health Profile</h3>
            <div>
              <p className="text-[14px] text-[#6e6e73] mt-1">Manage your health information.</p>
              <Link to="/health-checks" className="inline-flex items-center gap-1 mt-3 text-[14px] text-[#007aff] font-medium">
                View health checks <ArrowRight className="w-[14px] h-[14px]" />
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {hasEvents && (
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[17px] font-semibold text-[#1d1d1f]">Recent Activity</h2>
              <Link to="/timeline" className="text-[14px] text-[#007aff] font-medium">View all</Link>
            </div>
            <div className="space-y-0">
              {recentEvents.map((event: any, i: number) => (
                <div
                  key={i}
                  className="flex items-center gap-4 py-3 border-b border-[#e5e5ea]/40 last:border-0"
                >
                  <div className="w-2 h-2 rounded-full bg-[#007aff] flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-medium text-[#1d1d1f] truncate">{event.title}</p>
                    <p className="text-[13px] text-[#6e6e73]">
                      {new Date(event.date).toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                  </div>
                  <Badge variant={event.event_type === "consultation" ? "teal" : "default"} className="flex-shrink-0">
                    {event.event_type}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Link
        to="/emergency"
        className="block rounded-[20px] p-5 bg-gradient-to-br from-[#ff3b30] to-[#ff6b6b] text-white hover:shadow-lg transition-all duration-300"
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-[18px] h-[18px]" />
              <span className="text-[13px] font-semibold uppercase tracking-wider opacity-80">Emergency</span>
            </div>
            <p className="text-[17px] font-semibold mt-2">Emergency Medical Card</p>
            <p className="text-[14px] text-white/80 mt-0.5">Quick access for first responders</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            <ArrowRight className="w-5 h-5" />
          </div>
        </div>
      </Link>
    </div>
  )
}
