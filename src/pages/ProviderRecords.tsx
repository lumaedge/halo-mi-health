import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/App"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Shield, Eye } from "lucide-react"
import { CardListSkeletonFallback } from "@/components/skeletons"
import { ImagePreview } from "@/components/records/image-preview"

export default function ProviderRecords() {
  const { profile } = useAuth()
  const [records, setRecords] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewTitle, setPreviewTitle] = useState("")

  useEffect(() => {
    if (!profile) return
    async function load() {
      const { data } = await supabase
        .from("medical_records")
        .select("*, profiles!medical_records_patient_id_fkey(full_name)")
        .eq("provider_id", profile.id)
        .order("date", { ascending: false })
      setRecords(data || [])
      setLoading(false)
    }
    load()
  }, [profile])

  const pending = records.filter((r) => !r.is_approved)
  const approved = records.filter((r) => r.is_approved)

  if (loading) return <CardListSkeletonFallback count={4} />

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-[32px] font-bold text-[#1d1d1f] tracking-tight">Patient Records</h1>
        <p className="text-[16px] text-[#6e6e73] mt-1">View and manage shared patient records</p>
      </div>
      <ImagePreview
        open={!!previewUrl}
        onOpenChange={(o) => { if (!o) { setPreviewUrl(null); setPreviewTitle("") } }}
        imageUrl={previewUrl || ""}
        title={previewTitle}
      />
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All ({records.length})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({pending.length})</TabsTrigger>
          <TabsTrigger value="approved">Approved ({approved.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="all">
          <RecordsList records={records} onPreview={(url, title) => { setPreviewUrl(url); setPreviewTitle(title) }} />
        </TabsContent>
        <TabsContent value="pending">
          <RecordsList records={pending} onPreview={(url, title) => { setPreviewUrl(url); setPreviewTitle(title) }} />
        </TabsContent>
        <TabsContent value="approved">
          <RecordsList records={approved} onPreview={(url, title) => { setPreviewUrl(url); setPreviewTitle(title) }} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function RecordsList({ records, onPreview }: { records: any[]; onPreview: (url: string, title: string) => void }) {
  if (records.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-[56px] h-[56px] rounded-[16px] bg-[#f5f5f7] flex items-center justify-center mx-auto mb-4">
          <Shield className="w-[28px] h-[28px] text-[#6e6e73]" />
        </div>
        <p className="text-[16px] font-medium text-[#1d1d1f]">No records found</p>
      </div>
    )
  }
  return (
    <div className="space-y-3">
      {records.map((record: any) => (
        <Card key={record.id}>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[15px] font-medium text-[#1d1d1f]">{record.title}</p>
              <p className="text-[13px] text-[#6e6e73]">
                {record.profiles?.full_name || "Unknown"} &middot; {new Date(record.date).toLocaleDateString()}
              </p>
              <div className="flex gap-2 mt-2">
                <Badge variant={record.is_handwritten ? "warning" : "default"}>
                  {record.is_handwritten ? "Handwritten" : "Digital"}
                </Badge>
                <Badge variant={record.is_approved ? "success" : "secondary"}>
                  {record.is_approved ? "Approved" : "Pending"}
                </Badge>
              </div>
            </div>
            {record.is_handwritten && record.original_image_url && (
              <button
                className="flex items-center gap-1 text-[13px] text-[#007aff] hover:underline"
                onClick={() => onPreview(record.original_image_url, record.title)}
              >
                <Eye className="w-[14px] h-[14px]" /> View Note
              </button>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
