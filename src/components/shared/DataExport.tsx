import { useState } from "react"
import { useAuth } from "@/App"
import { useI18n } from "@/lib/i18n/I18nProvider"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { FileText, Download, Loader2 } from "lucide-react"
import { toast } from "sonner"

export function DataExport() {
  const { t } = useI18n()
  const { user } = useAuth()
  const [exporting, setExporting] = useState(false)

  async function exportCSV() {
    if (!user) return
    setExporting(true)
    try {
      const [records, meds, conditions] = await Promise.all([
        supabase.from("medical_records").select("*").eq("patient_id", user.id),
        supabase.from("medications").select("*").eq("patient_id", user.id),
        supabase.from("conditions").select("*").eq("patient_id", user.id),
      ])

      let csv = "Type,Title,Date,Details\n"
      records.data?.forEach((r: any) => { csv += `Record,${r.title},${r.date},${r.description || ""}\n` })
      meds.data?.forEach((m: any) => { csv += `Medication,${m.name},${m.start_date},${m.dosage} ${m.frequency}\n` })
      conditions.data?.forEach((c: any) => { csv += `Condition,${c.name},${c.diagnosis_date || ""},${c.notes || ""}\n` })

      const blob = new Blob([csv], { type: "text/csv" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `medirecords-export-${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      URL.revokeObjectURL(url)
      toast.success(t("success"))
    } catch {
      toast.error(t("error"))
    }
    setExporting(false)
  }

  async function exportPDF() {
    toast.info("PDF export will use the browser's print-to-PDF feature")
    window.print()
  }

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-[12px] bg-[#e8f0fe] flex items-center justify-center">
            <FileText className="w-5 h-5 text-[#007aff]" />
          </div>
          <div>
            <h3 className="text-[17px] font-semibold text-[#1d1d1f]">{t("exportData")}</h3>
            <p className="text-[13px] text-[#6e6e73]">{t("exportDesc")}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1 gap-2" onClick={exportCSV} disabled={exporting}>
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {t("exportCSV")}
          </Button>
          <Button variant="outline" className="flex-1 gap-2" onClick={exportPDF}>
            <Download className="w-4 h-4" />
            {t("exportPDF")}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
