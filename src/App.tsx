import { useState, useEffect, createContext, useContext, lazy, Suspense } from "react"
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from "react-router-dom"
import { Toaster } from "sonner"
import { Analytics } from "@vercel/analytics/react"
import { supabase } from "@/lib/supabase"
import type { User as SupabaseUser } from "@supabase/supabase-js"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { LayoutDashboard, Clock, Shield, Pill, User, Share2, AlertTriangle, Heart, ClipboardList, Sparkles, Bell, HeartPulse, Grid3X3, MessageCircle } from "lucide-react"
import { I18nProvider, useI18n } from "@/lib/i18n/I18nProvider"
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher"
import { OnboardingWizard } from "@/components/shared/OnboardingWizard"
import { Analytics } from "@vercel/analytics/react"

const Login = lazy(() => import("@/pages/Login"))
const Register = lazy(() => import("@/pages/Register"))
const PatientDashboard = lazy(() => import("@/pages/PatientDashboard"))
const Vault = lazy(() => import("@/pages/Vault"))
const Timeline = lazy(() => import("@/pages/Timeline"))
const Medications = lazy(() => import("@/pages/Medications"))
const Profile = lazy(() => import("@/pages/Profile"))
const Emergency = lazy(() => import("@/pages/Emergency"))
const HealthChecks = lazy(() => import("@/pages/HealthChecks"))
const NewConsultation = lazy(() => import("@/pages/NewConsultation"))
const Reminders = lazy(() => import("@/pages/Reminders"))
const Conditions = lazy(() => import("@/pages/Conditions"))
const Share = lazy(() => import("@/pages/Share"))
const ProviderRecords = lazy(() => import("@/pages/ProviderRecords"))
const ProviderConsultations = lazy(() => import("@/pages/ProviderConsultations"))
const ProviderPatients = lazy(() => import("@/pages/ProviderPatients"))
const ProviderSchedule = lazy(() => import("@/pages/ProviderSchedule"))
const Messages = lazy(() => import("@/pages/Messages"))

interface AuthContext {
  user: SupabaseUser | null
  profile: { id: string; role: string; full_name: string; email: string } | null
  loading: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthCtx = createContext<AuthContext>({
  user: null, profile: null, loading: true,
  signOut: async () => {}, refreshProfile: async () => {},
})

export function useAuth() { return useContext(AuthCtx) }

function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [profile, setProfile] = useState<AuthContext["profile"] | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = async (u: SupabaseUser) => {
    try {
      const email = u.email ?? ""
      const fullName = u.user_metadata?.full_name ?? email.split("@")[0] ?? "User"
      const { data } = await supabase.from("profiles").upsert({
        user_id: u.id, full_name: fullName, email, role: "patient", updated_at: new Date().toISOString()
      }, { onConflict: "user_id" }).select("id, role, full_name, email").maybeSingle()
      if (data) {
        setProfile(data)
      } else {
        setProfile({ id: u.id, role: "patient", full_name: fullName, email })
      }
    } catch (e) {
      console.error("Profile upsert failed", e)
      setProfile({ id: u.id, role: "patient", full_name: u.user_metadata?.full_name ?? u.email?.split("@")[0] ?? "User", email: u.email ?? "" })
    }
  }

  const refreshProfile = async () => {
    if (user) await fetchProfile(user)
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      try {
        if (session?.user) { setUser(session.user); await fetchProfile(session.user) }
      } catch (e) { console.error("Session init error", e) }
      finally { setLoading(false) }
    }, () => setLoading(false))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) { setUser(session.user); fetchProfile(session.user).catch(() => {}) }
      else { setUser(null); setProfile(null) }
    })
    return () => subscription.unsubscribe()
  }, [])

  return (
    <AuthCtx.Provider value={{ user, profile, loading, signOut, refreshProfile }}>
      {children}
    </AuthCtx.Provider>
  )

  async function signOut() { await supabase.auth.signOut() }
}

const onboardingCache = { checked: false, show: false }

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [checkingOnboarding, setCheckingOnboarding] = useState(true)

  useEffect(() => {
    setCheckingOnboarding(false)
  }, [user])

  if (loading || checkingOnboarding) return <div className="min-h-screen flex items-center justify-center"><div className="w-6 h-6 border-2 border-[#007aff] border-t-transparent rounded-full animate-spin" /></div>
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />
  if (showOnboarding) return <OnboardingWizard onComplete={() => setShowOnboarding(false)} />
  return <>{children}</>
}

