import { Card, CardContent } from "@/components/ui/card"
import { Share2, Loader2 } from "lucide-react"

export default function Share() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-[32px] font-bold text-white tracking-tight">Shared Records</h1>
        <p className="text-[16px] text-white/60 mt-1">Records you've shared with providers</p>
      </div>
      <div className="text-center py-16">
        <div className="w-[56px] h-[56px] rounded-[16px] bg-[#f5f5f7] flex items-center justify-center mx-auto mb-4">
          <Share2 className="w-[28px] h-[28px] text-white/60" />
        </div>
        <p className="text-[16px] font-medium text-white">No shared records</p>
        <p className="text-[14px] text-white/60 mt-1">Share records with your healthcare providers securely.</p>
      </div>
    </div>
  )
}
