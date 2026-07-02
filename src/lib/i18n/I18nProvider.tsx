import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import type { Language } from "./translations"
import { translations } from "./translations"
import { useOnlineStatus } from "@/lib/useOnlineStatus"

interface I18nContext {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

const I18nCtx = createContext<I18nContext>({
  language: "en",
  setLanguage: () => {},
  t: (key: string) => key,
})

const STORAGE_KEY = "halo-lang"

function getInitialLanguage(): Language {
  if (typeof window === "undefined") return "en"
  const stored = localStorage.getItem(STORAGE_KEY) as Language | null
  if (stored && stored in translations) return stored
  const browser = navigator.language?.slice(0, 2)
  if (browser === "zu" || browser === "xh" || browser === "af") return browser
  return "en"
}

function OnlineStatusWatcher(): null {
  useOnlineStatus()
  return null
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(getInitialLanguage)

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem(STORAGE_KEY, lang)
    document.documentElement.lang = lang
  }

  useEffect(() => {
    document.documentElement.lang = language
  }, [language])

  const t = (key: string): string => {
    const dict = translations[language]
    return (dict as any)[key] ?? key
  }

  return (
    <I18nCtx.Provider value={{ language, setLanguage, t }}>
      <OnlineStatusWatcher />
      {children}
    </I18nCtx.Provider>
  )
}

export function useI18n() {
  return useContext(I18nCtx)
}
