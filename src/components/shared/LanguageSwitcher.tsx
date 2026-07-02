import { useI18n } from "@/lib/i18n/I18nProvider"
import { languages, type Language } from "@/lib/i18n/translations"
import { Globe } from "lucide-react"

export function LanguageSwitcher() {
  const { language, setLanguage, t } = useI18n()

  return (
    <div className="relative group">
      <button className="flex items-center gap-1.5 text-[13px] text-[#6e6e73] hover:text-[#1d1d1f] transition-colors px-2 py-1 rounded-[8px] hover:bg-[#f5f5f7]">
        <Globe className="w-[14px] h-[14px]" />
        <span>{languages[language]}</span>
      </button>
      <div className="absolute right-0 top-full mt-1 w-[160px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 translate-y-1 group-hover:translate-y-0 z-50">
        <div className="bg-white rounded-[14px] shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-[#e5e5ea]/60 p-1.5">
          {(Object.entries(languages) as [Language, string][]).map(([code, label]) => (
            <button
              key={code}
              onClick={() => setLanguage(code)}
              className={`w-full text-left px-3 py-2 rounded-[10px] text-[14px] transition-colors ${
                language === code
                  ? "bg-[#007aff] text-white font-medium"
                  : "text-[#1d1d1f] hover:bg-[#f5f5f7]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
