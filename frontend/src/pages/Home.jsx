import { useEffect } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import { useRoom } from '../context/RoomContext'
import Forms from '../components/Forms'
import { Logo } from '../components/icons'

export default function Home() {
  const { leaveRoom } = useRoom()
  const [params] = useSearchParams()
  const location = useLocation()

  useEffect(() => { leaveRoom() }, [leaveRoom])
  useEffect(() => { document.title = 'MindSpace' }, [])

  return (
    <div className="dot-grid min-h-dvh">
      <header className="flex items-center gap-2.5 px-5 py-5 sm:px-8">
        <Logo />
        <span className="text-lg font-semibold tracking-tight">MindSpace</span>
      </header>

      <main className="mx-auto grid max-w-5xl items-center gap-12 px-5 pt-6 pb-16 sm:px-8 lg:grid-cols-[1fr_420px] lg:pt-20">
        <section>
          <h1 className="max-w-md text-4xl leading-[1.1] font-bold tracking-tight sm:text-5xl">
            Think out loud, together.
          </h1>
          <p className="mt-4 max-w-md text-lg leading-relaxed text-muted">
            One shared board. Everyone in the room can draw, write and erase at the same time.
          </p>
          <MiniDiagram />
        </section>

        <Forms initialRoomId={params.get('room') || ''} initialError={location.state?.error || ''} />
      </main>
    </div>
  )
}

// Decorative sketch in the style of the board.
function MiniDiagram() {
  return (
    <svg viewBox="0 0 420 150" className="mt-10 hidden w-full max-w-md lg:block" aria-hidden="true">
      <g fill="#fff" stroke="#c9ceda" strokeWidth="1.5">
        <rect x="8" y="14" width="120" height="48" rx="8" />
        <rect x="260" y="78" width="140" height="48" rx="8" />
      </g>
      <g fontFamily="Inter, sans-serif" fontSize="14" fontWeight="600" fill="#16181d">
        <text x="68" y="43" textAnchor="middle">Idea</text>
        <text x="330" y="107" textAnchor="middle">Plan</text>
      </g>
      <path d="M128 38 C 200 38, 190 102, 258 102" fill="none" stroke="#f0903c" strokeWidth="2" strokeLinecap="round" />
      <circle cx="128" cy="38" r="5" fill="#f0903c" />
      <circle cx="260" cy="102" r="5" fill="#5fbf9f" />
      <path d="M20 128c18-26 34-26 48-4s30 14 52-12" fill="none" stroke="#4468d4" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}
