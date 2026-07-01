import { useState, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Eye, FileText, FileImage, File, Upload, Loader2 } from "lucide-react"
import { ImagePreview } from "@/components/records/image-preview"
import { HandwrittenNoteUpload } from "@/components/records/handwritten-note-upload"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/App"

export default function Vault() {
  const { user } = useAuth()
  const [records, setRecords] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewTitle, setPreviewTitle] = useState("")
  const [uploadOpen, setUploadOpen] = useState(false)

  const loadRecords = useCallback(async () => {
    if (!user) return
    setLoading(true)

    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", user.id)
      .single()

    if (profile) {
      const { data: recordsData } = await supabase
        .from("medical_records")
        .select("*")
        .eq("patient_id", profile.id)
        .order("date", { ascending: false })
        .limit(50)

      setRecords(recordsData || [])
    }
    setLoading(false)
  }, [user])

  useEffect(() => { loadRecords() }, [loadRecords])

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[32px] font-bold text-white tracking-tight">Medical Records</h1>
          <p className="text-[16px] text-white/60 mt-1">Your secure document repository</p>
        </div>
        <Button className="gap-2 shrink-0" onClick={() => setUploadOpen(true)}>
          <Upload className="w-[18px] h-[18px]" />
          <span className="hidden sm:inline">Upload Note</span>
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-white/60" />
        <Input placeholder="Search records..." className="pl-[42px]" />
      </div>

      <HandwrittenNoteUpload
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        onSuccess={loadRecords}
      />

      <ImagePreview
        open={!!previewUrl}
        onOpenChange={(o) => { if (!o) { setPreviewUrl(null); setPreviewTitle("") } }}
        imageUrl={previewUrl || ""}
        title={previewTitle}
      />

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-white/60" />
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {records.length > 0 ? records.map((item: any) => {
            const Icon = item.record_type === "imaging" ? FileImage : item.is_handwritten ? File : FileText
            return (
              <Card key={item.id} className="transition-all duration-200">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className={iconBg(item.record_type)}>
                      <Icon className="w-[22px] h-[22px]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[15px] font-medium text-white truncate">{item.title}</h3>
                      <p className="text-[13px] text-white/60 mt-0.5">
                        {new Date(item.date).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant={badgeVariant(item.record_type)} className="text-[11px]">
                          {item.record_type.replace("_", " ")}
                        </Badge>
                        {item.is_handwritten && <Badge variant="warning" className="text-[11px]">Handwritten</Badge>}
                      </div>
                      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-[#e5e5ea]/40">
                        <button
                          className="flex items-center gap-1 text-[13px] text-white/60 hover:text-[#007aff] transition-colors"
                          onClick={() => {
                            if (item.is_handwritten && item.original_image_url) {
                              setPreviewUrl(item.original_image_url)
                              setPreviewTitle(item.title)
                            }
                          }}
                        >
                          <Eye className="w-[14px] h-[14px]" />
                          Preview
                        </button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          }) : (
            <div className="col-span-full text-center py-16">
              <div className="w-[56px] h-[56px] rounded-[16px] bg-[#f5f5f7] flex items-center justify-center mx-auto mb-4">
                <FileText className="w-[28px] h-[28px] text-white/60" />
              </div>
              <p className="text-[16px] font-medium text-white">No records yet</p>
              <p className="text-[14px] text-white/60 mt-1 max-w-sm mx-auto">
                Upload photos of handwritten notes from your doctor to keep them safe and organised.
              </p>
              <Button className="mt-4 gap-2" onClick={() => setUploadOpen(true)}>
                <Upload className="w-[18px] h-[18px]" />
                Upload Your First Note
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function iconBg(type: string) {
  const bgs: Record<string, string> = {
    consultation: "w-[40px] h-[40px] rounded-[12px] bg-[#e8f0fe] flex items-center justify-center text-[#007aff]",
    prescription: "w-[40px] h-[40px] rounded-[12px] bg-[#e8f5e9] flex items-center justify-center text-[#34c759]",
    lab_result: "w-[40px] h-[40px] rounded-[12px] bg-[#e8f5e9] flex items-center justify-center text-[#34c759]",
    imaging: "w-[40px] h-[40px] rounded-[12px] bg-[#fef0d9] flex items-center justify-center text-[#ff9f0a]",
    referral: "w-[40px] h-[40px] rounded-[12px] bg-[#f0e8fc] flex items-center justify-center text-[#af52de]",
    vaccination: "w-[40px] h-[40px] rounded-[12px] bg-[#e4f2fb] flex items-center justify-center text-[#5ac8fa]",
  }
  return bgs[type] || "w-[40px] h-[40px] rounded-[12px] bg-[#f5f5f7] flex items-center justify-center text-white/60"
}

function badgeVariant(type: string) {
  const variants: Record<string, "teal" | "default" | "success" | "warning" | "secondary"> = {
    consultation: "teal",
    prescription: "default",
    lab_result: "success",
    imaging: "warning",
    referral: "secondary",
    vaccination: "teal",
  }
  return variants[type] || "default"
}
