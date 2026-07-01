import { useState, useEffect, createContext, useContext, lazy, Suspense } from "react"
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from "react-router-dom"
import { Toaster } from "sonner"
import { supabase } from "@/lib/supabase"
import type { User as SupabaseUser } from "@supabase/supabase-js"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { LayoutDashboard, Clock, Shield, Pill, User, Share2, AlertTriangle, Heart, Menu, X, ClipboardList, Stethoscope } from "lucide-react"

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
  { href: "/timeline", label: "Timeline", icon: Clock },
  { href: "/medications", label: "Meds", icon: Pill },
  { href: "/profile", label: "Profile", icon: User },
]

const drawerNav = [
  { section: "Main", items: tabNav },
  {
    section: "Health",
    items: [
      { href: "/health-checks", label: "Health Checks", icon: ClipboardList },
      { href: "/new-consultation", label: "New Consultation", icon: Stethoscope },
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
  const { profile, signOut } = useAuth()
  const { pathname } = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  const initials = profile?.full_name
    ?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) ?? "U"

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      {menuOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMenuOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-[280px] bg-white shadow-xl animate-slide-in-right">
            <div className="flex items-center justify-between h-[56px] px-4 border-b border-[#e5e5ea]/40">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-[8px] bg-[#007aff] flex items-center justify-center">
                  <Heart className="w-3.5 h-3.5 text-white" fill="white" />
                </div>
                <span className="text-[16px] font-semibold text-[#1d1d1f]">Halo Mi Health</span>
              </div>
              <button onClick={() => setMenuOpen(false)}><X className="w-5 h-5 text-[#6e6e73]" /></button>
            </div>
            <nav className="py-3 px-3 space-y-4 overflow-y-auto flex-1">
              {drawerNav.map((section) => (
                <div key={section.section}>
                  <p className="text-[11px] uppercase tracking-wider font-semibold text-[#6e6e73] px-3 mb-1">{section.section}</p>
                  <div className="space-y-0.5">
                    {section.items.map((item) => (
                      <Link key={item.href} to={item.href} onClick={() => setMenuOpen(false)}
                        className={cn("flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-[14px] font-medium transition-all duration-200",
                          pathname === item.href ? "bg-[#007aff]/10 text-[#007aff]" : "text-[#6e6e73] hover:bg-[#f5f5f7]")}>
                        <item.icon className={cn("w-[18px] h-[18px]", pathname === item.href ? "text-[#007aff]" : "text-[#6e6e73]")} />
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </nav>
            <div className="px-3 py-3 border-t border-[#e5e5ea]/40">
              <div className="flex items-center gap-3 px-3 py-2">
                <Avatar className="w-[32px] h-[32px]"><AvatarFallback className="text-[12px] bg-[#f5f5f7] text-[#6e6e73]">{initials}</AvatarFallback></Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-medium text-[#1d1d1f] truncate">{profile?.full_name}</p>
                  <p className="text-[12px] text-[#6e6e73] truncate">{profile?.email}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-[#e5e5ea]/30">
        <div className="flex items-center justify-between h-[52px] px-5">
          <div className="flex items-center gap-3">
            <button className="p-1 -ml-1" onClick={() => setMenuOpen(true)}><Menu className="w-5 h-5 text-[#1d1d1f]" /></button>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-[6px] bg-[#007aff] flex items-center justify-center">
                <Heart className="w-3 h-3 text-white" fill="white" />
              </div>
              <span className="text-[15px] font-semibold text-[#1d1d1f] tracking-tight">Halo Mi Health</span>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="text-[#6e6e73] text-[13px] h-[30px] px-2.5" onClick={signOut}>Sign out</Button>
        </div>
      </header>

      <main className="pb-[72px]">
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

      <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white/90 backdrop-blur-xl border-t border-[#e5e5ea]/50 safe-bottom">
        <div className="flex items-center justify-around h-[56px] px-2">
          {tabNav.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link key={item.href} to={item.href}
                className={cn("flex flex-col items-center justify-center gap-0.5 py-1 px-3 min-w-[56px] rounded-[8px] transition-all duration-200",
                  isActive ? "text-[#007aff]" : "text-[#6e6e73]")}>
                <item.icon className={cn("w-[22px] h-[22px]", isActive ? "text-[#007aff]" : "text-[#6e6e73]")} />
                <span className={cn("text-[10px] font-medium", isActive ? "text-[#007aff]" : "text-[#6e6e73]")}>{item.label}</span>
              </Link>
            )
          })}
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
