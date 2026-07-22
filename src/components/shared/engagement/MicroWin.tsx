import { useState, useRef } from "react"

interface MicroWin {
  id: number
  text: string
  emoji: string
  x: number
}

export function useMicroWin() {
  const [wins, setWins] = useState<MicroWin[]>([])
  const counter = useRef(0)

  function trigger(text: string, emoji = "🎉") {
    const id = ++counter.current
    const x = 10 + Math.random() * 60
    setWins(prev => [...prev, { id, text, emoji, x }])
    setTimeout(() => {
      setWins(prev => prev.filter(w => w.id !== id))
    }, 2500)
  }

  return { trigger, wins }
}

export function MicroWinOverlay({ wins }: { wins: MicroWin[] }) {
  return (
    <div className="fixed inset-0 pointer-events-none z-[100]">
      {wins.map(win => (
        <div
          key={win.id}
          className="absolute bottom-[120px] left-0 right-0 flex justify-center animate-micro-win"
          style={{ left: `${win.x}%` }}
        >
          <div className="bg-white rounded-[20px] px-5 py-3 shadow-[0_8px_32px_rgba(0,0,0,0.15)] border border-[#e5e5ea]/60 flex items-center gap-2.5">
            <span className="text-[22px]">{win.emoji}</span>
            <span className="text-[15px] font-semibold text-[#1d1d1f] whitespace-nowrap">{win.text}</span>
          </div>
        </div>
      ))}
    </div>
  )
}
