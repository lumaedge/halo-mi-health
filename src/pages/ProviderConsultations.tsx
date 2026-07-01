import { Card, CardContent } from "@/components/ui/card"
import { Calendar, MessageSquare, Camera } from "lucide-react"

export default function ProviderConsultations() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-[32px] font-bold text-white tracking-tight">Consultations</h1>
        <p className="text-[16px] text-[#6e6e73] mt-1">Manage patient consultations</p>
      </div>
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-[44px] h-[44px] rounded-[12px] bg-[#e8f0fe] flex items-center justify-center">
              <Camera className="w-[22px] h-[22px] text-[#007aff]" />
            </div>
            <div>
              <h3 className="text-[17px] font-semibold text-white">Handwritten Notes</h3>
              <p className="text-[14px] text-[#6e6e73] mt-0.5">Patients upload photos via the app. Review and approve them here.</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="text-center py-16">
        <div className="w-[56px] h-[56px] rounded-[16px] bg-[#f5f5f7] flex items-center justify-center mx-auto mb-4">
          <Calendar className="w-[28px] h-[28px] text-[#6e6e73]" />
        </div>
        <p className="text-[16px] font-medium text-white">No upcoming consultations</p>
      </div>
    </div>
  )
}
