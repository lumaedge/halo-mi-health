import { useState, useEffect, createContext, useContext, lazy, Suspense } from "react"
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from "react-router-dom"
import { Toaster } from "sonner"
import { supabase } from "@/lib/supabase"
import type { User as SupabaseUser } from "@supabase/supabase-js"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { LayoutDashboard, Clock, Shield, Pill, User, Share2, AlertTriangle, Heart, ClipboardList, Sparkles, Bell, HeartPulse, ChevronUp } from "lucide-react"

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
    const email = u.email ?? ""
    const fullName = u.user_metadata?.full_name ?? email.split("@")[0] ?? "User"
    setProfile({ id: u.id, role: "patient", full_name: fullName, email })
  }

  const refreshProfile = async () => {
    if (user) await fetchProfile(user)
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) { setUser(session.user); fetchProfile(session.user) }
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) { setUser(session.user); fetchProfile(session.user) }
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

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#f5f5f7]"><div className="w-6 h-6 border-2 border-[#007aff] border-t-transparent rounded-full animate-spin" /></div>
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />
  return <>{children}</>
}

const tabNav = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/vault", label: "Records", icon: Shield },
  { href: "/conditions", label: "Conditions", icon: HeartPulse },
  { href: "/timeline", label: "Timeline", icon: Clock },
  { href: "/medications", label: "Medications", icon: Pill },
  { href: "/profile", label: "Profile", icon: User },
]

const extraNav = [
  {
    section: "Health",
    items: [
      { href: "/reminders", label: "Reminders", icon: Bell },
      { href: "/health-checks", label: "Health Checks", icon: ClipboardList },
      { href: "/new-consultation", label: "AI Symptom Check", icon: Sparkles },
    ],
  },
  {
    section: "Safety",
    items: [
      { href: "/emergency", label: "Emergency Card", icon: AlertTriangle },
      { href: "/share", label: "Share Records", icon: Share2 },
    ],
  },
]

function AppLayout({ children }: { children: React.ReactNode }) {
  const { signOut } = useAuth()
  const { pathname } = useLocation()
  const [navExpanded, setNavExpanded] = useState(false)

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-[#e5e5ea]/30">
        <div className="flex items-center justify-between h-[52px] px-5">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-[6px] bg-[#007aff] flex items-center justify-center">
              <Heart className="w-3 h-3 text-white" fill="white" />
            </div>
            <span className="text-[15px] font-semibold text-[#1d1d1f] tracking-tight">Halo Mi Health</span>
          </div>
          <Button variant="ghost" size="sm" className="text-[#6e6e73] text-[13px] h-[30px] px-2.5" onClick={signOut}>Sign out</Button>
        </div>
      </header>

      <main className={cn("transition-all duration-300", navExpanded ? "pb-[200px]" : "pb-[72px]")}>
        <div className="max-w-lg mx-auto px-4 py-5">
          <Suspense fallback={
            <div className="flex items-center justify-center h-[50vh]">
              <div className="w-6 h-6 border-2 border-[#007aff] border-t-transparent rounded-full animate-spin" />
            </div>
          }>
            {children}
          </Suspense>
        </div>
      </main>

      {navExpanded && (
        <>
          <div className="fixed inset-0 z-20 bg-black/20" onClick={() => setNavExpanded(false)} />
          <div className="fixed bottom-[56px] left-0 right-0 z-30 bg-white/95 backdrop-blur-xl border-t border-[#e5e5ea]/50 rounded-t-[20px] shadow-[0_-4px_20px_rgba(0,0,0,0.08)] animate-slide-up">
            <div className="px-5 py-4 space-y-5 max-h-[40vh] overflow-y-auto">
              {extraNav.map((section) => (
                <div key={section.section}>
                  <p className="text-[11px] uppercase tracking-wider font-semibold text-[#6e6e73] mb-2 px-1">{section.section}</p>
                  <div className="grid grid-cols-3 gap-2">
                    {section.items.map((item) => (
                      <Link key={item.href} to={item.href} onClick={() => setNavExpanded(false)}
                        className={cn("flex flex-col items-center gap-1.5 py-3 px-2 rounded-[14px] transition-all duration-200",
                          pathname === item.href ? "bg-[#007aff]/10 text-[#007aff]" : "text-[#6e6e73] hover:bg-[#f5f5f7]")}>
                        <item.icon className={cn("w-[22px] h-[22px]", pathname === item.href ? "text-[#007aff]" : "text-[#6e6e73]")} />
                        <span className={cn("text-[10px] font-medium text-center leading-tight", pathname === item.href ? "text-[#007aff]" : "text-[#6e6e73]")}>{item.label}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white/90 backdrop-blur-xl border-t border-[#e5e5ea]/50 safe-bottom">
        <div className="flex items-center justify-around h-[56px] px-2">
          {tabNav.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link key={item.href} to={item.href}
                className={cn("flex flex-col items-center justify-center gap-0.5 py-1 px-2 min-w-[48px] rounded-[8px] transition-all duration-200",
                  isActive ? "text-[#007aff]" : "text-[#6e6e73]")}>
                <item.icon className={cn("w-[22px] h-[22px]", isActive ? "text-[#007aff]" : "text-[#6e6e73]")} />
                <span className={cn("text-[10px] font-medium whitespace-nowrap", isActive ? "text-[#007aff]" : "text-[#6e6e73]")}>{item.label}</span>
              </Link>
            )
          })}
          <button onClick={() => setNavExpanded(!navExpanded)}
            className="flex flex-col items-center justify-center gap-0.5 py-1 px-2 min-w-[48px] rounded-[8px] text-[#6e6e73] transition-all duration-200">
            <ChevronUp className={cn("w-[22px] h-[22px] transition-transform duration-300", navExpanded && "rotate-180")} />
            <span className="text-[10px] font-medium whitespace-nowrap">More</span>
          </button>
        </div>
      </nav>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
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
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" toastOptions={{ style: { borderRadius: "12px", border: "1px solid rgba(0,0,0,0.05)", boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}} />
    </AuthProvider>
  )
}
