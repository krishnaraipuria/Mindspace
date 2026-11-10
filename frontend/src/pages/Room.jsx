import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useRoom } from '../context/RoomContext'
import Header from '../components/Header'
import Whiteboard from '../components/Whiteboard'
import Toolbar from '../components/Toolbar'
import StyleBar from '../components/StyleBar'
import { Logo } from '../components/icons'

export default function Room() {
  const { roomId } = useParams()
  const navigate = useNavigate()
  const { session, resumeRoom } = useRoom()
  const [tool, setTool] = useState('pen')
  const [style, setStyle] = useState({ color: '#1f2937', width: 4, fill: false, sketchy: false })

  const inRoom = session?.roomId === roomId

  useEffect(() => {
    if (inRoom) return
    let alive = true
    resumeRoom(roomId).catch((err) => {
      if (alive) navigate(`/?room=${encodeURIComponent(roomId)}`, { replace: true, state: { error: err.message } })
    })
    return () => { alive = false }
  }, [inRoom, roomId, resumeRoom, navigate])

  useEffect(() => {
    if (inRoom) document.title = `Room ${roomId} · MindSpace`
  }, [inRoom, roomId])

  if (!inRoom) {
    return (
      <div className="dot-grid grid min-h-dvh place-items-center">
        <div role="status" className="flex items-center gap-3 text-muted">
          <Logo size={28} /> Joining room…
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-dvh flex-col bg-white">
      <Header />
      <main className="relative min-h-0 flex-1">
        <Whiteboard tool={tool} setTool={setTool} style={style} />
        <Toolbar tool={tool} setTool={setTool} />
        <StyleBar tool={tool} style={style} setStyle={setStyle} />
      </main>
    </div>
  )
}
