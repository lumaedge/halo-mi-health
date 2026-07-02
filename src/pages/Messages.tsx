import { useState, useEffect, useRef } from "react"
import { useAuth } from "@/App"
import { useI18n } from "@/lib/i18n/I18nProvider"
import { supabase } from "@/lib/supabase"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send, MessageCircle, User } from "lucide-react"
import type { Message } from "@/types"
import { toast } from "sonner"

export default function Messages() {
  const { t } = useI18n()
  const { user, profile } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [content, setContent] = useState("")
  const [loading, setLoading] = useState(true)
  const [providers, setProviders] = useState<{ id: string; full_name: string }[]>([])
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!user) return
    async function loadProviders() {
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name")
        .eq("role", "provider")
        .limit(10)
      if (data) setProviders(data)
    }
    loadProviders()
  }, [user])

  useEffect(() => {
    if (!user || !selectedProvider) return
    async function loadMessages() {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${selectedProvider}),and(sender_id.eq.${selectedProvider},receiver_id.eq.${user.id})`)
        .order("created_at", { ascending: true })
      if (data) setMessages(data)
      setLoading(false)
    }
    loadMessages()

    const channel = supabase
      .channel("messages")
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `or(and(sender_id=eq.${user.id},receiver_id=eq.${selectedProvider}),and(sender_id=eq.${selectedProvider},receiver_id=eq.${user.id}))`,
      }, (payload) => {
        setMessages(prev => [...prev, payload.new as Message])
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [user, selectedProvider])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  async function sendMessage() {
    if (!user || !selectedProvider || !content.trim()) return
    const { error } = await supabase.from("messages").insert({
      sender_id: user.id,
      receiver_id: selectedProvider,
      content: content.trim(),
    })
    if (error) toast.error(t("error") + ": " + error.message)
    setContent("")
  }

  if (!selectedProvider) {
    return (
      <div className="space-y-4 animate-fade-in">
        <h1 className="text-[28px] font-bold text-[#1d1d1f] tracking-tight">{t("messages")}</h1>
        <p className="text-[15px] text-[#6e6e73]">{t("startConversation")}</p>
        <div className="grid gap-3">
          {providers.map(p => (
            <button
              key={p.id}
              onClick={() => setSelectedProvider(p.id)}
              className="flex items-center gap-4 p-4 bg-white rounded-[16px] shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-md transition-all text-left w-full"
            >
              <div className="w-12 h-12 rounded-full bg-[#e8f0fe] flex items-center justify-center">
                <User className="w-6 h-6 text-[#007aff]" />
              </div>
              <div>
                <p className="text-[16px] font-semibold text-[#1d1d1f]">{p.full_name}</p>
                <p className="text-[13px] text-[#6e6e73]">{t("messages")}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] animate-fade-in">
      <div className="flex items-center gap-3 mb-4">
        <Button variant="ghost" size="sm" onClick={() => setSelectedProvider(null)}>
          {t("back")}
        </Button>
        <h1 className="text-[20px] font-bold text-[#1d1d1f]">
          {providers.find(p => p.id === selectedProvider)?.full_name ?? t("messages")}
        </h1>
      </div>

      <Card className="flex-1 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="flex justify-center py-8"><div className="w-5 h-5 border-2 border-[#007aff] border-t-transparent rounded-full animate-spin" /></div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-8">
              <MessageCircle className="w-10 h-10 text-[#6e6e73] mb-3" />
              <p className="text-[15px] text-[#6e6e73]">{t("noMessages")}</p>
            </div>
          ) : (
            messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.sender_id === user.id ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[75%] rounded-[18px] px-4 py-2.5 ${
                  msg.sender_id === user.id
                    ? "bg-[#007aff] text-white rounded-br-[4px]"
                    : "bg-[#f5f5f7] text-[#1d1d1f] rounded-bl-[4px]"
                }`}>
                  <p className="text-[15px] leading-relaxed">{msg.content}</p>
                  <p className={`text-[11px] mt-1 ${msg.sender_id === user.id ? "text-white/60" : "text-[#6e6e73]"}`}>
                    {new Date(msg.created_at).toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>

        <div className="p-3 border-t border-[#e5e5ea]/40">
          <form onSubmit={e => { e.preventDefault(); sendMessage() }} className="flex gap-2">
            <Input
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder={t("messagePlaceholder")}
              className="flex-1"
            />
            <Button type="submit" size="icon" disabled={!content.trim()}>
              <Send className="w-[18px] h-[18px]" />
            </Button>
          </form>
        </div>
      </Card>
    </div>
  )
}
