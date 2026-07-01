"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { UploadDropzone } from "@/components/ui/upload-dropzone"
import { Upload, Loader2, CheckCircle, AlertCircle } from "lucide-react"
import { useAuth } from "@/App"
import { tauriUploadHandwrittenNote, isTauri } from "@/lib/tauri"
import type { RecordType } from "@/types"

const recordTypes: { value: RecordType; label: string }[] = [
  { value: "consultation", label: "Consultation Note" },
  { value: "prescription", label: "Prescription" },
  { value: "lab_result", label: "Lab Result" },
  { value: "imaging", label: "Imaging / X-Ray" },
  { value: "referral", label: "Referral Letter" },
  { value: "note", label: "General Note" },
]

interface HandwrittenNoteUploadProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function HandwrittenNoteUpload({ open, onOpenChange, onSuccess }: HandwrittenNoteUploadProps) {
  const { user } = useAuth()
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [recordType, setRecordType] = useState<RecordType>("consultation")
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<{ success?: boolean; error?: string } | null>(null)

  function resetState() {
    setFile(null)
    setTitle("")
    setDescription("")
    setRecordType("consultation")
    setUploading(false)
    setResult(null)
  }

  async function handleUpload() {
    if (!file || !title || !user) return

    setUploading(true)
    setResult(null)

    const arrayBuffer = await file.arrayBuffer()
    const fileData = Array.from(new Uint8Array(arrayBuffer))

    const res = await tauriUploadHandwrittenNote(
      user.id,
      user.email ?? "",
      user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "User",
      fileData,
      file.name,
      file.type,
      title,
      description,
      recordType,
    )
    setResult(res)
    setUploading(false)

    if (res.success) {
      onSuccess?.()
      setTimeout(() => { onOpenChange(false); resetState() }, 1200)
    }
  }

  const inTauri = isTauri()

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) resetState(); onOpenChange(o) }}>
      <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[20px]">Upload Handwritten Note</DialogTitle>
          <DialogDescription className="text-[14px] text-[#6e6e73]">
            {inTauri ? "Take a photo of the handwritten note your doctor gave you." : "This feature is only available in the mobile app."}
          </DialogDescription>
        </DialogHeader>
        {!inTauri && (
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            <div className="w-12 h-12 rounded-full bg-[#f5f5f7] flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-[#6e6e73]" />
            </div>
            <p className="text-[15px] text-[#6e6e73]">Download the Halo Mi Health app to upload handwritten notes directly from your phone.</p>
          </div>
        )}
        {inTauri && (

        <div className="space-y-5">
          <UploadDropzone
            onFileSelected={(f) => setFile(f)}
            onFileRemoved={() => setFile(null)}
          />

          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="e.g. Follow-up consultation notes"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="record-type">Record Type</Label>
            <div className="flex flex-wrap gap-2">
              {recordTypes.map((rt) => (
                <button
                  key={rt.value}
                  type="button"
                  onClick={() => setRecordType(rt.value)}
                  className={`px-3 py-1.5 rounded-[8px] text-[13px] font-medium transition-all duration-200 ${
                    recordType === rt.value
                      ? "bg-[#007aff] text-white"
                      : "bg-[#f5f5f7] text-[#6e6e73] hover:bg-[#e5e5ea]"
                  }`}
                >
                  {rt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Notes (optional)</Label>
            <textarea
              id="description"
              rows={3}
              placeholder="Any additional context about this note..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-[14px] border border-[#e5e5ea] bg-white px-4 py-3 text-[15px] text-[#1d1d1f] placeholder:text-[#6e6e73] focus:outline-none focus:ring-2 focus:ring-[#007aff]/30 focus:border-[#007aff] transition-all duration-200 resize-none"
            />
          </div>

          {result?.error && (
            <div className="flex items-center gap-2 p-3 bg-[#fff0ef] rounded-[12px] text-[14px] text-[#ff3b30]">
              <AlertCircle className="w-[18px] h-[18px] shrink-0" />
              {result.error}
            </div>
          )}

          {result?.success && (
            <div className="flex items-center gap-2 p-3 bg-[#e8f5e9] rounded-[12px] text-[14px] text-[#34c759]">
              <CheckCircle className="w-[18px] h-[18px] shrink-0" />
              Note uploaded successfully!
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={uploading}>
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!file || !title || uploading}
              className="gap-2 min-w-[140px]"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-[18px] h-[18px] animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-[18px] h-[18px]" />
                  Upload Note
                </>
              )}
            </Button>
          </div>
        </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