const tabNav = [
  { href: "/dashboard", labelKey: "navHome", icon: LayoutDashboard },
  { href: "/vault", labelKey: "navRecords", icon: Shield },
  { href: "/conditions", labelKey: "navConditions", icon: HeartPulse },
  { href: "/medications", labelKey: "navMedications", icon: Pill },
  { href: "/profile", labelKey: "navProfile", icon: User },
]

const extraNav = [
  {
    sectionKey: "navActivity",
    items: [
      { href: "/timeline", labelKey: "navTimeline", icon: Clock },
      { href: "/messages", labelKey: "messages", icon: MessageCircle },
    ],
  },
  {
    sectionKey: "navHealth",
    items: [
      { href: "/reminders", labelKey: "navReminders", icon: Bell },
      { href: "/health-checks", labelKey: "navHealthChecks", icon: ClipboardList },
      { href: "/new-consultation", labelKey: "navSymptomCheck", icon: Sparkles },
    ],
  },
  {
    sectionKey: "navSafety",
    items: [
      { href: "/emergency", labelKey: "navEmergency", icon: AlertTriangle },
      { href: "/share", labelKey: "navShare", icon: Share2 },
    ],
  },
]

function AppLayout({ children }: { children: React.ReactNode }) {
  const { signOut } = useAuth()
  const { t } = useI18n()
  const { pathname } = useLocation()
  const [showMoreSheet, setShowMoreSheet] = useState(false)

  return (
    <div className="min-h-screen">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-[#007aff] focus:text-white focus:rounded-[12px] focus:text-[14px] focus:font-medium">
        Skip to content
      </a>
      <header className="fixed top-3 left-3 right-3 z-40 glass-strong rounded-[16px] shadow-[0_4px_24px_rgba(0,0,0,0.08),0_1px_4px_rgba(0,0,0,0.04)] mx-auto max-w-lg">
        <div className="flex items-center justify-between h-[48px] px-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-[6px] bg-[#007aff] flex items-center justify-center">
              <Heart className="w-3 h-3 text-white" fill="white" />
            </div>
            <span className="text-[15px] font-semibold text-[#1d1d1f] tracking-tight">{t("appName")}</span>
          </div>
          <div className="flex items-center gap-1">
            <LanguageSwitcher />
            <Button variant="ghost" size="sm" className="text-[#6e6e73] text-[13px] h-[30px] px-2.5" onClick={signOut}>{t("signOut")}</Button>
          </div>
        </div>
      </header>

      <main id="main-content" tabIndex={-1} className="pt-[68px] pb-[88px]">
        <div className="max-w-lg lg:max-w-5xl xl:max-w-6xl mx-auto px-4 py-5">
          <Suspense fallback={
            <div className="space-y-6 animate-pulse">
              <div className="rounded-[24px] p-6 lg:p-8 bg-[#f5f5f7] border border-[#e5e5ea]/30">
                <div className="h-8 w-3/5 rounded-xl bg-gray-100" />
                <div className="h-4 w-2/5 rounded-xl bg-gray-100 mt-2" />
              </div>
              <div className="grid lg:grid-cols-2 gap-4">
                <div className="h-[88px] rounded-[20px] bg-gray-100" />
                <div className="h-[88px] rounded-[20px] bg-gray-100" />
              </div>
              <div className="h-[140px] rounded-[20px] bg-gray-100" />
            </div>
          }>
            {children}
          </Suspense>
        </div>
      </main>

      {showMoreSheet && (
        <>
          <div className="fixed inset-0 z-20 bg-black/20" onClick={() => setShowMoreSheet(false)} />
          <div className="fixed bottom-[84px] left-4 right-4 z-30 glass-strong rounded-[20px] shadow-[0_-4px_24px_rgba(0,0,0,0.12)] animate-slide-up max-w-lg mx-auto">
            <div className="px-5 py-4 space-y-5 max-h-[55vh] overflow-y-auto">
              {extraNav.map((section) => (
                <div key={section.sectionKey}>
                  <p className="text-[11px] uppercase tracking-wider font-semibold text-[#6e6e73] mb-2 px-1">{t(section.sectionKey)}</p>
                  <div className="grid grid-cols-3 gap-2">
                    {section.items.map((item) => (
                      <Link key={item.href} to={item.href} onClick={() => setShowMoreSheet(false)}
                        className={cn("flex flex-col items-center gap-1.5 py-3 px-2 rounded-[14px] transition-all duration-200",
                          pathname === item.href ? "bg-[#007aff]/10 text-[#007aff]" : "text-[#6e6e73] hover:bg-[#f5f5f7]")}>
                        <item.icon className={cn("w-[22px] h-[22px]", pathname === item.href ? "text-[#007aff]" : "text-[#6e6e73]")} />
                        <span className={cn("text-[10px] font-medium text-center leading-tight", pathname === item.href ? "text-[#007aff]" : "text-[#6e6e73]")}>{t(item.labelKey)}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <nav className="fixed bottom-4 left-4 right-4 z-30 glass-strong rounded-[20px] shadow-[0_8px_32px_rgba(0,0,0,0.12),0_2px_8px_rgba(0,0,0,0.06)] safe-bottom mx-auto max-w-lg nav-bounce">
        <div className="flex items-center justify-around h-[56px] px-2">
          {tabNav.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link key={item.href} to={item.href}
                className={cn("flex flex-col items-center justify-center gap-0.5 py-1 px-2 min-w-[48px] rounded-[12px] transition-all duration-200",
                  isActive ? "bg-[#007aff]/10 text-[#007aff]" : "text-[#6e6e73] hover:bg-[#f5f5f7]")}>
                <item.icon className={cn("w-[22px] h-[22px]", isActive ? "text-[#007aff] tab-pop" : "text-[#6e6e73]")} />
                <span className={cn("text-[10px] font-medium whitespace-nowrap", isActive ? "text-[#007aff]" : "text-[#6e6e73]")}>{t(item.labelKey)}</span>
              </Link>
            )
          })}
          <button onClick={() => setShowMoreSheet(true)} aria-label={t("navMore")}
            className="flex flex-col items-center justify-center gap-0.5 py-1 px-2 min-w-[48px] rounded-[12px] text-[#6e6e73] hover:bg-[#f5f5f7] transition-all duration-200">
            <Grid3X3 className="w-[22px] h-[22px]" />
            <span className="text-[10px] font-medium whitespace-nowrap">{t("navMore")}</span>
          </button>
        </div>
      </nav>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <I18nProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<AuthGuard><AppLayout><PatientDashboard /></AppLayout></AuthGuard>} />
          <Route path="/vault" element={<AuthGuard><AppLayout><Vault /></AppLayout></AuthGuard>} />
          <Route path="/timeline" element={<AuthGuard><AppLayout><Timeline /></AppLayout></AuthGuard>} />
          <Route path="/medications" element={<AuthGuard><AppLayout><Medications /></AppLayout></AuthGuard>} />
          <Route path="/profile" element={<AuthGuard><AppLayout><Profile /></AppLayout></AuthGuard>} />
          <Route path="/emergency" element={<AuthGuard><AppLayout><Emergency /></AppLayout></AuthGuard>} />
          <Route path="/health-checks" element={<AuthGuard><AppLayout><HealthChecks /></AppLayout></AuthGuard>} />
          <Route path="/new-consultation" element={<AuthGuard><AppLayout><NewConsultation /></AppLayout></AuthGuard>} />
          <Route path="/conditions" element={<AuthGuard><AppLayout><Conditions /></AppLayout></AuthGuard>} />
          <Route path="/reminders" element={<AuthGuard><AppLayout><Reminders /></AppLayout></AuthGuard>} />
          <Route path="/share" element={<AuthGuard><AppLayout><Share /></AppLayout></AuthGuard>} />
          <Route path="/records" element={<AuthGuard><AppLayout><ProviderRecords /></AppLayout></AuthGuard>} />
          <Route path="/consultations" element={<AuthGuard><AppLayout><ProviderConsultations /></AppLayout></AuthGuard>} />
          <Route path="/patients" element={<AuthGuard><AppLayout><ProviderPatients /></AppLayout></AuthGuard>} />
          <Route path="/schedule" element={<AuthGuard><AppLayout><ProviderSchedule /></AppLayout></AuthGuard>} />
          <Route path="/messages" element={<AuthGuard><AppLayout><Messages /></AppLayout></AuthGuard>} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" toastOptions={{ style: { borderRadius: "12px", border: "1px solid rgba(0,0,0,0.05)", boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}} />
      <Analytics />
      </I18nProvider>
    </AuthProvider>
  )
}
