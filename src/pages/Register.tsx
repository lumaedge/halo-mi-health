import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Heart, Loader2, ArrowRight } from "lucide-react"
import { supabase } from "@/lib/supabase"

export default function Register() {
  const navigate = useNavigate()
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setPending(true)

    if (!firstName || !lastName || !email || !password) {
      setError("All fields are required")
      setPending(false)
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      setPending(false)
      return
    }

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: `${firstName} ${lastName}` },
      },
    })

    if (signUpError) {
      setError(signUpError.message)
      setPending(false)
      return
    }

    navigate("/login?registered=true")
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7] flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-[400px] animate-fade-in">
          <div className="text-center mb-8">
            <div className="w-[56px] h-[56px] rounded-[16px] bg-[#007aff] flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#007aff]/20">
              <Heart className="w-[28px] h-[28px] text-white" fill="white" />
            </div>
            <h1 className="text-[28px] font-bold text-[#1d1d1f] tracking-tight">Create account</h1>
            <p className="text-[16px] text-[#6e6e73] mt-1">Your health journey starts here</p>
          </div>

          <Card>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First name</Label>
                    <Input
                      id="firstName"
                      placeholder="John"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last name</Label>
                    <Input
                      id="lastName"
                      placeholder="Doe"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                    />
                  </div>
                </div>
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
                    placeholder="At least 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                {error && (
                  <p className="text-[14px] text-[#ff3b30] bg-[#fce8e6] px-4 py-3 rounded-[12px]">{error}</p>
                )}
                <Button type="submit" disabled={pending} className="w-full h-[50px] gap-2">
                  {pending ? (
                    <Loader2 className="w-[18px] h-[18px] animate-spin" />
                  ) : (
                    <>
                      Create account
                      <ArrowRight className="w-[18px] h-[18px]" />
                    </>
                  )}
                </Button>
              </form>
              <div className="mt-6 text-center">
                <p className="text-[14px] text-[#6e6e73]">
                  Already have an account?{" "}
                  <Link to="/login" className="text-[#007aff] font-medium hover:underline">
                    Sign in
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
