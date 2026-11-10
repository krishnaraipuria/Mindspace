import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getSavedUsername, useRoom } from '../../context/RoomContext'
import CreateRoomForm from './CreateRoomForm'
import JoinRoomForm from './JoinRoomForm'

export default function Forms({ initialRoomId = '', initialError = '' }) {
  const { createRoom, joinRoom } = useRoom()
  const navigate = useNavigate()
  const [username, setUsername] = useState(getSavedUsername)
  const [mode, setMode] = useState(initialRoomId ? 'join' : 'create')
  const [roomId, setRoomId] = useState(initialRoomId)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(initialError)

  const submit = async (e) => {
    e.preventDefault()
    const name = username.trim()
    if (!name) return setError('Enter your name first.')
    if (mode === 'join' && !roomId.trim()) return setError('Enter a room ID or key.')
    setError('')
    setBusy(true)
    try {
      const id = mode === 'create' ? await createRoom(name) : await joinRoom(name, roomId.trim())
      navigate(`/room/${id}`)
    } catch (err) {
      setError(mode === 'join' && err.status === 404 ? 'No room found with that ID or key.' : err.message)
      setBusy(false)
    }
  }

  const tab = (id, label) => (
    <button
      type="button"
      role="tab"
      aria-selected={mode === id}
      onClick={() => { setMode(id); setError('') }}
      className={`h-9 flex-1 rounded-lg text-sm font-medium transition-colors ${mode === id ? 'bg-white shadow-sm' : 'text-muted hover:text-ink'}`}
    >
      {label}
    </button>
  )

  return (
    <form onSubmit={submit} className="space-y-4 rounded-2xl border border-line bg-white p-6 shadow-card">
      <div>
        <label htmlFor="username" className="mb-1.5 block text-sm font-medium">Your name</label>
        <input
          id="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          maxLength={24}
          autoComplete="nickname"
          autoFocus={!username}
          placeholder="e.g. Asha"
          className="h-11 w-full rounded-lg border border-line bg-white px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/25"
        />
      </div>

      <div role="tablist" aria-label="Room action" className="flex gap-1 rounded-xl bg-slate-100 p-1">
        {tab('create', 'Create room')}
        {tab('join', 'Join room')}
      </div>

      {mode === 'create' ? (
        <CreateRoomForm busy={busy} />
      ) : (
        <JoinRoomForm roomId={roomId} setRoomId={setRoomId} busy={busy} autoFocus={!!username} />
      )}

      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
    </form>
  )
}
