import { useState, useRef } from "react"
import { useI18n } from "@/lib/i18n/I18nProvider"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Camera, Upload, ScanLine, Check, RotateCcw } from "lucide-react"
import { toast } from "sonner"

interface Props {
  onTextExtracted: (text: string) => void
}

export function OcrCapture({ onTextExtracted }: Props) {
  const { t } = useI18n()
  const [image, setImage] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState("")
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file")
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => setImage(e.target?.result as string)
    reader.readAsDataURL(file)
    setProcessing(true)
    setResult("")

    try {
      const Tesseract = await import("tesseract.js")
      const { data } = await Tesseract.recognize(file, "eng+afr", {
        logger: (m: any) => { if (m.status === "recognizing text") setResult(m.progress > 0 ? `Processing... ${Math.round(m.progress * 100)}%` : "") },
      })
      setResult(data.text)
      onTextExtracted(data.text)
      toast.success(t("scanResult"))
    } catch {
      toast.error(t("error"))
    }
    setProcessing(false)
  }

  return (
    <Card>
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[12px] bg-[#e8f0fe] flex items-center justify-center">
            <ScanLine className="w-5 h-5 text-[#007aff]" />
          </div>
          <div>
            <h3 className="text-[17px] font-semibold text-[#1d1d1f]">{t("scanPrescription")}</h3>
          </div>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
        />

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1 gap-2" onClick={() => fileRef.current?.click()}>
            <Camera className="w-4 h-4" />
            {t("takePhoto")}
          </Button>
          <Button variant="outline" className="flex-1 gap-2" onClick={() => fileRef.current?.click()}>
            <Upload className="w-4 h-4" />
            {t("chooseFromGallery")}
          </Button>
        </div>

        {image && (
          <div className="rounded-[16px] overflow-hidden border border-[#e5e5ea]">
            <img src={image} alt="Capture" className="w-full h-auto" />
          </div>
        )}

        {processing && (
          <div className="flex items-center gap-3 text-[15px] text-[#6e6e73]">
            <div className="w-5 h-5 border-2 border-[#007aff] border-t-transparent rounded-full animate-spin" />
            {result || t("processing")}
          </div>
        )}

        {result && !processing && (
          <div className="space-y-3">
            <div className="rounded-[14px] bg-[#f5f5f7] p-4">
              <p className="text-[13px] text-[#6e6e73] font-medium mb-1">{t("scanResult")}</p>
              <p className="text-[15px] text-[#1d1d1f] whitespace-pre-wrap">{result}</p>
            </div>
            <div className="flex gap-3">
              <Button className="flex-1 gap-1.5" onClick={() => { toast.success(t("confirmText")) }}>
                <Check className="w-4 h-4" /> {t("confirmText")}
              </Button>
              <Button variant="outline" className="gap-1.5" onClick={() => { setImage(null); setResult("") }}>
                <RotateCcw className="w-4 h-4" /> {t("retake")}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
