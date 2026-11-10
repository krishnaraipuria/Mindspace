import { useRoom } from '../../context/RoomContext'

export default function Toast() {
  const { toast } = useRoom()
  if (!toast) return null
  return (
    <div role="status" aria-live="polite" className="pointer-events-none fixed top-20 left-1/2 z-50 -translate-x-1/2 px-3">
      <div className={`rounded-xl px-4 py-2.5 text-sm font-medium text-white shadow-pop ${toast.tone === 'error' ? 'bg-red-600' : 'bg-tool'}`}>
        {toast.message}
      </div>
    </div>
  )
}
