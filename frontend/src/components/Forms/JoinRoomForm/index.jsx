export default function JoinRoomForm({ roomId, setRoomId, busy, autoFocus }) {
  return (
    <>
      <div>
        <label htmlFor="room-id" className="mb-1.5 block text-sm font-medium">Room ID or key</label>
        <input
          id="room-id"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          autoFocus={autoFocus}
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          placeholder="Paste the room ID or saved key"
          className="h-11 w-full rounded-lg border border-line bg-white px-3 font-mono text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/25"
        />
      </div>
      <button type="submit" disabled={busy} className="h-11 w-full rounded-xl bg-primary font-semibold text-white hover:bg-primary-dark disabled:opacity-60">
        {busy ? 'Joining…' : 'Join room'}
      </button>
    </>
  )
}
