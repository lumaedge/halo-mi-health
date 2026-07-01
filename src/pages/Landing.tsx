import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Heart, Shield, Camera, Pill, ArrowRight } from "lucide-react"

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-[#e5e5ea]/30">
        <div className="max-w-6xl mx-auto flex items-center justify-between h-[56px] px-5">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-[8px] bg-[#007aff] flex items-center justify-center">
              <Heart className="w-3.5 h-3.5 text-white" fill="white" />
            </div>
            <span className="text-[16px] font-semibold text-white tracking-tight">Halo Mi Health</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm">Sign in</Button>
            </Link>
            <Link to="/register">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-5 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#e8f0fe] text-[#007aff] text-[13px] font-medium mb-6">
          <Shield className="w-[14px] h-[14px]" />
          Your health data, always within reach
        </div>
        <h1 className="text-[48px] lg:text-[64px] font-bold text-white tracking-tight leading-tight max-w-3xl mx-auto">
          Your health history.
          <br />
          <span className="text-[#007aff]">Always with you.</span>
        </h1>
        <p className="text-[18px] text-[#6e6e73] mt-4 max-w-xl mx-auto leading-relaxed">
          Halo Mi Health bridges handwritten notes and digital health records.
          Upload photos of your prescriptions, referrals, and lab results.
        </p>
        <div className="flex items-center justify-center gap-4 mt-8">
          <Link to="/register">
            <Button size="xl" className="gap-2">
              Start for free
              <ArrowRight className="w-[20px] h-[20px]" />
            </Button>
          </Link>
          <Link to="/login">
            <Button variant="outline" size="xl">Sign in</Button>
          </Link>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-5 pb-20">
        <div className="grid md:grid-cols-3 gap-4">
          <div className="apple-card-static p-6 text-center">
            <div className="w-[48px] h-[48px] rounded-[14px] bg-[#e8f0fe] flex items-center justify-center mx-auto mb-4">
              <Camera className="w-[24px] h-[24px] text-[#007aff]" />
            </div>
            <h3 className="text-[17px] font-semibold text-white">Snap a photo</h3>
            <p className="text-[14px] text-[#6e6e73] mt-1">Take a picture of handwritten notes from your doctor.</p>
          </div>
          <div className="apple-card-static p-6 text-center">
            <div className="w-[48px] h-[48px] rounded-[14px] bg-[#e8f5e9] flex items-center justify-center mx-auto mb-4">
              <Shield className="w-[24px] h-[24px] text-[#34c759]" />
            </div>
            <h3 className="text-[17px] font-semibold text-white">Secure vault</h3>
            <p className="text-[14px] text-[#6e6e73] mt-1">All records encrypted and stored safely.</p>
          </div>
          <div className="apple-card-static p-6 text-center">
            <div className="w-[48px] h-[48px] rounded-[14px] bg-[#fef0d9] flex items-center justify-center mx-auto mb-4">
              <Pill className="w-[24px] h-[24px] text-[#ff9f0a]" />
            </div>
            <h3 className="text-[17px] font-semibold text-white">Stay organised</h3>
            <p className="text-[14px] text-[#6e6e73] mt-1">Track medications, appointments, and more.</p>
          </div>
        </div>
      </section>
    </div>
  )
}
