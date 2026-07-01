import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/App"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, Loader2 } from "lucide-react"

export default function Timeline() {
  const { user } = useAuth()
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    async function load() {
      const { data: profile } = await supabase.from("profiles").select("id").eq("user_id", user.id).single()
      if (profile) {
        const { data } = await supabase
          .from("timeline_events")
          .select("*")
          .eq("patient_id", profile.id)
          .order("date", { ascending: false })
        setEvents(data || [])
      }
      setLoading(false)
    }
    load()
  }, [user])

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-[#6e6e73]" /></div>

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-[32px] font-bold text-[#1d1d1f] tracking-tight">Timeline</h1>
        <p className="text-[16px] text-[#6e6e73] mt-1">Your health journey at a glance</p>
      </div>
      {events.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-[56px] h-[56px] rounded-[16px] bg-[#f5f5f7] flex items-center justify-center mx-auto mb-4">
            <Clock className="w-[28px] h-[28px] text-[#6e6e73]" />
          </div>
          <p className="text-[16px] font-medium text-[#1d1d1f]">No events yet</p>
          <p className="text-[14px] text-[#6e6e73] mt-1">Events will appear here as you add records.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((event: any) => (
            <Card key={event.id}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-2 h-2 rounded-full bg-[#007aff] flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-[15px] font-medium text-[#1d1d1f]">{event.title}</p>
                  <p className="text-[13px] text-[#6e6e73]">{event.description}</p>
                </div>
                <div className="text-right">
                  <Badge variant={event.event_type === "consultation" ? "teal" : "default"}>
                    {event.event_type}
                  </Badge>
                  <p className="text-[12px] text-[#6e6e73] mt-1">
                    {new Date(event.date).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
