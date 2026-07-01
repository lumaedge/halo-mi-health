import { Card, CardContent } from "@/components/ui/card"
import { Calendar } from "lucide-react"

export default function ProviderSchedule() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-[32px] font-bold text-white tracking-tight">Schedule</h1>
        <p className="text-[16px] text-[#6e6e73] mt-1">Manage your appointments</p>
      </div>
      <div className="text-center py-16">
        <div className="w-[56px] h-[56px] rounded-[16px] bg-[#f5f5f7] flex items-center justify-center mx-auto mb-4">
          <Calendar className="w-[28px] h-[28px] text-[#6e6e73]" />
        </div>
        <p className="text-[16px] font-medium text-white">No appointments scheduled</p>
      </div>
    </div>
  )
}
