import { useMemo, useRef, useState } from 'react'
import { useRoom } from '../../context/RoomContext'
import { socket } from '../../lib/socket'
import { useDismiss } from '../../hooks/useDismiss'
import Avatar from '../Avatar'

export default function UsersBar() {
  const { members } = useRoom()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useDismiss(ref, open, () => setOpen(false))

  const list = useMemo(
    () => [...members].sort((a, b) => (b.role === 'admin') - (a.role === 'admin') || a.username.localeCompare(b.username)),
    [members],
  )
  const shown = list.slice(0, 4)
  const extra = list.length - shown.length

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-label={`${list.length} ${list.length === 1 ? 'person' : 'people'} in this room`}
        onClick={() => setOpen((o) => !o)}
        className="flex items-center rounded-full p-0.5 hover:bg-slate-100"
      >
        <span className="flex -space-x-2">
          {shown.map((m) => <Avatar key={m.id} name={m.username} className="ring-2 ring-white" />)}
        </span>
        {extra > 0 && <span className="mx-1.5 text-xs font-medium text-muted">+{extra}</span>}
      </button>

      {open && (
        <div className="absolute top-full right-0 z-30 mt-2 w-64 rounded-xl border border-line bg-white p-2 shadow-pop">
          <p className="px-2 py-1 text-xs font-medium text-muted">
            {list.length} {list.length === 1 ? 'person' : 'people'} in this room
          </p>
          <ul className="max-h-72 overflow-y-auto">
            {list.map((m) => (
              <li key={m.id} className="flex items-center gap-2.5 rounded-lg px-2 py-1.5">
                <Avatar name={m.username} size={28} />
                <span className="truncate text-sm">{m.username}</span>
                {m.socketId === socket.id && <span className="text-xs text-muted">you</span>}
                {m.role === 'admin' && (
                  <span className="ml-auto rounded-md bg-mint/15 px-1.5 py-0.5 text-xs font-medium text-mint-dark">Host</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
