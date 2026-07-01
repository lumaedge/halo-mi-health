import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Heart, ArrowRight, Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  useEffect(() => {
    if (window.location.search.includes("registered=true")) {
      toast.success("Account created successfully! Sign in to continue.")
    }
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setPending(true)

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })

    if (signInError) {
      setError(signInError.message)
      setPending(false)
      return
    }

    navigate("/dashboard")
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-[400px] animate-fade-in">
          <div className="text-center mb-8">
            <div className="w-[56px] h-[56px] rounded-[16px] bg-[#007aff] flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#007aff]/20">
              <Heart className="w-[28px] h-[28px] text-white" fill="white" />
            </div>
            <h1 className="text-[28px] font-bold text-white tracking-tight">Welcome back</h1>
            <p className="text-[16px] text-white/60 mt-1">Sign in to your health account</p>
          </div>

          <Card>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Required"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                {error && (
                  <p className="text-[14px] text-[#ff3b30] bg-[#ff3b30]/10 px-4 py-3 rounded-[12px]">{error}</p>
                )}
                <Button type="submit" disabled={pending} className="w-full h-[50px] gap-2">
                  {pending ? (
                    <Loader2 className="w-[18px] h-[18px] animate-spin" />
                  ) : (
                    <>
                      Sign in
                      <ArrowRight className="w-[18px] h-[18px]" />
                    </>
                  )}
                </Button>
              </form>
              <div className="mt-6 text-center">
                <p className="text-[14px] text-white/60">
                  Don&apos;t have an account?{" "}
                  <Link to="/register" className="text-[#007aff] font-medium hover:underline">
                    Create one
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
