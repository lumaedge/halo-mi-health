import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/App"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Pill, Loader2, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function Medications() {
  const { user } = useAuth()
  const [meds, setMeds] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    async function load() {
      const { data: profile } = await supabase.from("profiles").select("id").eq("user_id", user.id).single()
      if (profile) {
        const { data } = await supabase
          .from("medications")
          .select("*")
          .eq("patient_id", profile.id)
          .order("created_at", { ascending: false })
        setMeds(data || [])
      }
      setLoading(false)
    }
    load()
  }, [user])

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-[#6e6e73]" /></div>

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[32px] font-bold text-[#1d1d1f] tracking-tight">Medications</h1>
          <p className="text-[16px] text-[#6e6e73] mt-1">Track your medications and dosages</p>
        </div>
        <Button className="gap-2"><Plus className="w-[18px] h-[18px]" />Add</Button>
      </div>
      {meds.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-[56px] h-[56px] rounded-[16px] bg-[#f5f5f7] flex items-center justify-center mx-auto mb-4">
            <Pill className="w-[28px] h-[28px] text-[#6e6e73]" />
          </div>
          <p className="text-[16px] font-medium text-[#1d1d1f]">No medications tracked</p>
          <p className="text-[14px] text-[#6e6e73] mt-1">Add your first medication.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {meds.map((med: any) => (
            <Card key={med.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-[15px] font-medium text-[#1d1d1f]">{med.name}</p>
                  <p className="text-[13px] text-[#6e6e73]">{med.dosage} &middot; {med.frequency}</p>
                </div>
                <Badge variant={med.is_active ? "success" : "secondary"}>
                  {med.is_active ? "Active" : "Inactive"}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
